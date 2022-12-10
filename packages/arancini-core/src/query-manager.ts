import type { Entity } from './entity';
import type { QueryBitSets, QueryDescription } from './query';
import { Query } from './query';
import { BitSet } from './utils/bit-set';
import type { World } from './world';

type DedupedQuery = {
  dedupeString: string;
  instances: Set<Query>;
  description: QueryDescription;
  bitSets: QueryBitSets;
  entities: Entity[];
  entitySet: Set<Entity>;
};

/**
 * QueryManager is an internal class that manages Query instances
 *
 * @private internal class, do not use directly
 */
export class QueryManager {
  /**
   * Deduped Queries in the QueryManager
   */
  dedupedQueries: Map<string, DedupedQuery> = new Map();

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
   * Creates a new query by a query description
   * @param queryDescription the description of the query to create
   */
  createQuery(queryDescription: QueryDescription): Query {
    const dedupeString = Query.getDescriptionDedupeString(queryDescription);

    let dedupedQuery = this.dedupedQueries.get(dedupeString);

    if (dedupedQuery === undefined) {
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

      dedupedQuery = {
        dedupeString,
        instances: new Set(),
        description: queryDescription,
        bitSets: this.getQueryBitSets(queryDescription),
        entities: [],
        entitySet: new Set(),
      };

      const matches = this.getQueryResults(dedupedQuery.bitSets);

      for (const entity of matches.values()) {
        dedupedQuery.entities.push(entity);
        dedupedQuery.entitySet.add(entity);
      }

      this.dedupedQueries.set(dedupeString, dedupedQuery);
    }

    const newQueryInstance = new Query(this.world, dedupeString);
    newQueryInstance.entities = dedupedQuery.entities;

    dedupedQuery.instances.add(newQueryInstance);

    return newQueryInstance;
  }

  /**
   * Returns whether the query manager has the query
   * @param queryDescription the query description to check for
   */
  hasQuery(queryDescription: QueryDescription): boolean {
    const dedupeString = Query.getDescriptionDedupeString(queryDescription);
    return this.dedupedQueries.has(dedupeString);
  }

  /**
   * Updates queries after a component has been added to or removed from an entity
   * @param entity the query
   */
  onEntityComponentChange(entity: Entity): void {
    for (const query of this.dedupedQueries.values()) {
      const entityInQuery = query.entitySet.has(entity);

      const matchesQuery = this.matchesQueryConditions(query.bitSets, entity);

      if (matchesQuery && !entityInQuery) {
        query.entities.push(entity);
        query.entitySet.add(entity);

        for (const queryInstance of query.instances) {
          queryInstance.onEntityAdded.emit(entity);
        }
      } else if (!matchesQuery && entityInQuery) {
        const index = query.entities.indexOf(entity, 0);
        if (index !== -1) {
          query.entities.splice(index, 1);
        }
        query.entitySet.delete(entity);

        for (const queryInstance of query.instances) {
          queryInstance.onEntityRemoved.emit(entity);
        }
      }
    }
  }

  /**
   * Updates queries after a query has been removed from the World
   * @param entity the query
   */
  onEntityRemoved(entity: Entity): void {
    for (const dedupedQuery of this.dedupedQueries.values()) {
      const index = dedupedQuery.entities.indexOf(entity, 0);
      if (index !== -1) {
        dedupedQuery.entities.splice(index, 1);
      }
      dedupedQuery.entitySet.delete(entity);

      for (const queryInstance of dedupedQuery.instances) {
        queryInstance.onEntityRemoved.emit(entity);
      }
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

    const query = this.dedupedQueries.get(key);

    if (query) {
      return query.entities;
    }

    return this.getQueryResults(this.getQueryBitSets(queryDescription));
  }

  /**
   * Removes a query from the query manager
   * @param query the query to remove
   */
  removeQuery(query: Query): void {
    const dedupedQuery = this.dedupedQueries.get(query.key);
    if (dedupedQuery === undefined || !dedupedQuery.instances.has(query)) {
      return;
    }

    dedupedQuery.instances.delete(query);
    query.onEntityAdded.clear();
    query.onEntityRemoved.clear();

    if (dedupedQuery.instances.size === 0) {
      this.dedupedQueries.delete(dedupedQuery.dedupeString);
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

  private getQueryBitSets(queryDescription: QueryDescription): QueryBitSets {
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
}
