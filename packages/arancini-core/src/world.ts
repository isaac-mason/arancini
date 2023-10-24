import {
  Component,
  ComponentDefinitionType,
  InternalComponentInstanceProperties,
  type ComponentDefinition,
} from './component'
import { ComponentRegistry } from './component-registry'
import type { Entity } from './entity'
import { EntityContainer } from './entity-container'
import { ComponentPool, EntityPool } from './pools'
import type { Query } from './query'
import type { QueryDescription } from './query-utils'
import { QueryManager } from './query'
import type { System, SystemAttributes, SystemClass } from './system'
import { SystemManager } from './system'

/**
 * A World that can contain Entities, Systems, and Queries.
 *
 * ```ts
 * import { World } from '@arancini/core'
 *
 * const world = new World()
 *
 * // initialise the world
 * world.init()
 *
 * // update the world without specifying time elapsed
 * // (Systems will be called with a delta of 0)
 * world.update()
 *
 * // update the world with a specified time elapsed
 * // (Systems will be called with a delta of 0.1)
 * world.update(0.1)
 *
 * // reset the world, removing all entities
 * world.reset()
 * ```
 */
export class World extends EntityContainer {
  /**
   * Whether the World has been initialised
   */
  initialised = false

  /**
   * The current World time
   */
  time = 0

  /**
   * The QueryManager for the World
   * Manages and updates Queries
   */
  queryManager: QueryManager

  /**
   * The SystemManager for the World
   * Manages System lifecycles
   */
  systemManager: SystemManager

  /**
   * The ComponentRegistry for the World
   * Maintains a mapping of Component classes to Component indices
   */
  componentRegistry: ComponentRegistry

  /**
   * Object pool for components
   */
  componentPool: ComponentPool

  /**
   * Object pool for entities
   */
  entityPool: EntityPool

  /**
   * Constructor for a World
   */
  constructor() {
    super()
    this.componentRegistry = new ComponentRegistry(this)
    this.queryManager = new QueryManager(this)
    this.systemManager = new SystemManager(this)
    this.componentPool = new ComponentPool()
    this.entityPool = new EntityPool(this)
  }

  /**
   * Initialises the World
   */
  init(): void {
    this.initialised = true

    for (const entity of this.entities) {
      this.initialiseEntity(entity)
    }

    this.systemManager.init()
  }

  /**
   * Updates the World
   * @param delta the time elapsed in seconds, uses 0 if not specified
   */
  update(delta = 0): void {
    this.time += delta

    /* update systems */
    for (const system of this.systemManager.sortedSystems.values()) {
      if (!system.enabled) {
        continue
      }

      if (
        system.__internal.hasRequiredQueries &&
        system.__internal.requiredQueries.some((q) => q.entities.length === 0)
      ) {
        continue
      }

      system.onUpdate(delta, this.time)
    }
  }

  /**
   * Resets the World.
   *
   * This removes all entities, and calls onDestroy on all Systems.
   * Components and Systems will remain registered.
   * The World will need to be initialised again after this.
   */
  reset(): void {
    this.time = 0
    this.initialised = false
    this.systemManager.destroy()

    for (const entity of this.entities.values()) {
      this.destroy(entity)
    }
  }

  /**
   * Creates an Entity
   * @param initFn an optional function to bulk add components to the new Entity
   * @returns the new Entity
   *
   * @example
   * ```ts
   * import { World } from '@arancini/core'
   *
   * const world = new World()
   *
   * // create an entity
   * const entity = world.create()
   *
   * // create an entity with components
   * const entityWithComponents = world.create((entity) => {
   *   entity.add(ExampleComponentOne)
   *   entity.add(ExampleComponentTwo)
   * })
   * ```
   */
  create(initFn?: (entity: Entity) => void): Entity {
    const entity = this.entityPool.request()

    if (this.initialised) {
      this.initialiseEntity(entity)
    }

    if (initFn) {
      entity.bulk(initFn)
    }

    this._addEntity(entity)

    return entity
  }

  /**
   * Destroys an Entity
   * @param entity the Entity to destroy
   */
  destroy(entity: Entity): void {
    this._removeEntity(entity)

    /* remove components without updating queries or bitsets */
    entity._updateQueries = false
    entity._updateBitSet = false

    for (const component of Object.values(entity._components)) {
      const internal = component as InternalComponentInstanceProperties
      entity.remove(internal._arancini_component_definition!)
    }

    entity._updateQueries = true
    entity._updateBitSet = true

    /* remove entity from queries */
    for (const query of this.queryManager.queries.values()) {
      query._removeEntity(entity)
    }

    /* recycle the entity object */
    this.entityPool.recycle(entity)
  }

  /**
   * Creates a Query
   * @param queryDescription the query to create
   * @returns the Query
   */
  query(queryDescription: QueryDescription): Query {
    return this.queryManager.createQuery(queryDescription)
  }

  /**
   * Filters entities that match a given query description.
   * @param queryDescription the query conditions to match
   * @returns entities matching the query description
   */
  filter(queryDescription: QueryDescription): Entity[] {
    const query = this.queryManager.findQuery(queryDescription)

    if (query) {
      return query.entities
    }

    return super.filter(queryDescription)
  }

  /**
   * Finds an entity that matches a given query description.
   * @param queryDescription the query conditions to match
   * @returns the first entity matching the query description
   */
  find(queryDescription: QueryDescription): Entity | undefined {
    const query = this.queryManager.findQuery(queryDescription)

    if (query) {
      return query.first
    }

    return super.find(queryDescription)
  }

  /**
   * Registers a Component.
   * For best performance, register all Component classes before initialising the World.
   * @param componentDefinition the Component definition to register
   * @returns the World
   */
  registerComponent(componentDefinition: ComponentDefinition<unknown>): World {
    this.componentRegistry.registerComponent(componentDefinition)
    return this
  }

  /**
   * Adds a system to the World
   * @param system the system to add to the World
   * @returns the World
   */
  registerSystem<T extends System>(
    system: SystemClass<T>,
    attributes?: SystemAttributes
  ): World {
    this.systemManager.registerSystem(system, attributes)
    return this
  }

  /**
   * Removes a System from the World
   * @param system the System to remove from the World
   * @returns the World
   */
  unregisterSystem<T extends System>(system: SystemClass<T>): World {
    this.systemManager.unregisterSystem(system)
    return this
  }

  /**
   * Retrives a System by class
   * @param clazz the System class
   * @returns the System, or undefined if it is not registerd
   */
  getSystem<S extends System>(clazz: SystemClass<S>): S | undefined {
    return this.systemManager.systems.get(clazz) as S | undefined
  }

  /**
   * Retrieves a list of all Systems in the world
   * @returns all Systems in the world
   */
  getSystems(): System[] {
    return Array.from(this.systemManager.systems.values())
  }

  private initialiseEntity(e: Entity): void {
    e.initialised = true

    for (const component of Object.values(e._components)) {
      const internal = component as InternalComponentInstanceProperties
      if (
        internal._arancini_component_definition?.type ===
        ComponentDefinitionType.CLASS
      ) {
        ;(component as Component).onInit()
      }
    }
  }
}
