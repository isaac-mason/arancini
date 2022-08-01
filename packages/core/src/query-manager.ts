import { ComponentClass } from './component';
import { Entity } from './entity';
import { Query, QueryBitSets, QueryDescription } from './query';
import { BitSet } from './utils/bit-set';
import { World } from './world';

/**
 * QueryManager is an internal class that manages Query class instances
 * @private internal class, do not use directly
 */
export class QueryManager {
  /**
   * A map of active query dedupe strings to query instances
   */
  activeQueries: Map<string, Query> = new Map();

  /**
   * The World the QueryManager is in
   */
  private world: World;

  /**
   * Constructor for a QueryManager
   * @param world the World the QueryManager is in
   */
  constructor(world: World) {
    this.world = world;
  }

  /**
   * Retrieves a query by a query description
   * Adds a query to the query manager if one with the description does not already exist
   * If the query already exists, it is returned
   * @param queryDescription the query to add
   */
  createQuery(queryDescription: QueryDescription): Query {
    const query = this.getQuery(queryDescription);
    this.activeQueries.set(query.key, query);
    return query;
  }

  /**
   * Retrieves a query by a query description
   * If the query already exists, it is returned
   * @param queryDescription the query to add
   */
  getQuery(queryDescription: QueryDescription): Query {
    const dedupeString = Query.getDescriptionDedupeString(queryDescription);

    const existingQuery = this.activeQueries.get(dedupeString);
    if (existingQuery) {
      return existingQuery;
    }

    // check if the query is valid
    // must have at least one query type, and must not have an empty array of components
    const isArray = Array.isArray(queryDescription);
    if (
      (isArray && queryDescription.length === 0) ||
      (!isArray &&
        ((!queryDescription.all &&
          !queryDescription.any &&
          !queryDescription.not) ||
          (queryDescription.all && queryDescription.all.length === 0) ||
          (queryDescription.any && queryDescription.any.length === 0) ||
          (queryDescription.not && queryDescription.not.length === 0)))
    ) {
      throw new Error('Query must have at least one condition');
    }

    // get set of components mentioned in the query
    const queryComponents = isArray
      ? queryDescription
      : Array.from(
          new Set<ComponentClass>([
            ...(queryDescription.all ? queryDescription.all : []),
            ...(queryDescription.any ? queryDescription.any : []),
            ...(queryDescription.not ? queryDescription.not : []),
          ])
        );

    const queryBitSets = this.getQueryBitSets(queryDescription);

    // construct the query
    const query = new Query(
      dedupeString,
      queryComponents,
      queryDescription,
      queryBitSets
    );

    // get query results
    const matches = this.getQueryResults(query.bitSets);
    for (const entity of matches.values()) {
      query.all.push(entity);
      query.added.push(entity);
      query.set.add(entity);
    }

    return query;
  }

  getQueryBitSets(queryDescription: QueryDescription): QueryBitSets {
    // build bitsets for the queries
    const { all, any, not } = Array.isArray(queryDescription)
      ? { all: queryDescription, any: undefined, not: undefined }
      : queryDescription;

    const queryBitSets: QueryBitSets = {};

    queryBitSets.all = all
      ? new BitSet(
          all.map((component) =>
            this.world.componentRegistry.getComponentIndex(component)
          )
        )
      : undefined;

    queryBitSets.any = any
      ? new BitSet(
          any.map((component) =>
            this.world.componentRegistry.getComponentIndex(component)
          )
        )
      : undefined;

    queryBitSets.not = not
      ? new BitSet(
          not.map((component) =>
            this.world.componentRegistry.getComponentIndex(component)
          )
        )
      : undefined;

    return queryBitSets;
  }

  /**
   * Returns whether the query manager has the query
   * @param queryDescription the query description to check for
   */
  hasQuery(queryDescription: QueryDescription): boolean {
    const dedupeString = Query.getDescriptionDedupeString(queryDescription);
    return this.activeQueries.has(dedupeString);
  }

  /**
   * Updates queries after a component has been added to or removed from an entity
   * @param entity the query
   */
  onEntityComponentChange(entity: Entity): void {
    for (const query of this.activeQueries.values()) {
      const currentlyInQuery = query.set.has(entity);

      const shouldBeInQuery = this.matchesQueryConditions(
        query.bitSets,
        entity
      );

      if (shouldBeInQuery && !currentlyInQuery) {
        query.all.push(entity);
        query.added.push(entity);
        query.set.add(entity);
      } else if (!shouldBeInQuery && currentlyInQuery) {
        const index = query.all.indexOf(entity, 0);
        if (index !== -1) {
          query.all.splice(index, 1);
        }
        query.set.delete(entity);
        query.removed.push(entity);
      }
    }
  }

  /**
   * Updates queries after a query has been removed from the World
   * @param entity the query
   */
  onEntityRemoved(entity: Entity): void {
    for (const query of this.activeQueries.values()) {
      const index = query.all.indexOf(entity, 0);
      if (index !== -1) {
        query.all.splice(index, 1);
      }
      query.removed.push(entity);
      query.set.delete(entity);
    }
  }

  /**
   * Executes a query and returns a set of the matching Entities.
   * By default the query is freshly evaluated, regardless of whether a query with the same description already exists in the world.
   * If `options.useExisting` is true, results are taken from an existing query if present.
   * @param queryDescription the query description
   */
  query(queryDescription: QueryDescription): Entity[] {
    const key = Query.getDescriptionDedupeString(queryDescription);

    const query = this.activeQueries.get(key);

    if (query) {
      return query.all;
    }

    return this.getQueryResults(this.getQueryBitSets(queryDescription));
  }

  /**
   * Removes a query from the query manager
   * @param query the query to remove
   */
  removeQuery(query: Query): void {
    this.activeQueries.delete(query.key);
  }

  /**
   * Clears query change arrays after world updates
   */
  clearAddedAndRemoved(): void {
    // clear the added and removed arrays for all queries
    for (const query of this.activeQueries.values()) {
      query.added = [];
      query.removed = [];
    }
  }

  private matchesQueryConditions(
    queryBitSets: QueryBitSets,
    entity: Entity
  ): boolean {
    if (
      queryBitSets.all &&
      !entity.componentsBitSet.containsAll(queryBitSets.all)
    ) {
      return false;
    }

    if (
      queryBitSets.any &&
      !entity.componentsBitSet.containsAny(queryBitSets.any)
    ) {
      return false;
    }

    if (
      queryBitSets.not &&
      entity.componentsBitSet.containsAny(queryBitSets.not)
    ) {
      return false;
    }

    return true;
  }

  private getQueryResults(queryBitSets: QueryBitSets): Entity[] {
    const matches: Entity[] = [];
    for (const space of this.world.spaceManager.spaces.values()) {
      for (const entity of space.entities.values()) {
        if (this.matchesQueryConditions(queryBitSets, entity)) {
          matches.push(entity);
        }
      }
    }

    return matches;
  }
}
