import { uuid } from './utils';
import { Entity } from './entity';
import { EntityManager } from './managers/entity-manager';
import { QueryManager } from './managers/query-manager';
import { SystemManager } from './managers/system-manager';
import { Query, QueryDescription } from './query';
import { Space, SpaceParams } from './space';
import { System } from './system';

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
   * The EntityManager for the RECS instance that manages entities and their components
   */
  entityManager: EntityManager;

  /**
   * A unique id for the RECS instance
   */
  id = uuid();

  /**
   * Whether the RECS instance has been initialised
   */
  initialised = false;

  /**
   * The query manager for the RECS instance
   */
  queryManager: QueryManager;

  /**
   * Spaces in the RECS instance
   */
  spaces: Map<string, Space> = new Map();

  /**
   * The system manager for the RECS instance
   */
  systemManager: SystemManager;

  /**
   * The current time for the world
   */
  private time = 0;

  /**
   * Constructor for a RECS instance
   */
  constructor() {
    this.entityManager = new EntityManager(this);
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
        this.spaces.set(space.id, space);

        if (this.initialised) {
          this.entityManager.initialiseSpace(space);
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
   * Destroys the RECS instance
   */
  destroy(): void {
    this.systemManager.destroy();
    for (const space of this.spaces.values()) {
      this.entityManager.destroySpace(space);
    }
  }

  /**
   * Initialises the RECS instance
   */
  init(): void {
    // Set the RECS to be initialised
    this.initialised = true;

    // Initialise systems
    this.systemManager.init();

    // Initialise spaces
    for (const space of this.spaces.values()) {
      this.entityManager.initialiseSpace(space);
    }
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
   * Removes from the RECS instance
   * @param value the value to remove
   */
  remove(value: System | Space | Query): void {
    if (value instanceof System) {
      this.systemManager.removeSystem(value);
    } else if (value instanceof Space) {
      this.spaces.delete(value.id);
      this.entityManager.destroySpace(value);
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
    this.cleanUpDeadEntitiesAndComponents();

    // update queries
    this.queryManager.update();

    // recycle destroyed entities and components after queries have been updated
    this.entityManager.recycle();

    // update components - runs update methods for all components that have them
    this.entityManager.updateComponents(elapsed, this.time);

    // update entities - steps entity event system
    this.entityManager.updateEntities();

    // update spaces - steps space event system
    for (const space of this.spaces.values()) {
      space.events.tick();
    }

    // update systems
    this.systemManager.update(elapsed, this.time);
  }

  private cleanUpDeadEntitiesAndComponents(): void {
    // update entities in spaces - checks if entities are alive and releases them if they are dead
    for (const space of this.spaces.values()) {
      const dead: Entity[] = [];

      for (const entity of space.entities.values()) {
        if (!entity.alive) {
          dead.push(entity);
        } else {
          // if the entity is still alive, clean up components
          for (const component of entity.componentsToRemove.splice(
            0,
            entity.componentsToRemove.length
          )) {
            this.entityManager.removeComponentFromEntity(
              entity,
              component,
              true
            );
          }
        }
      }

      for (const d of dead) {
        space.remove(d);
      }
    }
  }
}
