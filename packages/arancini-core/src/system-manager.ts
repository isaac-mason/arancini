import type { Query } from './query'
import type { System, SystemClass } from './system'
import { isSubclassMethodOverridden } from './utils'
import type { World } from './world'

export type SystemAttributes = {
  priority?: number
}

/**
 * SystemManager is an internal class that manages Systems and calls their lifecycle hooks.
 *
 * Handles adding and removing systems and providing them with queries via the `QueryManager`.
 *
 * Maintains the usage of queries by systems and removes queries from the `QueryManager` if no systems are
 * using a query.
 *
 * @private internal class, do not use directly
 */
export class SystemManager {
  /**
   * Systems in the System Manager
   */
  systems: Map<SystemClass, System> = new Map()

  /**
   * Systems sorted by priority and registration order
   */
  private sortedSystems: System[] = []

  /**
   * Counter for the number of systems registered, used to give systems a registration order
   */
  private systemCounter = 0

  /**
   * Whether the system manager has been initialised
   */
  private initialised = false

  /**
   * The World the system manager belongs in
   */
  private world: World

  /**
   * Constructor for the SystemManager
   * @param world the World for the SystemManager
   */
  constructor(world: World) {
    this.world = world
  }

  /**
   * Initialises the system manager
   */
  init(): void {
    this.initialised = true

    for (const system of this.systems.values()) {
      system.onInit()
    }

    this.sortSystems()
  }

  /**
   * Updates Systems in the SystemManager
   * @param delta the time elapsed in seconds
   * @param time the current time in seconds
   */
  update(delta: number, time: number): void {
    for (const system of this.sortedSystems.values()) {
      if (system.enabled) {
        system.onUpdate(delta, time)
      }
    }
  }

  /**
   * Destroys all systems
   */
  destroy(): void {
    for (const system of this.systems.values()) {
      system.onDestroy()
      this.systems.delete(system.__internal.class)
    }
  }

  /**
   * Adds a system to the system manager
   * @param Clazz the system class to add
   */
  registerSystem(Clazz: SystemClass, attributes?: SystemAttributes): void {
    if (this.systems.has(Clazz)) {
      throw new Error(`System "${Clazz.name}" has already been registered`)
    }

    this.systemCounter++

    const system = new Clazz(this.world)
    system.__internal.class = Clazz
    system.__internal.priority = attributes?.priority ?? 0
    system.__internal.order = this.systemCounter

    this.systems.set(Clazz, system)

    const hasOnUpdate = isSubclassMethodOverridden(Clazz, 'onUpdate')

    if (hasOnUpdate) {
      this.sortedSystems.push(system)
    }

    if (this.initialised) {
      system.onInit()

      if (hasOnUpdate) {
        // if the system manager is not initialised, systems will be sorted on initialisation
        this.sortSystems()
      }
    }
  }

  /**
   * Unregisters a System from the SystemManager
   * @param clazz the System to remove
   */
  unregisterSystem(clazz: SystemClass): void {
    const system = this.systems.get(clazz)
    if (!system) {
      return
    }

    this.systems.delete(clazz)
    this.sortedSystems = this.sortedSystems.filter(
      (s) => s.__internal.class !== clazz
    )

    system.__internal.queries.forEach((query: Query) => {
      this.world.queryManager.removeQuery(query)
    })

    system.onDestroy()
  }

  private sortSystems(): void {
    this.sortedSystems.sort((a, b) => {
      return (
        // higher priority runs first
        b.__internal.priority - a.__internal.priority ||
        // default to order system was registered
        a.__internal.order - b.__internal.order
      )
    })
  }
}
