import {
  EntityContainer,
  addEntityToContainer,
  removeEntityFromContainer,
} from './entity-container'
import {
  Query,
  QueryDescription,
  evaluateQueryConditions,
  getFirstQueryResult,
  getQueryConditions,
  getQueryDedupeString,
  getQueryResults,
} from './query'

const DEFAULT_QUERY_HANDLE = Symbol('standalone')

export type ComponentRegistry = { [name: string]: number }

export type AnyEntity = Record<string, any>

export class World<E extends AnyEntity = any> extends EntityContainer<E> {
  queries = new Map<string, Query<any>>()

  private queryUsages: Map<string, unknown[]> = new Map()

  private idToEntity = new Map<number, E>()
  private entityToId = new WeakMap<E, number>()
  private entityIdCounter = 0

  /**
   * Removes all entities from the world. Components remain registered, and queries are not destroyed.
   */
  reset() {
    this.entities.forEach((entity) => this.destroy(entity))
    this.entityIdCounter = 0
    this.idToEntity.clear()
    this._entityPositions.clear()
  }

  /**
   * Creates and returns an id for an entity
   */
  id(entity: E) {
    if (!this.has(entity)) return undefined

    let id = this.entityToId.get(entity)

    if (id === undefined) {
      id = this.entityIdCounter++
      this.entityToId.set(entity, id)
      this.idToEntity.set(id, entity)
    }

    return id
  }

  /**
   * Returns an entity for an id
   * @param id
   * @returns
   */
  entity(id: number) {
    return this.idToEntity.get(id)
  }

  /**
   * Creates a new entity
   * @param entity
   * @returns the created entity
   *
   * @example
   * ```ts
   * const entity = {
   *   position: { x: 0, y: 0 },
   *   velocity: { x: 0, y: 0 },
   * }
   *
   * world.create(entity)
   * ```
   *
   * @example
   * ```ts
   * const entity = world.create({
   *   position: { x: 0, y: 0 },
   *   velocity: { x: 0, y: 0 },
   * })
   * ```
   */
  create(entity: E): E {
    if (this.has(entity)) return entity

    addEntityToContainer(this, entity)

    this.index(entity)

    return entity
  }

  /**
   * Destroys an entity
   * @param entity
   *
   * @example
   * ```ts
   * const entity = world.create({ foo: 'bar' })
   * world.destroy(entity)
   * ```
   */
  destroy(entity: E) {
    removeEntityFromContainer(this, entity)

    /* remove entity from queries */
    this.queries.forEach((query) => removeEntityFromContainer(query, entity))
  }

  /**
   * Adds a component to an entity
   * @param entity
   * @param component
   * @param value
   * @returns the world, for chaining
   *
   * @example
   * ```ts
   * const entity = {}
   * world.create(entity)
   * world.add(entity, 'foo', 'bar')
   * ```
   */
  add<C extends keyof E>(entity: E, component: C, value: E[C]): this {
    if (entity[component] !== undefined) return this

    entity[component] = value

    this.index(entity)

    return this
  }

  /**
   * Removes a component from an entity
   * @param entity
   * @param component
   * @returns the world, for chaining
   *
   * @example
   * ```ts
   * const entity = {}
   * world.create(entity)
   * world.add(entity, 'foo', 'bar')
   * world.remove(entity, 'foo')
   * ```
   */
  remove(entity: E, component: keyof E) {
    if (entity[component] === undefined) return

    if (this.has(entity)) {
      const future = { ...entity }
      delete future[component]

      this.index(entity, future)
    }

    delete entity[component]
  }

  /**
   * Applies an update to an entity, checking for added and removed components and updating queries.
   * The update is applied in bulk, so queries are only updated once.
   * @param entity the entity to update
   * @param updateFn the update function
   *
   * @example
   * ```ts
   * const entity = world.create({ health: 10, poisioned: true })
   *
   * // add and remove components in a single bulk update, using regular object syntax
   * world.update(entity, (e) => {
   *   // add a component
   *   e.position = { x: 0, y: 0 }
   *
   *   // remove a component
   *   delete e.poisioned
   * })
   * ```
   */
  update(
    entity: E,
    updateFnOrPartial: ((entity: E) => void) | Partial<E>
  ): void {
    const future = { ...entity }

    if (typeof updateFnOrPartial === 'function') {
      const updateFn = updateFnOrPartial
      updateFn(future)
    } else {
      Object.assign(future, updateFnOrPartial)
    }

    this.index(entity, future)

    Object.assign(entity, future)
  }

  /**
   * Creates a query that updates with entity composition changes.
   * @param queryDescription the query description
   * @returns the query
   *
   * @example
   * ```ts
   * const query = world.query((e) => e.has('position').and.has('velocity'))
   * ```
   *
   * @example
   * ```ts
   * const query = world.query((e) => e.has('position').but.not('dead'))
   * ```
   *
   * @example
   * ```ts
   * const query = world.query((e) => e.has('position').and.one('player', 'enemy'))
   * ```
   */
  query<ResultEntity extends E>(
    queryDescription: QueryDescription<E, ResultEntity>,
    options?: { handle: unknown }
  ): Query<ResultEntity> {
    const conditions = getQueryConditions(queryDescription)

    const key = getQueryDedupeString(conditions)

    const handle = options?.handle ?? DEFAULT_QUERY_HANDLE

    const queryUsages = this.queryUsages.get(key)

    if (queryUsages) {
      queryUsages.push(handle)
    } else {
      this.queryUsages.set(key, [handle])
    }

    let query = this.queries.get(key) as Query<ResultEntity>

    if (query) {
      return query
    }

    query = new Query(this, key, conditions)

    const matches = getQueryResults(
      query.conditions,
      this.entities.values() as any
    )

    for (const entity of matches) {
      addEntityToContainer(query, entity as ResultEntity)
    }

    this.queries.set(key, query)

    return query
  }

  /**
   * Destroys a Query
   * @param query the Query to remove
   * @returns
   */
  destroyQuery(query: Query<any>, options?: { handle: unknown }): void {
    if (!this.queries.has(query.key)) {
      return
    }

    const handle = options?.handle ?? DEFAULT_QUERY_HANDLE

    let usages = this.queryUsages.get(query.key) ?? []

    usages = usages.filter((usage) => usage !== handle)

    if (usages.length > 0) {
      this.queryUsages.set(query.key, usages)
      return
    }

    this.queries.delete(query.key)
    this.queryUsages.delete(query.key)
    query.onEntityAdded.clear()
    query.onEntityRemoved.clear()
  }

  /**
   * Filters entities that match a given query description.
   * @param queryDescription the query conditions to match
   * @returns entities matching the query description
   */
  filter<ResultEntity>(
    queryDescription: QueryDescription<E, ResultEntity>
  ): ResultEntity[] {
    const conditions = getQueryConditions(queryDescription)

    const queryDedupe = getQueryDedupeString(conditions)

    const query = this.queries.get(queryDedupe)
    if (query) {
      return query.entities as ResultEntity[]
    }

    return getQueryResults(
      conditions,
      this.entities
    ) as unknown as ResultEntity[]
  }

  /**
   * Finds an entity that matches a given query description.
   * @param queryDescription the query conditions to match
   * @returns the first entity matching the query description
   */
  find<ResultEntity>(
    queryDescription: QueryDescription<E, ResultEntity>
  ): ResultEntity | undefined {
    const conditions = getQueryConditions(queryDescription)

    const queryDedupe = getQueryDedupeString(conditions)
    const query = this.queries.get(queryDedupe)

    if (query) {
      return query.first as ResultEntity | undefined
    }

    return getFirstQueryResult(conditions, this.entities) as unknown as
      | ResultEntity
      | undefined
  }

  private index(entity: E, future: E = entity) {
    if (!this.has(entity)) return

    for (const query of this.queries.values()) {
      const matchesQuery = evaluateQueryConditions(query.conditions, future)
      const inQuery = query.has(entity)

      if (matchesQuery && !inQuery) {
        addEntityToContainer(query, entity)
      } else if (!matchesQuery && inQuery) {
        removeEntityFromContainer(query, entity)
      }
    }
  }
}
