import type { AnyEntity, Query, QueryDescription, World } from '@arancini/core'
import { Executor, createSystemQuery } from './executor'

export type SystemQueryOptions = {
  required?: boolean
}

export type SystemClass<
  T extends System = System,
  E extends AnyEntity = any,
> = {
  new (exectuor: Executor<E>): T
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
export abstract class System<E extends AnyEntity = any> {
  /**
   * Whether the system is enabled and should update
   */
  enabled = true

  /**
   * The Executor the system is in
   */
  executor: Executor<E>
  
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

  constructor(executor: Executor<E>) {
    this.executor = executor
    this.world = executor.world
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
    this.executor.remove(this.__internal.class)
  }

  /**
   * Creates and returns a query that gets updated every update.
   * @param queryDescription the query description
   * @param options optional options for the system query
   * @returns the query
   */
  protected query<ResultEntity extends E>(
    queryDescription: QueryDescription<E, ResultEntity>,
    options?: SystemQueryOptions
  ): Query<ResultEntity> {
    return createSystemQuery(
      this.executor.world,
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

export type AttachedSystemPlaceholder = {
  __internal: {
    attachedSystemPlaceholder: true
    systemClass: SystemClass<any>
  }
}

export type SingletonQueryPlaceholder = {
  __internal: {
    systemSingletonPlaceholder: true
    component: string
    options?: SystemQueryOptions
  }
}
