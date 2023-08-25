import type { ComponentDefinition } from './component'
import type { Entity } from './entity'
import { EntityContainer } from './entity-container'
import { BitSet } from './utils/bit-set'
import type { World } from './world'
export type QueryConditionType = 'all' | 'any' | 'not'

/**
 * Type for query conditions
 */
export type QueryDescription =
  | ComponentDefinition<unknown>[]
  | {
      all?: ComponentDefinition<unknown>[]
      not?: ComponentDefinition<unknown>[]
      any?: ComponentDefinition<unknown>[]
    }

export type QueryBitSets = {
  all?: BitSet
  any?: BitSet
  not?: BitSet
}

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
 * import { Component, System, World, QueryDescription } from '@arancini/core'
 *
 * // create a world
 * const world = new World()
 *
 * // create some example components
 * class ExampleComponentOne extends Component {}
 * class ExampleComponentTwo extends Component {}
 * class ExampleComponentThree extends Component {}
 * class ExampleComponentFour extends Component {}
 *
 * // create a simple query description
 * const simpleQueryDescription: QueryDescription = [ExampleComponentOne, ExampleComponentTwo]
 *
 * // create a complex query description
 * const queryDescription: QueryDescription = {
 *   all: [ExampleComponentOne],
 *   any: [ExampleComponentOne, ExampleComponentTwo],
 *   not: [ExampleComponentFour],
 * }
 *
 * // get once-off query results, re-using existing query results if available
 * world.find(simpleQueryDescription)
 *
 * // get a query that will update every world update
 * const query = world.query({
 *   all: [ExampleComponentOne]
 * })
 *
 * // create a system with a query
 * class ExampleSystem extends System {
 *   exampleQueryName = this.query({
 *     all: [ExampleComponentOne],
 *   })
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
  /**
   * Constructor for a new query instance
   * @param world the world the query is in
   * @param queryKey the key for the query
   */
  constructor(
    public world: World,
    public key: string,
    public description: QueryDescription,
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

export const getQueryDedupeString = (
  queryDescription: QueryDescription
): string => {
  if (Array.isArray(queryDescription)) {
    return queryDescription.map((c) => `${c.componentIndex}`).join('&')
  }

  return Object.entries(queryDescription)
    .flatMap(([type, components]) => {
      if (type === 'all') {
        return components.map((c) => `${c.componentIndex}`).sort()
      }

      return [`${type}:${components.sort().map((c) => c.componentIndex)}`]
    })
    .sort()
    .join('&')
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

  /**
   * Creates a new query by a query description
   * @param queryDescription the description of the query to create
   */
  createQuery(
    queryDescription: QueryDescription,
    owner: unknown = 'standalone'
  ): Query {
    const dedupe = getQueryDedupeString(queryDescription)

    let query = this.queries.get(dedupe)

    if (query === undefined) {
      const isArray = Array.isArray(queryDescription)
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
        throw new Error('Query must have at least one condition')
      }

      query = new Query(
        this.world,
        dedupe,
        queryDescription,
        this.getQueryBitSets(queryDescription)
      )

      const matches = this.getQueryResults(query.bitSets)

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

  /**
   * Removes a query from the query manager
   * @param query the query to remove
   */
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

  /**
   * Returns whether the query manager has the query
   * @param queryDescription the query description to check for
   */
  hasQuery(queryDescription: QueryDescription): boolean {
    const dedupeString = getQueryDedupeString(queryDescription)
    return this.queries.has(dedupeString)
  }

  /**
   * Updates queries after a component has been added to or removed from an entity
   * @param entity the query
   */
  onEntityComponentChange(entity: Entity): void {
    for (const query of this.queries.values()) {
      const matchesQuery = this.matchesQueryConditions(query.bitSets, entity)
      const inQuery = query.has(entity)

      if (matchesQuery && !inQuery) {
        query._addEntity(entity)
      } else if (!matchesQuery && inQuery) {
        query._removeEntity(entity)
      }
    }
  }

  /**
   * Updates queries after a query has been removed from the World
   * @param entity the query
   */
  onEntityRemoved(entity: Entity): void {
    for (const query of this.queries.values()) {
      query._removeEntity(entity)
    }
  }

  /**
   * Executes a query and returns a set of the matching Entities.
   * By default the query is freshly evaluated, regardless of whether a query with the same description already exists in the world.
   * If `options.useExisting` is true, results are taken from an existing query if present.
   * @param queryDescription the query description
   */
  find(queryDescription: QueryDescription): Entity[] {
    const key = getQueryDedupeString(queryDescription)

    const query = this.queries.get(key)

    if (query) {
      return query.entities
    }

    return this.getQueryResults(this.getQueryBitSets(queryDescription))
  }

  private matchesQueryConditions(
    queryBitSets: QueryBitSets,
    entity: Entity
  ): boolean {
    if (
      queryBitSets.all &&
      !entity._componentsBitSet.containsAll(queryBitSets.all)
    ) {
      return false
    }

    if (
      queryBitSets.any &&
      !entity._componentsBitSet.containsAny(queryBitSets.any)
    ) {
      return false
    }

    if (
      queryBitSets.not &&
      entity._componentsBitSet.containsAny(queryBitSets.not)
    ) {
      return false
    }

    return true
  }

  private getQueryResults(queryBitSets: QueryBitSets): Entity[] {
    const matches: Entity[] = []

    for (const entity of this.world.entities.values()) {
      if (this.matchesQueryConditions(queryBitSets, entity)) {
        matches.push(entity)
      }
    }

    return matches
  }

  private getQueryBitSets(queryDescription: QueryDescription): QueryBitSets {
    const { all, any, not } = Array.isArray(queryDescription)
      ? { all: queryDescription, any: undefined, not: undefined }
      : queryDescription

    const queryBitSets: QueryBitSets = {}

    queryBitSets.all = all
      ? new BitSet(all.map((component) => component.componentIndex))
      : undefined

    queryBitSets.any = any
      ? new BitSet(any.map((component) => component.componentIndex))
      : undefined

    queryBitSets.not = not
      ? new BitSet(not.map((component) => component.componentIndex))
      : undefined

    return queryBitSets
  }
}
