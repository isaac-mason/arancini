import { ObjectPool } from '@arancini/pool'
import { BitSet } from './bit-set'
import {
  EntityContainer,
  addEntityToContainer,
  removeEntityFromContainer,
} from './entity-container'
import {
  ARANCINI_SYMBOL,
  EntityMetadata,
  EntityWithMetadata,
} from './entity-metadata'
import {
  Query,
  QueryDescription,
  evaluateQueryBitSets,
  getFirstQueryResult,
  getQueryBitSets,
  getQueryConditions,
  getQueryDedupeString,
  getQueryResults,
} from './query'

const DEFAULT_QUERY_HANDLE = 'standalone'

export type ComponentRegistry = { [name: string]: number }

export type AnyEntity = Record<string, any>

export type WorldOptions<E extends AnyEntity> = {
  components?: (keyof E)[]
}

export class World<E extends AnyEntity = any> extends EntityContainer<E> {
  queries = new Map<string, Query<any>>()

  private queryUsages: Map<string, unknown[]> = new Map()

  private componentIndexCounter = -1
  private componentRegistry: ComponentRegistry = {}

  private idToEntity = new Map<number, E>()
  private entityIdCounter = 0

  private bulkUpdateInProgress = false
  private bulkUpdateEntities: Set<E> = new Set()

  private entityMetadataPool = new ObjectPool<EntityMetadata>(() => ({
    bitset: new BitSet(),
    id: undefined,
  }))

  private initialised = false

  constructor(options?: WorldOptions<E>) {
    super()

    if (options?.components) {
      this.registerComponents(options.components)
    }

    this.initialised = true
  }

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

    const metadata = (entity as EntityWithMetadata<E>)[ARANCINI_SYMBOL]

    let id = metadata.id

    if (id === undefined) {
      id = this.entityIdCounter++
      metadata.id = id
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
    addEntityToContainer(this, entity)

    const metadata = this.entityMetadataPool.request()
    metadata.bitset.add(
      ...Object.keys(entity).map((c) => this.componentRegistry[c])
    )
    ;(entity as EntityWithMetadata<E>)[ARANCINI_SYMBOL] = metadata

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

    /* remove and recycle entity metadata */
    const metadata = (entity as EntityWithMetadata<E>)[ARANCINI_SYMBOL]

    if (!metadata) return

    delete (entity as never)[ARANCINI_SYMBOL]

    const id = metadata.id
    if (id !== undefined) {
      this.idToEntity.delete(id)
      metadata.id = undefined
    }

    metadata.bitset.reset()

    this.entityMetadataPool.recycle(metadata)
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
    if (entity[component] !== undefined) {
      return this
    }

    entity[component] = value

    const metadata = (entity as EntityWithMetadata<E>)[ARANCINI_SYMBOL]
    metadata.bitset.add(this.componentRegistry[component as string])

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
      const metadata = (entity as EntityWithMetadata<E>)[ARANCINI_SYMBOL]
      metadata.bitset.remove(this.componentRegistry[component as string])

      this.index(entity)
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
    if (typeof updateFnOrPartial === 'function') {
      const updateFn = updateFnOrPartial

      const proxy = new Proxy(entity, {
        set: (_target, key, value) => {
          const component = key as keyof E

          const has = component in entity

          if (has && value === undefined) {
            this.remove(entity, component)
          } else if (!has) {
            this.add(entity, component, value)
          } else {
            Reflect.set(entity, key, value)
          }

          return true
        },
        deleteProperty: (_target, key) => {
          this.remove(entity, key as keyof E)

          return true
        },
      })

      this.bulk(() => {
        updateFn(proxy)
      })
    } else {
      const partial = updateFnOrPartial

      this.bulk(() => {
        for (const component in partial) {
          const value = partial[component]

          if (value !== undefined) {
            this.add(entity, component as keyof E, value)
          } else {
            this.remove(entity, component as keyof E)
          }
        }
      })
    }
  }

  /**
   * Utility method for adding and removing components from entities in bulk.
   * @param updateFn callback to update entities in the World
   *
   * @example
   * ```ts
   * const entity = world.create({ health: 10, poisioned: true })
   *
   * world.bulk(() => {
   *   world.add(entity, 'position', { x: 0, y: 0 })
   *   world.remove(entity, 'poisioned')
   * })
   * ```
   */
  bulk(updateFn: () => void): void {
    this.bulkUpdateInProgress = true

    updateFn()

    this.bulkUpdateInProgress = false

    for (const entity of this.bulkUpdateEntities) {
      this.index(entity)
    }

    this.bulkUpdateEntities.clear()
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
    const queryConditions = getQueryConditions(queryDescription)
    const key = getQueryDedupeString(this.componentRegistry, queryConditions)

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

    query = new Query(
      this,
      key,
      queryConditions,
      getQueryBitSets(this.componentRegistry, queryConditions)
    )

    const matches = getQueryResults(query.bitSets, this.entities.values())

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
    const queryDedupe = getQueryDedupeString(this.componentRegistry, conditions)

    const query = this.queries.get(queryDedupe)
    if (query) {
      return query.entities as ResultEntity[]
    }

    const conditionsBitSets = getQueryBitSets(
      this.componentRegistry,
      conditions
    )

    return getQueryResults(
      conditionsBitSets,
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
    const queryDedupe = getQueryDedupeString(this.componentRegistry, conditions)

    const query = this.queries.get(queryDedupe)
    if (query) {
      return query.first as ResultEntity | undefined
    }

    const conditionsBitSets = getQueryBitSets(
      this.componentRegistry,
      conditions
    )

    return getFirstQueryResult(conditionsBitSets, this.entities) as unknown as
      | ResultEntity
      | undefined
  }

  /**
   * Register components with the World
   * @param names
   */
  registerComponents(components: (keyof E)[]) {
    for (const component of components) {
      if (this.componentRegistry[component as string] === undefined) {
        this.componentIndexCounter++
        this.componentRegistry[component as string] = this.componentIndexCounter
      }
    }

    // if the world has already been initialised, resize all entity components bitsets
    if (this.initialised) {
      for (const entity of this.entities.values()) {
        const metadata = (entity as EntityWithMetadata<E>)[ARANCINI_SYMBOL]
        metadata.bitset.resize(this.componentIndexCounter)
      }
    }
  }

  private index(entity: E) {
    if (!this.has(entity)) return

    if (this.bulkUpdateInProgress) {
      this.bulkUpdateEntities.add(entity)
      return
    }

    for (const query of this.queries.values()) {
      const matchesQuery = evaluateQueryBitSets(query.bitSets, entity)
      const inQuery = query.has(entity)

      if (matchesQuery && !inQuery) {
        addEntityToContainer(query, entity)
      } else if (!matchesQuery && inQuery) {
        removeEntityFromContainer(query, entity)
      }
    }
  }
}
