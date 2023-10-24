import type { Query, QueryDescription } from './query'
import type { World } from './world'

const isSubclassMethodOverridden = (
  clazz: { new (...args: never[]): unknown },
  methodName: string
): boolean => {
  return Object.getOwnPropertyNames(clazz.prototype).includes(methodName)
}

export type SystemQueryOptions = {
  required?: boolean
}

export type SystemClass<T extends System = System> = {
  new (world: World): T
}

/**
 * Systems contain queries for entities and have lifecycle methods `onInit`, `onUpdate` and `onDestroy` that can add logic to a world.
 *
 * ```ts
 * class ExampleSystem extends System {
 *   // create a query
 *   queryName = this.query({
 *     all: [ComponentOne, ComponentTwo],
 *     one: [ComponentThree, ComponentFour],
 *     not: [ComponentFive],
 *   })
 *
 *   // optionally override the default System constructor
 *   constructor(world: World) {
 *     super(world)
 *
 *     // constructor logic...
 *   }
 *
 *   // any logic for initialising the system
 *   onInit() {
 *     // ...
 *   }
 *
 *   onUpdate(delta: number) {
 *     // do something with the query results!
 *     console.log(this.queryName.entities)
 *   }
 *
 *   onDestroy() {
 *     // logic to run to destroy the system
 *   }
 * }
 * ```
 */
export abstract class System<E extends {} = any> {
  /**
   * Whether the system is enabled and should update
   */
  enabled = true

  /**
   * The World the system is in
   */
  world: World<E>

  /**
   * @private used internally, do not use directly
   */
  __internal: {
    /**
     * The System class
     */
    class: SystemClass

    /**
     * A set of queries used by the system
     */
    queries: Set<Query<E>>

    /**
     * The priority of the system, determines system run order.
     */
    priority: number

    /**
     * The order the system was inserted in
     */
    order: number

    /**
     * Queries that must have at least one result for onUpdate to be called
     */
    requiredQueries: Query<any>[]
  } = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    class: null!,
    queries: new Set(),
    priority: 0,
    order: 0,
    requiredQueries: [],
  }

  constructor(world: World) {
    this.world = world
  }

  /**
   * Logic for destruction of the system. Called on destroying the World, or removing the System from the World.
   */
  onDestroy(): void {}

  /**
   * Logic for initialising of the system. Called when initialising the World, or on adding the System to an initialised World.
   */
  onInit(): void {}

  /**
   * Logic for a systems update loop
   * @param _delta the time since the last update in seconds
   * @param _time the current time in seconds
   */
  onUpdate(_delta: number, _time: number) {}

  /**
   * Unregisters the system
   */
  unregister(): void {
    this.world.unregisterSystem(this.__internal.class)
  }

  /**
   * Creates and returns a query that gets updated every update.
   * @param queryDescription the query description
   * @param options optional options for the system query
   * @returns the query
   */
  protected query<ResultEntity>(
    queryDescription: QueryDescription<E, ResultEntity>,
    options?: SystemQueryOptions
  ): Query<ResultEntity> {
    return this.world.systemManager.createSystemQuery(
      this,
      queryDescription,
      options
    )
  }

  /**
   * Shortcut for creating a query for a singleton component.
   * @param componentDefinition the singleton component
   */
  protected singleton<C extends keyof E>(
    component: C,
    options?: SystemQueryOptions
  ): E[C] | undefined {
    const placeholder: SingletonQueryPlaceholder = {
      __internal: {
        systemSingletonPlaceholder: true,
        component: component as string,
        options,
      },
    }

    return placeholder as E[C] | undefined
  }

  /**
   * Returns a reference to another system that updates as systems are registered and unregistered.
   * @param systemClass
   * @returns a reference to the system that will be set just before the onInit method is called.
   */
  protected attach<T extends SystemClass<any>>(systemClass: T) {
    const placeholder: AttachedSystemPlaceholder = {
      __internal: {
        attachedSystemPlaceholder: true,
        systemClass,
      },
    }

    return placeholder as InstanceType<T> | undefined
  }
}

export type SystemAttributes = {
  priority?: number
}

type AttachedSystemPlaceholder = {
  __internal: {
    attachedSystemPlaceholder: true
    systemClass: SystemClass<any>
  }
}

type SingletonQueryPlaceholder = {
  __internal: {
    systemSingletonPlaceholder: true
    component: string
    options?: SystemQueryOptions
  }
}

/**
 * @ignore internal
 */
export class SystemManager {
  systems: Map<SystemClass, System> = new Map()

  private sortedSystems: System[] = []

  private systemCounter = 0

  private systemAttachments: Map<
    System,
    { field: string; systemClass: SystemClass }[]
  > = new Map()

  private world: World

  constructor(world: World) {
    this.world = world
  }

  init(): void {
    for (const system of this.systems.values()) {
      this.initSystem(system)
    }

    this.sortSystems()
  }

  update(delta: number, time: number): void {
    for (let i = 0; i < this.sortedSystems.length; i++) {
      const system = this.sortedSystems[i]

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

  destroy(): void {
    for (const system of this.systems.values()) {
      system.onDestroy()
    }
  }

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

    this.initSingletonQueries(system)
    this.updateAllSystemAttachments()

    // if the system has an onUpdate method, add it to the sorted systems.
    // systems are sorted immediately if the system manager is initialised, otherwise
    // they are sorted on initialisation.
    const hasOnUpdate = isSubclassMethodOverridden(Clazz, 'onUpdate')
    if (hasOnUpdate) {
      this.sortedSystems.push(system)
    }

    if (this.world.initialised) {
      this.initSystem(system)

      if (hasOnUpdate) {
        this.sortSystems()
      }
    }
  }

  unregisterSystem(clazz: SystemClass): void {
    const system = this.systems.get(clazz)
    if (!system) {
      return
    }

    this.systems.delete(clazz)
    this.sortedSystems = this.sortedSystems.filter(
      (s) => s.__internal.class !== clazz
    )

    system.__internal.queries.forEach((query: Query<unknown>) => {
      this.world.destroyQuery(query, system)
    })
    system.__internal.requiredQueries = []

    system.onDestroy()

    this.updateAllSystemAttachments()
  }

  createSystemQuery<E extends {}, ResultEntity>(
    system: System<E>,
    queryDescription: QueryDescription<E, ResultEntity>,
    options?: SystemQueryOptions
  ): Query<ResultEntity> {
    const query = this.world.query(queryDescription, { owner: system })

    if (options?.required) {
      system.__internal.requiredQueries.push(query)
    }

    return query
  }

  private initSystem(system: System) {
    system.onInit()
  }

  private initSingletonQueries(system: System | any) {
    for (const fieldName in system) {
      const _system = system as any

      const field = _system[fieldName]

      if (field?.__internal?.systemSingletonPlaceholder) {
        const {
          __internal: { component, options },
        } = field as SingletonQueryPlaceholder

        const queryDescription: QueryDescription<any, any> = (q) =>
          q.has(component)

        const query = this.createSystemQuery(system, queryDescription, options)

        const onQueryChange = () => {
          _system[fieldName] = query.first?.[component]
        }

        query.onEntityAdded.add(onQueryChange)
        query.onEntityRemoved.add(onQueryChange)
        onQueryChange()
      }
    }
  }

  private updateSystemAttachments(system: System | any) {
    // check for placeholders
    for (const fieldName in system) {
      const field = system[fieldName]

      if (field?.__internal?.attachedSystemPlaceholder) {
        const systemAttachments = this.systemAttachments.get(system) ?? []

        systemAttachments.push({
          field: fieldName,
          systemClass: field.__internal.systemClass,
        })

        this.systemAttachments.set(system, systemAttachments)

        const {
          __internal: { systemClass },
        } = field as AttachedSystemPlaceholder

        system[fieldName] = this.world.getSystem(systemClass)
      }
    }

    // update existing attachments
    const systemAttachments = this.systemAttachments.get(system) ?? []
    for (const { field, systemClass } of systemAttachments) {
      system[field] = this.world.getSystem(systemClass)
    }
  }

  private updateAllSystemAttachments() {
    for (const system of this.systems.values()) {
      this.updateSystemAttachments(system)
    }
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
