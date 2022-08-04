import { ComponentClass } from './component';
import { ComponentRegistry } from './component-registry';
import { Entity } from './entity';
import { Event, EventHandler, EventSubscription, EventSystem } from './events';
import { Query, QueryDescription } from './query';
import { QueryManager } from './query-manager';
import { Space, SpaceParams } from './space';
import { SpaceManager } from './space-manager';
import { System, SystemClass } from './system';
import { SystemAttributes, SystemManager } from './system-manager';
import { uniqueId } from './utils';

/**
 * A World that can contain Spaces with Entities, Systems, and Queries.
 *
 * ```ts
 * import { World } from "@rapidajs/recs";
 *
 * const world = new World();
 *
 * // initialise the world
 * world.init();
 *
 * // update the world without specifying time elapsed
 * // (delta in Components and Systems will be 0)
 * world.update();
 *
 * // update the world with a specified time elapsed
 * // (delta in Components and Systems will be set to this value)
 * world.update(0.1);
 *
 * // subscribe to a world event
 * world.on('message', (e) => {
 *   // ...
 * });
 *
 * // emit a world event
 * world.emit({
 *  topic: 'message',
 * })
 * ```
 */
export class World {
  /**
   * A unique id for the World
   */
  id = uniqueId();

  /**
   * Whether the World has been initialised
   */
  initialised = false;

  /**
   * The world EventSystem
   */
  events = new EventSystem();

  /**
   * The SpaceManager for the World.
   *
   * Manages Spaces, Entities and Components
   */
  spaceManager: SpaceManager;

  /**
   * The QueryManager for the World.
   *
   * Manages and updates Queries.
   */
  queryManager: QueryManager;

  /**
   * The SystemManager for the World.
   *
   * Manages System lifecycles.
   */
  systemManager: SystemManager;

  /**
   * The ComponentRegistry for the World.
   *
   * Maintains a mapping of Component classes to Component indices.
   */
  componentRegistry: ComponentRegistry;

  /**
   * The current time for the world
   */
  private time = 0;

  /**
   * Constructor for a World
   */
  constructor() {
    this.componentRegistry = new ComponentRegistry(this);
    this.spaceManager = new SpaceManager(this);
    this.queryManager = new QueryManager(this);
    this.systemManager = new SystemManager(this);
  }

  /**
   * Retrieves world factories
   */
  get create(): {
    /**
     * Creates a space in the world
     * @param params the params for the space
     * @returns the new space
     */
    space: (params?: SpaceParams) => Space;
    /**
     * Creates a query from a given query description
     * @param queryDescription the query description
     * @returns the query
     */
    query: (queryDescription: QueryDescription) => Query;
  } {
    return {
      space: (params) => {
        const space = new Space(this, params);
        this.spaceManager.spaces.set(space.id, space);

        if (this.initialised) {
          this.spaceManager.initialiseSpace(space);
        }

        return space;
      },
      query: (queryDescription) => {
        return this.queryManager.createQuery(queryDescription);
      },
    };
  }

  /**
   * Destroys the World
   */
  destroy(): void {
    this.systemManager.destroy();
    for (const space of this.spaceManager.spaces.values()) {
      this.spaceManager.destroySpace(space);
    }
  }

  /**
   * Initialises the World
   */
  init(): void {
    this.initialised = true;
    this.systemManager.init();
    this.spaceManager.init();
  }

  /**
   * Retrieves entities that match a given query description.
   * @param queryDescription the query description
   * @returns an array of matching entities
   */
  query(queryDescription: QueryDescription): Entity[] {
    return this.queryManager.query(queryDescription);
  }

  /**
   * Removes from the World
   * @param value the value to remove
   */
  remove(value: Space | Query): void {
    if (value instanceof Space) {
      this.spaceManager.destroySpace(value);
    } else if (value instanceof Query) {
      this.queryManager.removeQuery(value);
    }
  }

  /**
   * Updates the World
   * @param delta the time elapsed in seconds, uses 0 if not specified
   */
  update(delta = 0): void {
    // update the current time
    this.time += delta;

    // clean up dead entities
    this.spaceManager.cleanUpDeadEntitiesAndComponents();

    // recycle destroyed entities and components after queries have been updated
    this.spaceManager.recycle();

    // update components - runs update methods for all components that have them
    this.spaceManager.updateComponents(delta, this.time);

    // update systems
    this.systemManager.update(delta, this.time);
  }

  /**
   * Broadcasts an event to the World
   * @param event the event to broadcast in the World
   */
  emit<E extends Event | Event>(event: E): void {
    this.events.emit(event);
  }

  /**
   * Adds a handler for World events
   * @param eventName the event name
   * @param handler the handler function
   * @returns the id of the new handler
   */
  on<E extends Event | Event>(
    eventName: string,
    handler: EventHandler<E>
  ): EventSubscription {
    return this.events.on(eventName, handler);
  }

  /**
   * Registers a Component class. Must be called before using a Component.
   * @param component the Component class.
   * @returns the World, for chaining
   * @todo pool configuration - initial pool size, target size
   */
  registerComponent(component: ComponentClass): World {
    this.componentRegistry.registerComponent(component);
    return this;
  }

  /**
   * Adds a system to the World
   * @param system the system to add to the World
   * @returns the World, for chaining
   */
  registerSystem<T extends System>(
    system: SystemClass<T>,
    attributes?: SystemAttributes
  ): World {
    this.systemManager.registerSystem(system, attributes);
    return this;
  }

  /**
   * Adds a system to the World
   * @param system the system to add to the World
   * @returns the World, for chaining
   */
  unregisterSystem<T extends System>(system: SystemClass<T>): World {
    this.systemManager.unregisterSystem(system);
    return this;
  }

  /**
   * Retrives a system by class
   * @param clazz the system class
   * @returns the system, or undefined if it is not registerd
   */
  getSystem(clazz: SystemClass): System | undefined {
    return this.systemManager.systems.get(clazz);
  }

  /**
   * Retrieves a list of all systems in the world
   * @returns all systems in the world
   */
  getSystems(): System[] {
    return Array.from(this.systemManager.systems.values());
  }
}
