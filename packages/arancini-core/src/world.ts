import {
  EntityCollection,
  addToCollection,
  removeFromCollection,
} from './entity-collection'
import { Query, QueryFn, evaluateQueryConditions, prepareQuery } from './query'

export type AnyEntity = Record<string, any>

export class World<E extends AnyEntity = any> extends EntityCollection<E> {
  queries: Query<any>[] = []

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
  create<Entity extends E>(entity: Entity): E & Entity {
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

    const draft = { ...entity }
    delete draft[component]

    this.index(entity, draft)

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
    const removed = Object.keys(entity).filter(
      (key) => draft[key] === undefined
    )

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
  ): Query<ResultEntity> {
    const { conditions, dedupe } = prepareQuery(queryFn)

    let query = this.queries.find((query) => query.dedupe === dedupe)

    if (query) {
      return query
    }

    query = new Query(dedupe, conditions)

    this.queries.push(query)

    /* populate query with existing entities */
    const matches: E[] = []

    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i]

      if (evaluateQueryConditions(query.conditions, entity)) {
        matches.push(entity)
      }
    }

    for (let i = 0; i < matches.length; i++) {
      addToCollection(query, matches[i])
    }

    return query
  }

  /**
   * Destroys a Query
   * @param query the Query to remove
   * @returns
   */
  destroyQuery(query: Query<any>): void {
    if (!this.queries.includes(query)) return

    const queryIndex = this.queries.indexOf(query)
    this.queries.splice(queryIndex, 1)

    query.onEntityAdded.clear()
    query.onEntityRemoved.clear()
  }

  /**
   * Filters entities that match a given query.
   * @param queryFn the query to match
   * @returns entities matching the query
   */
  filter<ResultEntity>(queryFn: QueryFn<E, ResultEntity>): ResultEntity[] {
    const { conditions, dedupe } = prepareQuery(queryFn)

    const query = this.queries.find((query) => query.dedupe === dedupe)
    if (query) {
      return [...query.entities] as ResultEntity[]
    }

    const matches: E[] = []

    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i]

      if (evaluateQueryConditions(conditions, entity)) {
        matches.push(entity)
      }
    }

    return matches as unknown as ResultEntity[]
  }

  /**
   * Finds an entity that matches a given query
   * @param queryFn the query to match
   * @returns the first entity matching the query
   */
  find<ResultEntity>(
    queryFn: QueryFn<E, ResultEntity>
  ): ResultEntity | undefined {
    const { conditions, dedupe } = prepareQuery(queryFn)

    const query = this.queries.find((query) => query.dedupe === dedupe)

    if (query) {
      return query.first as ResultEntity | undefined
    }

    for (const entity of this.entities) {
      if (evaluateQueryConditions(conditions, entity)) {
        return entity as ResultEntity | undefined
      }
    }

    return undefined
  }

  /**
   * Removes all entities from the world.
   */
  clear() {
    const entities = [...this.entities]

    for (let i = 0; i < entities.length; i++) {
      this.destroy(entities[i])
    }

    this._entityPositions.clear()
  }

  /**
   * Indexes an entity.
   * 
   * Avoid calling this method directly unless you know what you're doing.
   *
   * This is called automatically when:
   * - an entity is created
   * - a component is added or removed from an entity
   * - an entity is destroyed
   *
   * @param entity the entity to index
   * @param draft the draft entity that queries are evaluated against, defaults to entity
   * @returns
   */
  index(entity: E, draft: E = entity) {
    if (!this.has(entity)) return

    for (let q = 0; q < this.queries.length; q++) {
      const query = this.queries[q]

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
