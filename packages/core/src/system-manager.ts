import { Query } from './query';
import { World } from './world';
import { System, SystemClass } from './system';
import { isSubclassMethodOverridden } from './utils';

export type SystemAttributes = {
  priority?: number;
};

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
  systems: Map<SystemClass, System> = new Map();

  /**
   * Systems with onUpdate methods overriden sorted by priority
   */
  private sortedSystems: System[] = [];

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
   * @param Clazz the system class to add
   */
  registerSystem(Clazz: SystemClass, attributes?: SystemAttributes): void {
    if (this.systems.has(Clazz)) {
      throw new Error(`System "${Clazz.name}" has already been registered`);
    }

    const system = new Clazz();
    system.world = this.world;
    system.__recs.clazz = Clazz;
    system.__recs.priority = attributes?.priority ?? 0;
    system.__recs.order = this.systems.size;

    this.systems.set(Clazz, system);

    if (isSubclassMethodOverridden(system.__recs.clazz, 'onUpdate')) {
      this.sortedSystems.push(system);

      this.sortedSystems.sort((a, b) => {
        return (
          a.__recs.priority - b.__recs.priority ||
          a.__recs.order - b.__recs.order
        );
      });
    }

    if (this.initialised) {
      this.initialiseSystem(system);
    }
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
   * @param clazz the system to remove
   */
  unregisterSystem(clazz: SystemClass): void {
    const system = this.systems.get(clazz);
    if (!system) {
      return;
    }

    this.systems.delete(clazz);

    system.__recs.queries.forEach((query: Query) => {
      this.removeSystemFromQuery(query, system);
    });

    this.destroySystem(system);
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

  /**
   * Adds a system to a query
   * @param query the query the system is being added to
   * @param system the system to add
   */
  addSystemToQuery(query: Query, system: System) {
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
      // - the query is not standalone ie only used by systems
      // - it is not being used by any systems
      if (!query.standalone && systems.size === 0) {
        this.world.queryManager.removeQuery(query);
      }
    }
  }
}
