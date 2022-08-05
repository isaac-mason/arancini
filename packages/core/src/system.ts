import { Query, QueryDescription } from './query';
import { uniqueId } from './utils';
import { World } from './world';

export type SystemClass<T extends System = System> = {
  new (): T;
};

/**
 * Systems contain queries for entities and have lifecycle methods `onInit`, `onUpdate` and `onDestroy` that can add logic to a world.
 *
 * ```ts
 * class ExampleSystem extends System {
 *   // define a property for a query
 *   queryName!: Query;
 *
 *   onInit() {
 *     // logic to run to initialise the system, e.g. creating queries
 *     this.queryName = this.query({
 *       all: [ComponentOne, ComponentTwo],
 *       one: [ComponentThree, ComponentFour],
 *       not: [ComponentFive],
 *     });
 *   }
 *
 *   onUpdate(delta: number) {
 *     // do something with the query results
 *
 *     // added since the last update
 *     console.log(this.queryName.added)
 *
 *     // removed since the last update
 *     console.log(this.queryName.removed)
 *
 *     // all currently matched
 *     console.log(this.queryName.all)
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
   * The id for the system
   */
  id = uniqueId();

  /**
   * The World the system is in
   */
  world!: World;

  /**
   * @private used internally, do not use directly
   */
  __recs: {
    /**
     * The System class
     */
    class: SystemClass;

    /**
     * A map of query names to query descriptions
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  } = { queries: new Set(), priority: 0, order: 0, class: null! };

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
