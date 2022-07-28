import { Component, ComponentClass } from '../component';
import { Entity } from '../entity';
import { Query, QueryDescription } from '../query';
import { World } from '../world';

/**
 * QueryManager is an internal class that manages Query class instances
 * @private internal class, do not use directly
 */
export class QueryManager {
  /**
   * A map of query dedupe strings to query instances
   */
  queries: Map<string, Query> = new Map();

  private destroyedEntities: Set<Entity> = new Set();

  private entityCompositionChangesBuffer: Map<Entity, ComponentClass[]> =
    new Map();

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
  getQuery(queryDescription: QueryDescription): Query {
    const dedupeString = Query.getDescriptionDedupeString(queryDescription);

    const existingQuery = this.queries.get(dedupeString);
    if (existingQuery) {
      return existingQuery;
    }

    const query = new Query(queryDescription);

    const matches = this.getQueryResults(query.description);
    for (const entity of matches.values()) {
      query.all.push(entity);
      query.added.push(entity);
      query.set.add(entity);
    }

    this.queries.set(dedupeString, query);

    return query;
  }

  /**
   * Returns whether the query manager has the query
   * @param queryDescription the query description to check for
   */
  hasQuery(queryDescription: QueryDescription): boolean {
    const dedupeString = Query.getDescriptionDedupeString(queryDescription);
    return this.queries.has(dedupeString);
  }

  /**
   * Updates queries after a component has been added to an entity
   * @param entity the query
   * @param component the component added to the query
   */
  onEntityComponentAdded(entity: Entity, component: Component): void {
    const compositionChanges = this.entityCompositionChangesBuffer.get(entity);

    if (!compositionChanges) {
      this.entityCompositionChangesBuffer.set(entity, [component.class]);
    } else {
      compositionChanges.push(component.class);
    }
  }

  /**
   * Updates queries after a component has been removed from an entity
   * @param entity the query
   * @param component the component added to the query
   */
  onEntityComponentRemoved(entity: Entity, component: Component): void {
    const compositionChanges = this.entityCompositionChangesBuffer.get(entity);

    if (!compositionChanges) {
      this.entityCompositionChangesBuffer.set(entity, [component.class]);
    } else {
      compositionChanges.push(component.class);
    }
  }

  /**
   * Updates queries after a query has been removed from the World
   * @param entity the query
   */
  onEntityRemoved(entity: Entity): void {
    this.destroyedEntities.add(entity);
  }

  /**
   * Executes a query and returns a set of the matching Entities.
   * By default the query is freshly evaluated, regardless of whether a query with the same description already exists in the world.
   * If `options.useExisting` is true, results are taken from an existing query if present.
   * @param queryDescription the query description
   * @param options options for the query
   */
  query(
    queryDescription: QueryDescription,
    options: { useExisting: boolean } = { useExisting: false }
  ): Entity[] {
    const key = Query.getDescriptionDedupeString(queryDescription);

    if (options.useExisting) {
      const existingQuery = this.queries.get(key);
      if (existingQuery) {
        return existingQuery.all;
      }
    }

    return this.getQueryResults(queryDescription);
  }

  /**
   * Removes a query from the query manager
   * @param query the query to remove
   */
  removeQuery(query: Query): void {
    this.queries.delete(query.key);
  }

  /**
   * Updates queries with buffered entity and component events
   */
  update(): void {
    // clear the added and removed arrays for all queries
    for (const query of this.queries.values()) {
      query.added = [];
      query.removed = [];
    }

    // empty the entity removals buffer
    const { destroyedEntities } = this;
    this.destroyedEntities = new Set();

    // remove destroyed entities from all queries
    for (const destroyedEntity of destroyedEntities) {
      for (const query of this.queries.values()) {
        const index = query.all.findIndex((e) => e === destroyedEntity);

        if (index !== -1) {
          query.all.splice(index, 1);
        }

        query.set.delete(destroyedEntity);
      }

      this.entityCompositionChangesBuffer.delete(destroyedEntity);
    }

    // swap the blue and green entity composition change buffers
    const entityCompositionChanges = this.entityCompositionChangesBuffer;
    this.entityCompositionChangesBuffer = new Map();

    for (const [entity, components] of entityCompositionChanges) {
      for (const query of this.queries.values()) {
        // determine whether the composition change is relevant to this query
        if (
          // if the only condition is a `not` condition, the entity should be reindexed
          (!Array.isArray(query.description) &&
            query.description.one === undefined &&
            query.description.all === undefined &&
            query.description.not !== undefined) ||
          // if one of the components in the composition change is involved in the query, the entity should be reindexed
          this.hasIntersection(query.components, components)
        ) {
          const entityCurrentlyInQuery = query.set.has(entity);

          const matchesQueryConditions = this.matchesQueryConditions(
            query.description,
            entity
          );

          if (matchesQueryConditions && !entityCurrentlyInQuery) {
            query.all.push(entity);
            query.added.push(entity);
            query.set.add(entity);
          } else if (!matchesQueryConditions && entityCurrentlyInQuery) {
            const index = query.all.findIndex((e) => e === entity);
            if (index !== -1) {
              query.all.splice(index, 1);
            }
            query.set.delete(entity);
            query.removed.push(entity);
          }
        }
      }
    }

    // clear the entity composition changes map
    entityCompositionChanges.clear();
  }

  private matchesQueryConditions(
    queryDescription: QueryDescription,
    entity: Entity
  ): boolean {
    if (Array.isArray(queryDescription)) {
      return queryDescription.every((c) => entity.components.has(c));
    }

    if (
      queryDescription.not &&
      queryDescription.not.some((c) => entity.components.has(c))
    ) {
      return false;
    }

    if (
      queryDescription.all &&
      queryDescription.all.some((c) => !entity.components.has(c))
    ) {
      return false;
    }
    if (
      queryDescription.one &&
      queryDescription.one.every((c) => !entity.components.has(c))
    ) {
      return false;
    }

    return true;
  }

  private getQueryResults(queryDescription: QueryDescription): Entity[] {
    const matches: Entity[] = [];
    for (const space of this.world.spaceManager.spaces.values()) {
      for (const entity of space.entities.values()) {
        if (this.matchesQueryConditions(queryDescription, entity)) {
          matches.push(entity);
        }
      }
    }

    return matches;
  }

  private hasIntersection(a: ComponentClass[], b: ComponentClass[]): boolean {
    const setB = new Set(b);
    return [...new Set(a)].filter((x) => setB.has(x)).length !== 0;
  }
}
