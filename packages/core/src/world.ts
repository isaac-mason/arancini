import { uuid } from './utils';
import { Entity } from './entity';
import { SpaceManager } from './managers/space-manager';
import { QueryManager } from './managers/query-manager';
import { SystemManager } from './managers/system-manager';
import { Query, QueryDescription } from './query';
import { Space, SpaceParams } from './space';
import { System } from './system';
import { Event, EventHandler, EventSubscription, EventSystem } from './events';

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
 * // (timeElapsed in Components and Systems will be 0)
 * world.update();
 *
 * // update the world with a specified time elapsed
 * // (timeElapsed in Components and Systems will be set to this value)
 * world.update(0.1);
 * ```
 */
export class World {
  /**
   * A unique id for the World
   */
  id = uuid();

  /**
   * Whether the World has been initialised
   */
  initialised = false;

  /**
   * The world event system
   */
  events = new EventSystem({ queued: true });

  /**
   * The SpaceManager for the World that manages spaces, entities and components
   */
  spaceManager: SpaceManager;

  /**
   * The query manager for the World
   */
  queryManager: QueryManager;

  /**
   * The system manager for the World
   */
  systemManager: SystemManager;

  /**
   * The current time for the world
   */
  private time = 0;

  /**
   * Constructor for a World
   */
  constructor() {
    this.spaceManager = new SpaceManager(this);
    this.queryManager = new QueryManager(this);
    this.systemManager = new SystemManager(this);
  }

  /**
   * Retrieves RECS factories
   */
  get create(): {
    /**
     * Creates a space in the RECS
     * @param params the params for the space
     * @returns the new space
     */
    space: (params?: SpaceParams) => Space;
  } {
    return {
      space: (params?: SpaceParams): Space => {
        const space = new Space(this, params);
        this.spaceManager.spaces.set(space.id, space);

        if (this.initialised) {
          this.spaceManager.initialiseSpace(space);
        }

        return space;
      },
    };
  }

  /**
   * Adds a system to the RECS
   * @param system the system to add to the RECS
   */
  addSystem(system: System): System {
    this.systemManager.addSystem(system);
    return system;
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
    // Set the RECS to be initialised
    this.initialised = true;

    // Initialise systems
    this.systemManager.init();

    // Initialise spaces
    this.spaceManager.init();
  }

  /**
   * Retrieves a query from a query description
   *
   * @param queryDescription the query description
   * @returns the query
   */
  query(queryDescription: QueryDescription): Query {
    const query = this.queryManager.getQuery(queryDescription);

    // set the query to be standalone so it cannot be removed by system related cleanup
    query.standalone = true;

    return query;
  }

  /**
   * Retrieves once-off query results without creating a persistent Query
   * @param queryDescription the query description
   * @param options options for the query
   * @returns a set of matching
   */
  queryOnce(
    queryDescription: QueryDescription,
    options?: {
      /**
       * Whether existing query results should be used
       */
      useExisting: boolean;
    }
  ): Entity[] {
    return this.queryManager.query(queryDescription, options);
  }

  /**
   * Removes from the World
   * @param value the value to remove
   */
  remove(value: System | Space | Query): void {
    if (value instanceof System) {
      this.systemManager.removeSystem(value);
    } else if (value instanceof Space) {
      this.spaceManager.destroySpace(value);
    } else if (value instanceof Query) {
      this.queryManager.removeQuery(value);
    }
  }

  /**
   * Updates the World
   * @param timeElapsed the time elapsed in seconds, uses 0 if not specified
   */
  update(timeElapsed?: number): void {
    const elapsed = timeElapsed || 0;

    // update the current time
    this.time += elapsed;

    // clean up dead entities
    this.spaceManager.cleanUpDeadEntitiesAndComponents();

    // update queries
    this.queryManager.update();

    // recycle destroyed entities and components after queries have been updated
    this.spaceManager.recycle();

    // update components - runs update methods for all components that have them
    this.spaceManager.updateComponents(elapsed, this.time);

    // update entities - steps entity event system
    this.spaceManager.updateEntities();

    // update spaces - steps space event system
    this.spaceManager.updateSpaces();

    // update world - steps world event system
    this.events.tick();

    // update systems
    this.systemManager.update(elapsed, this.time);
  }

  /**
   * Broadcasts an event to the World
   * @param event the event to broadcast in the World
   */
  emit<E extends Event | Event>(event: E): void {
    return this.events.emit(event);
  }

  /**
   * Adds a handler for World events
   * @param eventName the event name
   * @param handlerName the name of the handler
   * @param handler the handler function
   * @returns the id of the new handler
   */
  on<E extends Event | Event>(
    eventName: string,
    handler: EventHandler<E>
  ): EventSubscription {
    return this.events.on(eventName, handler);
  }
}
