import { Query, QueryDescription } from './query';
import { uuid } from './utils';
import { World } from './world';

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
 *   onUpdate(timeElapsed: number) {
 *     // do something with the query results
 *
 *     // added this update
 *     console.log(this.queryName.added)
 *
 *     // removed this update
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
  id = uuid();

  /**
   * The World the system is in
   */
  world!: World;

  /**
   * A map of query names to query descriptions
   *
   * @private used internally, do not use directly
   */
  _queries: Set<Query> = new Set();

  /**
   * Destroys the system and removes it from the RECS
   */
  destroy(): void {
    this.world.remove(this);
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
   * @param _timeElapsed the time since the last update in seconds
   * @param _time the current time in seconds
   */
  onUpdate(_timeElapsed: number, _time: number) {}

  /**
   * Creates and returns a query that gets updated every update.
   * @param queryDescription the query description
   * @returns the query
   */
  protected query(queryDescription: QueryDescription): Query {
    const query = this.world.queryManager.getQuery(queryDescription);
    this.world.systemManager.addSystemToQuery(query, this);
    this._queries.add(query);

    return query;
  }
}
