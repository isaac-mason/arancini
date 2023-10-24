import type { Entity } from './entity'
import { EntityContainer } from './entity-container'
import {
  QueryBitSets,
  QueryConditions,
  QueryDescription,
  evaluateQueryBitSets,
  getQueryBitSets,
  getQueryConditions,
  getQueryDedupeString,
  getQueryResults,
} from './query-utils'
import type { World } from './world'

/**
 * A Query for Entities with specified Components.
 *
 * Queries can contain a minimum of one and a maximum of three conditions, the `entities`, `one`, and `not` QueryConditionType conditions.
 *
 * Queries can either be created as part of Systems, or they can be created standalone.
 *
 * Changes to Entity Components are queued, and Query results are updated as part of the World update loop.
 *
 * Query results can also be retrieved once-off without creating a persistent query with `world.find(...)`.
 *
 * ```ts
 * import { Component, System, World } from '@arancini/core'
 *
 * // create a world
 * const world = new World()
 *
 * // create some example components
 * class ExampleComponentOne extends Component {}
 * class ExampleComponentTwo extends Component {}
 *
 * // get once-off query results, re-using existing query results if available
 * world.filter((q) => q.all(ExampleComponentOne, ExampleComponentTwo))
 *
 * // get a query that will update reactively
 * const query = world.query((q) => q.all(ExampleComponentOne, ExampleComponentTwo))
 *
 * // create a system with a query
 * class ExampleSystem extends System {
 *   exampleQueryName = this.query((q) => q.all(ExampleComponentOne, ExampleComponentTwo))
 *
 *   onUpdate() {
 *     this.exampleQueryName.entities.forEach((entity) => console.log(entity))
 *   }
 * }
 *
 * world.registerSystem(ExampleSystem)
 * ```
 */
export class Query extends EntityContainer {
  constructor(
    public world: World,
    public key: string,
    public conditions: QueryConditions,
    public bitSets: QueryBitSets
  ) {
    super()
  }

  /**
   * Destroys the Query
   */
  destroy(): void {
    this.world.queryManager.removeQuery(this)
  }
}

/**
 * QueryManager is an internal class that manages Query instances
 *
 * @private internal class, do not use directly
 */
export class QueryManager {
  queries: Map<string, Query> = new Map()

  queryOwners: Map<string, unknown[]> = new Map()

  private world: World

  constructor(world: World) {
    this.world = world
  }

  createQuery(
    queryDescription: QueryDescription,
    owner: unknown = 'standalone'
  ): Query {
    const conditions = getQueryConditions(queryDescription)
    const dedupe = getQueryDedupeString(conditions)

    let query = this.queries.get(dedupe)

    if (query === undefined) {
      query = new Query(
        this.world,
        dedupe,
        conditions,
        getQueryBitSets(conditions)
      )

      const matches = getQueryResults(
        query.bitSets,
        this.world.entities.values()
      )

      for (const entity of matches) {
        query._addEntity(entity)
      }

      this.queries.set(dedupe, query)
    }

    if (owner) {
      const queryOwners = this.queryOwners.get(dedupe) ?? []
      queryOwners.push(owner)
      this.queryOwners.set(dedupe, queryOwners)
    }

    return query
  }

  removeQuery(query: Query, owner: unknown = 'standalone'): void {
    if (!this.queries.has(query.key)) {
      return
    }

    let usages = this.queryOwners.get(query.key) ?? []

    usages = usages.filter((usage) => usage !== owner)

    if (usages.length > 0) {
      this.queryOwners.set(query.key, usages)
      return
    }

    this.queries.delete(query.key)
    this.queryOwners.delete(query.key)
    query.onEntityAdded.clear()
    query.onEntityRemoved.clear()
  }

  findQuery(queryDescription: QueryDescription): Query | undefined {
    const conditions = getQueryConditions(queryDescription)
    const dedupeString = getQueryDedupeString(conditions)
    return this.queries.get(dedupeString)
  }

  onEntityComponentChange(entity: Entity): void {
    for (const query of this.queries.values()) {
      const matchesQuery = evaluateQueryBitSets(query.bitSets, entity)
      const inQuery = query.has(entity)

      if (matchesQuery && !inQuery) {
        query._addEntity(entity)
      } else if (!matchesQuery && inQuery) {
        query._removeEntity(entity)
      }
    }
  }
}
