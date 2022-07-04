import { Query, QueryDescription } from './query';
import { uuid } from './utils';
import { World } from './world';

/**
 * Object with keys as friendly query names and values as Query Descriptions
 *
 * Used for defining what queries a System should have
 */
export type SystemQueries = { [queryName: string]: QueryDescription };

/**
 * System containing logic and queries for entities with given components.
 *
 * Systems can be created with multiple Queries for Entities by what Components they contain.
 *
 * Systems have lifecycle methods `onInit`, `onUpdate`, and `onDestroy` that are executed as part of World updates.
 *
 * Systems also have their own events system `events` that can be used to run that isn't required to be run on every update.
 *
 * ```ts
 * class ExampleSystem extends System {
 *   // queries to create the system with
 *   queries = {
 *     queryName: {
 *       all: [ComponentOne, ComponentTwo],
 *       one: [ComponentThree, ComponentFour],
 *       not: [ComponentFive],
 *     }
 *   }
 *
 *   onInit() {
 *     // logic to run to initialise the system
 *   }
 *
 *   onUpdate(timeElapsed: number) {
 *     // do something with the query results
 *
 *     // added this update
 *     console.log(this.results.queryName.added)
 *
 *     // removed this update
 *     console.log(this.results.queryName.removed)
 *
 *     // all currently matched
 *     console.log(this.results.queryName.all)
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
   * A map of query names to query descriptions
   *
   * This property should be overridden with desired System queries
   */
  queries: SystemQueries = {};

  /**
   * A map of query names to queries
   *
   * This object is populated by the SystemManager on adding the System to the SystemManager
   */
  results: { [name: string]: Query } = {};

  /**
   * The World the system is in
   */
  world!: World;

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
   * @param timeElapsed the time since the last update in seconds
   * @param time the current time in seconds
   */
  onUpdate(_timeElapsed: number, _time: number) {}
}
