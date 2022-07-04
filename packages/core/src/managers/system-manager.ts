import { Query, QueryDescription } from '../query';
import { World } from '../world';
import { System } from '../system';

/**
 * SystemManager is an internal class that manages systems in a RECS and calls their lifecycle hooks.
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
  systems: Map<string, System> = new Map();

  /**
   * Whether the system manager has been initialised
   */
  private initialised = false;

  /**
   * A map of query ids to systems using the query
   */
  private queryToSystems: Map<string, Set<System>> = new Map();

  /**
   * A map of ids to systems with update methods
   */
  private updatePool: Map<string, System> = new Map();

  /**
   * The World the system manager belongs in
   */
  private world: World;

  /**
   * Constructor for the SystemManager
   * @param world the World for the SystemManager
   */
  constructor(world: World) {
    this.world = world;
  }

  /**
   * Adds a system to the system manager
   * @param system the system to add
   */
  addSystem(system: System): SystemManager {
    system.world = this.world;

    this.systems.set(system.id, system);

    Object.entries(system.queries).forEach(
      ([queryName, queryDescription]: [string, QueryDescription]) => {
        const query = this.world.queryManager.getQuery(queryDescription);
        this.addSystemToQuery(query, system);
        system.results[queryName] = query;
      }
    );

    if (this.initialised) {
      this.initialiseSystem(system);
    }

    return this;
  }

  /**
   * Destroys all systems
   */
  destroy(): void {
    for (const system of this.systems.values()) {
      this.destroySystem(system);
    }
  }

  /**
   * Initialises the system manager
   */
  init(): void {
    this.initialised = true;
    for (const system of this.systems.values()) {
      this.initialiseSystem(system);
    }
  }

  /**
   * Removes a system from the system manager
   * @param system the system to remove
   */
  removeSystem(system: System): SystemManager {
    this.systems.delete(system.id);

    Object.entries(system.queries).forEach(
      ([queryName, queryDescription]: [string, QueryDescription]) => {
        const query = this.world.queryManager.getQuery(queryDescription);
        this.removeSystemFromQuery(query, system);
        delete system.results[queryName];
      }
    );

    this.destroySystem(system);

    return this;
  }

  /**
   * Updates systems in the system manager
   * @param timeElapsed the time elapsed in seconds
   * @param time the current time in seconds
   */
  update(timeElapsed: number, time: number): void {
    for (const system of this.systems.values()) {
      if (system.enabled) {
        system.onUpdate(timeElapsed, time);
      }
    }
  }

  private addSystemToQuery(query: Query, system: System) {
    let systems: Set<System> | undefined = this.queryToSystems.get(query.key);

    if (systems === undefined) {
      systems = new Set([system]);
      this.queryToSystems.set(query.key, systems);
    }

    systems.add(system);
  }

  private destroySystem(system: System) {
    system.onDestroy();
  }

  private initialiseSystem(system: System) {
    this.updatePool.set(system.id, system);

    system.onInit();
  }

  private removeSystemFromQuery(query: Query, system: System) {
    const systems: Set<System> | undefined = this.queryToSystems.get(query.key);

    if (systems !== undefined) {
      systems.delete(system);

      // remove the query if
      // - the query is standalone ie only used by systems
      // - it is not being used by any systems
      if (!query.standalone && systems.size === 0) {
        this.world.queryManager.removeQuery(query);
      }
    }
  }
}
