import { ComponentClass } from './component'
import type { Query, QueryDescription } from './query'
import type { System, SystemClass, SystemQueryOptions } from './system'
import { isSubclassMethodOverridden } from './utils'
import type { World } from './world'

export type SystemAttributes = {
  priority?: number
}

export type SystemSingletonPlaceholder = {
  __internal: {
    placeholder: true
    componentClass: ComponentClass
    options?: SystemQueryOptions
  }
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
      if (!system.enabled) {
        continue
      }

      if (
        system.__internal.requiredQueries.length > 0 &&
        system.__internal.requiredQueries.some((q) => q.entities.length === 0)
      ) {
        continue
      }

      system.onUpdate(delta, time)
    }
  }

  /**
   * Destroys all systems
   */
  destroy(): void {
    for (const system of this.systems.values()) {
      system.onDestroy()
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

    /* instantiate the system */
    this.systemCounter++
    const system = new Clazz(this.world)
    this.systems.set(Clazz, system)

    /* set internal properties */
    system.__internal.class = Clazz
    system.__internal.priority = attributes?.priority ?? 0
    system.__internal.order = this.systemCounter

    /* replace singleton placeholders */
    // eslint-disable-next-line guard-for-in
    for (const fieldName in system) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const _system = system as any

      const field = _system[fieldName]

      if (field?.__internal?.placeholder) {
        const {
          __internal: { componentClass, options },
        } = field as SystemSingletonPlaceholder

        const query = this.createSystemQuery(system, [componentClass], options)

        const onQueryChange = () => {
          _system[fieldName] = query.first?.get(componentClass)
        }

        query.onEntityAdded.add(onQueryChange)
        query.onEntityRemoved.add(onQueryChange)
        onQueryChange()
      }
    }

    // if the system has an onUpdate method, add it to the sorted systems.
    // systems are sorted immediately if the system manager is initialised, otherwise
    // they are sorted on initialisation.
    const hasOnUpdate = isSubclassMethodOverridden(Clazz, 'onUpdate')
    if (hasOnUpdate) {
      this.sortedSystems.push(system)
    }

    if (this.initialised) {
      system.onInit()

      if (hasOnUpdate) {
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

  /**
   * Creates a query for a system
   * @param system the system to create the query for
   * @param queryDescription the query description
   * @param options the options for the query
   */
  createSystemQuery(
    system: System,
    queryDescription: QueryDescription,
    options?: SystemQueryOptions
  ): Query {
    const query = this.world.queryManager.createQuery(queryDescription)

    system.__internal.queries.add(query)

    if (options?.required) {
      system.__internal.requiredQueries.push(query)
    }

    return query
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
