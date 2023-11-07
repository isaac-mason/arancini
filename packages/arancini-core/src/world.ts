import {
  EntityContainer,
  addEntityToContainer,
  removeEntityFromContainer,
} from './entity-container'
import {
  ARANCINI_SYMBOL,
  EntityWithMetadata,
  entityMetadataPool,
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
import { System, SystemAttributes, SystemClass, SystemManager } from './system'

export type ComponentRegistry = { [name: string]: number }

export type WorldOptions<E extends {}> = {
  components?: (keyof E)[]
}

export type AnyEntity = Record<string, any>

export class World<E extends AnyEntity = any> extends EntityContainer<E> {
  time = 0

  initialised = false

  systemManager: SystemManager

  queries = new Map<string, Query<any>>()

  private queryConsumers: Map<string, unknown[]> = new Map()

  private componentIndexCounter = -1
  private componentRegistry: ComponentRegistry = {}

  private idToEntity = new Map<number, E>()
  private entityIdCounter = 0

  private bulkUpdateInProgress = false
  private bulkUpdateEntities: Set<E> = new Set()

  constructor(options?: WorldOptions<E>) {
    super()

    this.systemManager = new SystemManager(this)

    if (options?.components) {
      this.registerComponents(options.components)
    }
  }

  /**
   * Initialises the World
   */
  init() {
    this.initialised = true

    this.systemManager.init()
  }

  /**
   * Steps the world
   * @param delta the time elapsed since the last step
   */
  step(delta: number) {
    this.time += delta

    this.systemManager.update(delta, this.time)
  }

  /**
   * Resets the world. Removes all entities, and calls onDestroy on all systems.
   * Components and Systems remain registered.
   * The world must be initialised again after this.
   */
  reset() {
    this.time = 0
    this.initialised = false

    this.systemManager.destroy()

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

    const internal = entity as EntityWithMetadata<E>

    let id = internal[ARANCINI_SYMBOL].id

    if (id === undefined) {
      id = this.entityIdCounter++
      this.idToEntity.set(id, entity)
      internal[ARANCINI_SYMBOL].id = id
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
   * @returns a proxied entity that
   *
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

    const internal = entity as EntityWithMetadata<E>
    internal[ARANCINI_SYMBOL] = entityMetadataPool.request()
    internal[ARANCINI_SYMBOL].bitset.add(
      ...Object.keys(entity).map((c) => this.componentRegistry[c])
    )

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

    const internal = entity as EntityWithMetadata<E>
    internal[ARANCINI_SYMBOL].bitset.reset()

    this.index(entity)

    this.queries.forEach((query) => removeEntityFromContainer(query, entity))

    let id = internal[ARANCINI_SYMBOL].id
    if (id) {
      this.idToEntity.delete(id)
    }

    internal[ARANCINI_SYMBOL].bitset.reset()
    internal[ARANCINI_SYMBOL].id = undefined
    entityMetadataPool.recycle(internal[ARANCINI_SYMBOL])
    delete (internal as Partial<typeof internal>)[ARANCINI_SYMBOL]
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

    const internal = entity as EntityWithMetadata<E>
    internal[ARANCINI_SYMBOL].bitset.add(
      this.componentRegistry[component as string]
    )

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
      const internal = entity as EntityWithMetadata<E>
      internal[ARANCINI_SYMBOL].bitset.remove(
        this.componentRegistry[component as string]
      )

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
    options?: { owner: unknown }
  ): Query<ResultEntity> {
    const queryConditions = getQueryConditions(queryDescription)
    const key = getQueryDedupeString(this.componentRegistry, queryConditions)

    let query = this.queries.get(key) as Query<ResultEntity>
    if (query) return query

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

    const owner = options?.owner ?? 'standalone'
    const queryOwners = this.queryConsumers.get(query.key) ?? []
    queryOwners.push(owner)
    this.queryConsumers.set(query.key, queryOwners)

    return query
  }

  /**
   * Destroys a Query
   * @param query the Query to remove
   * @returns
   */
  destroyQuery(query: Query<any>, owner: unknown = 'standalone'): void {
    if (!this.queries.has(query.key)) {
      return
    }

    let usages = this.queryConsumers.get(query.key) ?? []

    usages = usages.filter((usage) => usage !== owner)

    if (usages.length > 0) {
      this.queryConsumers.set(query.key, usages)
      return
    }

    this.queries.delete(query.key)
    this.queryConsumers.delete(query.key)
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
      this.registerComponent(component)
    }

    // if the world has already been initialised, resize all entity components bitsets
    if (this.initialised) {
      for (const entity of this.entities.values()) {
        const internal = entity as EntityWithMetadata<E>
        internal[ARANCINI_SYMBOL].bitset.resize(this.componentIndexCounter)
      }
    }
  }

  /**
   * Adds a system to the World
   * @param system the system to add to the World
   * @returns the World
   */
  registerSystem(system: SystemClass, attributes?: SystemAttributes): World {
    this.systemManager.registerSystem(system, attributes)
    return this
  }

  /**
   * Removes a System from the World
   * @param system the System to remove from the World
   * @returns the World
   */
  unregisterSystem(system: SystemClass): World {
    this.systemManager.unregisterSystem(system)
    return this
  }

  /**
   * Retrives a System by class
   * @param clazz the System class
   * @returns the System, or undefined if it is not registerd
   */
  getSystem<S extends System<E>>(clazz: SystemClass<S>): S | undefined {
    return this.systemManager.systems.get(clazz) as S | undefined
  }

  /**
   * Retrieves a list of all Systems in the world
   * @returns all Systems in the world
   */
  getSystems(): System<E>[] {
    return Array.from(this.systemManager.systems.values())
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

  private registerComponent(component: keyof E): number {
    let id = this.componentRegistry[component as string]

    if (id === undefined) {
      this.componentIndexCounter++

      id = this.componentIndexCounter
      this.componentRegistry[component as string] = id
    }

    return id
  }
}
