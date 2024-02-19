import {
  EntityCollection,
  addToCollection,
  removeFromCollection,
} from './entity-collection'
import {
  Query,
  QueryFn,
  evaluateQueryConditions,
  getQueryConditions,
  getQueryDedupeString,
  getQueryResults,
} from './query'

const DEFAULT_QUERY_HANDLE = Symbol('standalone')

export type AnyEntity = Record<string, any>

export class World<E extends AnyEntity = any> extends EntityCollection<E> {
  queries = new Map<string, Query<any>>()

  private queryReferences: Map<string, unknown[]> = new Map()

  private idToEntity = new Map<number, E>()
  private entityToId = new Map<E, number>()
  private entityIdCounter = 0

  /**
   * Removes all entities from the world.
   */
  clear() {
    const entities = [...this.entities]

    for (const entity of entities) {
      this.destroy(entity)
    }

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
  create<Entity extends E>(entity: Entity): Entity {
    if (this.has(entity)) return entity

    addToCollection(this, entity)

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
  destroy(entity: E): void {
    if (!this.has(entity)) return

    removeFromCollection(this, entity)

    /* remove entity from queries */
    this.queries.forEach((query) => {
      if (query.has(entity)) {
        removeFromCollection(query, entity)
      }
    })
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
  add<C extends keyof E>(entity: E, component: C, value: E[C]): void {
    if (entity[component] !== undefined) return

    entity[component] = value

    this.index(entity)
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
  remove(entity: E, component: keyof E): void {
    if (entity[component] === undefined) return

    if (this.has(entity)) {
      const draft = { ...entity }
      delete draft[component]

      this.index(entity, draft)
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
    const draft = { ...entity }

    if (typeof updateFnOrPartial === 'function') {
      updateFnOrPartial(draft)
    } else {
      Object.assign(draft, updateFnOrPartial)
    }

    const added = Object.keys(draft).filter((key) => entity[key] === undefined)
    const removed = Object.keys(entity).filter((key) => draft[key] === undefined)

    // commit additions before indexing
    for (const component of added) {
      entity[component as keyof E] = draft[component]
    }

    this.index(entity, draft)

    // commit removals after indexing
    for (const component of removed) {
      delete entity[component]
    }

    Object.assign(entity, draft)
  }

  /**
   * Creates a query that updates with entity composition changes.
   * @param queryFn the query function
   * @returns the query instance
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
    queryFn: QueryFn<E, ResultEntity>,
    options?: { handle: unknown }
  ): Query<ResultEntity> {
    const conditions = getQueryConditions(queryFn)
    const key = getQueryDedupeString(conditions)

    const handle = options?.handle ?? DEFAULT_QUERY_HANDLE
    const queryReference = this.queryReferences.get(key)

    if (queryReference) {
      queryReference.push(handle)
    } else {
      this.queryReferences.set(key, [handle])
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
      addToCollection(query, entity as ResultEntity)
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

    let references = this.queryReferences.get(query.key) ?? []

    references = references.filter((ref) => ref !== handle)

    if (references.length > 0) {
      this.queryReferences.set(query.key, references)
      return
    }

    this.queries.delete(query.key)
    this.queryReferences.delete(query.key)
    query.onEntityAdded.clear()
    query.onEntityRemoved.clear()
  }

  /**
   * Filters entities that match a given query.
   * @param queryFn the query to match
   * @returns entities matching the query
   */
  filter<ResultEntity>(
    queryFn: QueryFn<E, ResultEntity>
  ): ResultEntity[] {
    const conditions = getQueryConditions(queryFn)

    const queryDedupe = getQueryDedupeString(conditions)

    const query = this.queries.get(queryDedupe)
    if (query) {
      return [...query.entities] as ResultEntity[]
    }

    return getQueryResults(
      conditions,
      this.entities
    ) as unknown as ResultEntity[]
  }

  /**
   * Finds an entity that matches a given query
   * @param queryFn the query to match
   * @returns the first entity matching the query
   */
  find<ResultEntity>(
    queryFn: QueryFn<E, ResultEntity>
  ): ResultEntity | undefined {
    const conditions = getQueryConditions(queryFn)

    const queryDedupe = getQueryDedupeString(conditions)
    const query = this.queries.get(queryDedupe)

    if (query) {
      return query.first as ResultEntity | undefined
    }

    for (const entity of this.entities) {
      if (evaluateQueryConditions(conditions, entity)) {
        return entity as ResultEntity | undefined
      }
    }

    return undefined;
  }

  private index(entity: E, draft: E = entity) {
    if (!this.has(entity)) return

    for (const query of this.queries.values()) {
      const match = evaluateQueryConditions(query.conditions, draft)
      const has = query.has(entity)

      if (match && !has) {
        addToCollection(query, entity)
      } else if (!match && has) {
        removeFromCollection(query, entity)
      }
    }
  }
}
