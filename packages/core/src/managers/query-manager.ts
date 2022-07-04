import { Component, ComponentClass } from '../component';
import { Entity } from '../entity';
import { Query, QueryDescription } from '../query';
import { World } from '../world';

enum QueryManagerEventType {
  ENTITY_COMPONENT_ADDED_EVENT = 'ENTITY_COMPONENT_ADDED_EVENT',
  ENTITY_COMPONENT_REMOVED_EVENT = 'ENTITY_COMPONENT_REMOVED_EVENT',
  ENTITY_REMOVED_EVENT = 'ENTITY_REMOVED_EVENT',
}

type EntityRemovedEvent = {
  entity: Entity;
  type: QueryManagerEventType.ENTITY_REMOVED_EVENT;
};

/**
 * QueryManager is an internal class that manages Query class instances
 * @private internal class, do not use directly
 */
export class QueryManager {
  /**
   * A map of query dedupe strings to query instances
   */
  queries: Map<string, Query> = new Map();

  private entityRemovalsBuffer: EntityRemovedEvent[] = [];

  private entityCompositionChangesBufferGreen: Map<Entity, ComponentClass[]> =
    new Map();

  private entityCompositionChangesBufferBlue: Map<Entity, ComponentClass[]> =
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
    const compositionChanges =
      this.entityCompositionChangesBufferGreen.get(entity);

    if (!compositionChanges) {
      this.entityCompositionChangesBufferGreen.set(entity, [component.class]);
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
    const compositionChanges =
      this.entityCompositionChangesBufferGreen.get(entity);

    if (!compositionChanges) {
      this.entityCompositionChangesBufferGreen.set(entity, [component.class]);
    } else {
      compositionChanges.push(component.class);
    }
  }

  /**
   * Updates queries after a query has been removed from the RECS
   * @param entity the query
   */
  onEntityRemoved(entity: Entity): void {
    this.entityRemovalsBuffer.push({
      type: QueryManagerEventType.ENTITY_REMOVED_EVENT,
      entity,
    });
  }

  /**
   * Executes a query and returns a set of the matching Entities
   *
   * If the query already exists in a system, the results are taken from the existing query.
   * If it does not exist, the query is executed once-off.
   *
   * @param queryDescription the query description
   */
  query(
    queryDescription: QueryDescription,
    options?: { useExisting: boolean }
  ): Entity[] {
    const key = Query.getDescriptionDedupeString(queryDescription);

    if (options?.useExisting) {
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
    // clear the `added` and `removed` arrays for all queries in preparation for the next update
    for (const query of this.queries.values()) {
      query.added = [];
      query.removed = [];
    }

    // process entity removals
    const entityRemovals = this.entityRemovalsBuffer.splice(
      0,
      this.entityRemovalsBuffer.length
    );
    for (const event of entityRemovals) {
      for (const query of this.queries.values()) {
        const index = query.all.findIndex((e) => e === event.entity);
        if (index !== -1) {
          query.all.splice(index, 1);
        }
        query.removed.push(event.entity);
      }

      // do not process component composition updates as the entity will be removed from all queries
      this.entityCompositionChangesBufferGreen.delete(event.entity);
    }

    // swap the blue and green entity composition change buffers
    const entityCompositionChanges = this.entityCompositionChangesBufferGreen;
    this.entityCompositionChangesBufferGreen =
      this.entityCompositionChangesBufferBlue;
    this.entityCompositionChangesBufferBlue = entityCompositionChanges;

    for (const [entity, components] of entityCompositionChanges) {
      for (const query of this.queries.values()) {
        // if the event component is relevant to the query
        if (
          // if the only condition is a `not` condition, the entity should be reindexed
          (!Array.isArray(query.description) &&
            query.description.one === undefined &&
            query.description.all === undefined &&
            query.description.not !== undefined) ||
          // if the component is mentioned in one of the queries conditions, the entity should be reindexed
          this.hasIntersection(query.components, components)
        ) {
          const match = this.evaluateQuery(query.description, entity);
          const currentlyHasEntity = query.all.includes(entity);

          if (match && !currentlyHasEntity) {
            query.all.push(entity);
            query.added.push(entity);
          }
          if (!match && currentlyHasEntity) {
            const index = query.all.findIndex((e) => e === entity);
            if (index !== -1) {
              query.all.splice(index, 1);
            }
            query.removed.push(entity);
          }
        }
      }
    }

    // clear the entity composition changes map
    this.entityCompositionChangesBufferBlue.clear();
  }

  private evaluateQuery(
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
    for (const space of this.world.spaces.values()) {
      for (const entity of space.entities.values()) {
        if (this.evaluateQuery(queryDescription, entity)) {
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
