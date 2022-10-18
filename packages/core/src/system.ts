import { Query, QueryDescription } from './query';
import { World } from './world';

export type SystemClass<T extends System = System> = {
  new (world: World): T;
};

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
 *   });
 *
 *   // optionally override the default System constructor
 *   constructor(world: World) {
 *     super(world);
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
  enabled = true;

  /**
   * The World the system is in
   */
  world: World;

  /**
   * @private used internally, do not use directly
   */
  __recs: {
    /**
     * The System class
     */
    class: SystemClass;

    /**
     * A set of queries used by the system
     */
    queries: Set<Query>;

    /**
     * The priority of the system, determines system run order.
     */
    priority: number;

    /**
     * The order the system was inserted in
     */
    order: number;
  } = {
    queries: new Set(),
    priority: 0,
    order: 0,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    class: null!,
  };

  constructor(world: World) {
    this.world = world;
  }

  /**
   * Logic for destruction of the system. Called on removing a System from the RECS.
   */
  onDestroy(): void {}

  /**
   * Logic for initialisation of the system. Called during System construction.
   */
  onInit(): void {}

  /**
   * Logic for a systems update loop
   * @param _delta the time since the last update in seconds
   * @param _time the current time in seconds
   */
  onUpdate(_delta: number, _time: number) {}

  /**
   * Destroys the system and removes it from the RECS
   */
  destroy(): void {
    this.world.unregisterSystem(this.__recs.class);
  }

  /**
   * Creates and returns a query that gets updated every update.
   * @param queryDescription the query description
   * @returns the query
   */
  protected query(queryDescription: QueryDescription): Query {
    const query = this.world.queryManager.createQuery(queryDescription);
    this.__recs.queries.add(query);

    return query;
  }
}
