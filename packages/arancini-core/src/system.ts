import { ComponentDefinition, ComponentDefinitionInstance } from './component'
import type { QueryDescription } from './query'
import { Query } from './query'
import type { SystemSingletonPlaceholder } from './system-manager'
import type { World } from './world'

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
export abstract class System {
  /**
   * Whether the system is enabled and should update
   */
  enabled = true

  /**
   * The World the system is in
   */
  world: World

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
    queries: Set<Query>

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
    requiredQueries: Query[]
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
   * Destroys the system and removes it from the World
   */
  destroy(): void {
    this.world.unregisterSystem(this.__internal.class)
  }

  /**
   * Creates and returns a query that gets updated every update.
   * @param queryDescription the query description
   * @param options optional options for the system query
   * @returns the query
   */
  protected query(
    queryDescription: QueryDescription,
    options?: SystemQueryOptions
  ): Query {
    return this.world.systemManager.createSystemQuery(
      this,
      queryDescription,
      options
    )
  }

  /**
   * Shortcut for creating a query for a singleton component.
   * @param clazz the singleton component class
   */
  protected singleton<T extends ComponentDefinition<unknown>>(
    componentDefinition: T,
    options?: SystemQueryOptions
  ): ComponentDefinitionInstance<T> | undefined {
    const placeholder: SystemSingletonPlaceholder = {
      __internal: {
        placeholder: true,
        componentDefinition,
        options,
      },
    }

    return placeholder as ComponentDefinitionInstance<T> | undefined
  }
}
