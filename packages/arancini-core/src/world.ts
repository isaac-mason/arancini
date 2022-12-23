import type { ComponentClass, ComponentDetails } from './component'
import { ComponentRegistry } from './component-registry'
import type { Entity } from './entity'
import type { Event, EventHandler, EventSubscription } from './events'
import { EventSystem } from './events'
import type { Query, QueryDescription } from './query'
import { QueryManager } from './query-manager'
import type { Space, SpaceParams } from './space'
import { SpaceManager } from './space-manager'
import type { System, SystemClass } from './system'
import type { SystemAttributes } from './system-manager'
import { SystemManager } from './system-manager'
import { uniqueId } from './utils'

export const WORLD_DEFAULT_SPACE_ID = '__arancini_default_world_space'

/**
 * A World that can contain Spaces with Entities, Systems, and Queries.
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
 * // subscribe to a world event
 * world.on('message', (e) => {
 *   // ...
 * })
 *
 * // emit a world event
 * world.emit({
 *  topic: 'message',
 * })
 * ```
 */
export class World {
  /**
   * A unique id for the World
   */
  id = uniqueId()

  /**
   * Whether the World has been initialised
   */
  initialised = false

  /**
   * The current World time
   */
  time = 0

  /**
   * The default Space for the World
   */
  defaultSpace: Space

  /**
   * The World EventSystem
   */
  events: EventSystem

  /**
   * The SpaceManager for the World
   * Manages Spaces, Entities and Components
   */
  spaceManager: SpaceManager

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
   * Constructor for a World
   */
  constructor() {
    this.events = new EventSystem()
    this.componentRegistry = new ComponentRegistry(this)
    this.spaceManager = new SpaceManager(this)
    this.queryManager = new QueryManager(this)
    this.systemManager = new SystemManager(this)
    this.defaultSpace = this.create.space({ id: WORLD_DEFAULT_SPACE_ID })
  }

  /**
   * Retrieves World factories
   */
  create: {
    /**
     * Creates a new Entity in the default World Space
     * @see defaultSpace
     * @returns a new Entity
     */
    entity: (components?: ComponentDetails[]) => Entity
    /**
     * Creates a Space in the Qorld
     * @param params the params for the space
     * @returns the new Space
     */
    space: (params?: SpaceParams) => Space
    /**
     * Creates a Query from a given query description
     * @param queryDescription the query description
     * @returns the Query
     */
    query: (queryDescription: QueryDescription) => Query
  } = {
    entity: (components) => {
      return this.spaceManager.createEntity(this.defaultSpace, components)
    },
    space: (params) => {
      return this.spaceManager.createSpace(params)
    },
    query: (queryDescription) => {
      return this.queryManager.createQuery(queryDescription)
    },
  }

  /**
   * Initialises the World
   */
  init(): void {
    this.initialised = true
    this.spaceManager.init()
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
    this.systemManager.destroy()
    this.spaceManager.destroy()
  }

  /**
   * Broadcasts an event to the World
   * @param event the event to broadcast in the World
   */
  emit<E extends Event | Event>(event: E): void {
    this.events.emit(event)
  }

  /**
   * Adds a handler for World events
   * @param topic the topic name
   * @param handler the handler function
   * @returns the id of the new handler
   */
  on<E extends Event | Event>(
    topic: E['topic'],
    handler: EventHandler<E>
  ): EventSubscription {
    return this.events.on(topic, handler)
  }

  /**
   * Retrieves entities that match a given query description.
   * @param queryDescription the query description
   * @returns an array of matching entities
   */
  query(queryDescription: QueryDescription): Entity[] {
    return this.queryManager.query(queryDescription)
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
   * Adds a System to the World
   * @param system the System to add to the World
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

  /**
   * Retrives a Space by id
   * @param id the Space id
   * @returns the Space, or undefined if a Space with the given id is not in the World
   */
  getSpace(id: string): Space | undefined {
    return this.spaceManager.spaces.get(id)
  }
}
