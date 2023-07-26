import type { ComponentClass } from './component'
import { ComponentRegistry } from './component-registry'
import type { Entity } from './entity'
import { EntityManager } from './entity-manager'
import type { Query, QueryDescription } from './query'
import { QueryManager } from './query-manager'
import type { System, SystemClass } from './system'
import type { SystemAttributes } from './system-manager'
import { SystemManager } from './system-manager'

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
 * // destroy the world, removing all entities
 * world.destroy()
 * ```
 */
export class World {
  /**
   * Whether the World has been initialised
   */
  initialised = false

  /**
   * The current World time
   */
  time = 0

  /**
   * The EntityManager for the World
   * Manages Entities and Components
   */
  entityManager: EntityManager

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
   * Entities in the World
   */
  entities: Map<string, Entity> = new Map()

  /**
   * Constructor for a World
   */
  constructor() {
    this.componentRegistry = new ComponentRegistry(this)
    this.entityManager = new EntityManager(this)
    this.queryManager = new QueryManager(this)
    this.systemManager = new SystemManager(this)
  }

  /**
   * Initialises the World
   */
  init(): void {
    this.initialised = true
    this.entityManager.init()
    this.systemManager.init()
  }

  /**
   * Updates the World
   * @param delta the time elapsed in seconds, uses 0 if not specified
   */
  update(delta = 0): void {
    this.time += delta
    this.systemManager.update(delta, this.time)
  }

  /**
   * Destroys the World
   */
  destroy(): void {
    this.time = 0
    this.initialised = false
    this.systemManager.destroy()
    this.entityManager.destroy()
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
    const entity = this.entityManager.createEntity()

    if (initFn) {
      entity.bulk(initFn)
    }

    return entity
  }

  /**
   * Creates a Query
   * @param queryDescription the query description
   * @returns the Query
   */
  query(queryDescription: QueryDescription): Query {
    return this.queryManager.createQuery(queryDescription)
  }

  /**
   * Finds entities that match a given query description.
   * @param queryDescription the query description
   * @returns entities matching the query description
   */
  find(queryDescription: QueryDescription): Entity[] {
    return this.queryManager.find(queryDescription)
  }

  /**
   * Registers a Component class.
   * For best performance, register all Component classes before initialising the World.
   * @param component the Component class to register
   * @returns the World
   */
  registerComponent(component: ComponentClass): World {
    this.componentRegistry.registerComponent(component)
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
}
