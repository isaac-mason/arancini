import { uuid } from '../utils';
import type { Component, ComponentClass } from '../component';
import type { Entity } from '../entity';
import type { World } from '../world';
import type { Space } from '../space';
import { ComponentPool, EntityPool } from '../pools';

/**
 * SpaceManager that manages Spaces that contain Entities, Entities themselves, and Components
 *
 * @private used internally, do not use directly
 */
export class SpaceManager {
  /**
   * Spaces in the SpaceManager
   */
  spaces: Map<string, Space> = new Map();

  /**
   * An object pool of components
   */
  private componentPool = new ComponentPool();

  /**
   * Components that need queries updated on the next update before they can be reused
   */
  private componentsToCleanup: Component[] = [];

  /**
   * A map of ids to update functions for all components
   */
  private componentsToUpdate: Map<string, Component> = new Map();

  /**
   * Entities that need queries updated on the next update before they can be reused
   */
  private entitiesToCleanup: Entity[] = [];

  /**
   * A map of ids to update functions for all entities
   */
  private entitiesToUpdate: Map<string, Entity> = new Map();

  /**
   * An object pool of entities
   */
  private entityPool = new EntityPool();

  /**
   * The World the entity manager is part of
   */
  private world: World;

  /**
   * Constructs a new EntityManager
   * @param world the World the entity manager is part of
   */
  constructor(world: World) {
    this.world = world;
  }

  /**
   * Initialise all spaces
   */
  init(): void {
    for (const space of this.spaces.values()) {
      this.initialiseSpace(space);
    }
  }

  /**
   * Adds a component to an entity
   *
   * @param entity the entity to add to
   * @param clazz the component to add
   */
  addComponentToEntity<T extends Component>(
    entity: Entity,
    clazz: ComponentClass<T>,
    args: Parameters<T['construct']>
  ): T {
    // request a component from the component pool
    const component = this.componentPool.request(clazz);

    // set the components entity
    component.entity = entity;

    // construct the component instance with args if they are present
    if (args.length > 0) {
      component.construct(...args);
    } else {
      component.construct();
    }

    // add the component to the entity components maps
    entity.components.set(clazz, component);

    // initialise the component if the entity is already initialised
    if (entity.initialised) {
      this.initialiseComponent(component);
    }

    return component as T;
  }

  /**
   * Creates a new entity in a space
   *
   * Requests an entity from the entity object pool and initialises it in the space
   *
   * @param space the space to create a new entity in
   * @returns the provisioned entity
   */
  createEntity(space: Space): Entity {
    const entity = this.entityPool.request();
    entity.space = space;
    space.entities.set(entity.id, entity);

    if (space.initialised) {
      this.world.spaceManager.initialiseEntity(entity);
    }

    return entity;
  }

  /**
   * Destroys a space
   * @param space the space to destroy
   */
  destroySpace(space: Space): void {
    this.spaces.delete(space.id);
    for (const entity of space.entities.values()) {
      this.removeEntity(entity, space);
    }
  }

  /**
   * Initialises a component
   *
   * @param component the component to initialise
   */
  initialiseComponent(component: Component): void {
    // run component initialisation logic
    if (this.isComponentMethodOverridden(component, 'onInit')) {
      component.onInit();
    }

    // add the components `onUpdate` method to the component update pool if overriden
    if (this.isComponentMethodOverridden(component, 'onUpdate')) {
      this.componentsToUpdate.set(component.id, component);
    }

    // inform the query manager that the component has been initialised
    this.world.queryManager.onEntityComponentAdded(component.entity, component);
  }

  /**
   * Initialises an entity
   *
   * @param entity the entity to initialise
   */
  initialiseEntity(entity: Entity): void {
    // initialise the entity
    entity.initialised = true;

    // initialise components
    for (const component of entity.components.values()) {
      this.initialiseComponent(component);
    }

    // add entity update to the update pool
    this.entitiesToUpdate.set(entity.id, entity);
  }

  /**
   * Initialises a space
   * @param space the space to initialise
   */
  initialiseSpace(space: Space): void {
    space.initialised = true;
    for (const entity of space.entities.values()) {
      this.initialiseEntity(entity);
    }
  }

  /**
   * Recycles destroyed entities and components
   */
  recycle(): void {
    // recycle destroyed entities
    const entities = this.entitiesToCleanup.splice(
      0,
      this.entitiesToCleanup.length
    );

    for (const entity of entities) {
      // reset the entity
      entity.id = uuid();
      entity.events.reset();
      entity.componentsToRemove = [];
      entity.alive = true;

      // release the entity back into the entity pool
      this.entityPool.release(entity);
    }

    // recycle destroyed components
    const components = this.componentsToCleanup.splice(
      0,
      this.componentsToCleanup.length
    );

    for (const component of components) {
      // reset the component
      component.id = uuid();
      component.entity = undefined;

      // release the component back into the update pool
      this.componentPool.release(component);
    }
  }

  /**
   * Removes a component from an entity
   *
   * @param entity the entity to remove from
   * @param component the component to remove
   * @param notifyQueryManager whether the query manager should be notified
   */
  removeComponentFromEntity(
    entity: Entity,
    component: Component,
    notifyQueryManager: boolean
  ): void {
    // remove the onUpdate method from the component update pool if present
    this.componentsToUpdate.delete(component.id);

    // run the onDestroy method
    if (this.isComponentMethodOverridden(component, 'onDestroy')) {
      component.onDestroy();
    }

    if (notifyQueryManager) {
      // tell the query manager that the component has been removed from the entity
      this.world.queryManager.onEntityComponentRemoved(entity, component);
    }

    // remove the component from the components maps
    entity.components.delete(component.class);

    // stage the component for cleanup on the next update
    this.componentsToCleanup.push(component);
  }

  /**
   * Removes an entity from a space and releases it to the entity object pool
   *
   * @param entity the entity to release
   */
  removeEntity(entity: Entity, space: Space): void {
    // remove the entity from the space entities map
    space.entities.delete(entity.id);

    // remove entity update from the update pool
    this.entitiesToUpdate.delete(entity.id);

    // emit the entity destroy event to the space
    this.world.queryManager.onEntityRemoved(entity);

    // destroy components without notifying the query manager
    for (const component of entity.components.values()) {
      this.removeComponentFromEntity(entity, component, false);
    }

    // mark the entity as dead
    entity.alive = false;

    // stage the entity for cleanup and reset on the next update
    this.entitiesToCleanup.push(entity);
  }

  /**
   * Run update `onUpdate` methods for all components that have them defined
   *
   * @param timeElapsed the time elapsed in seconds
   * @param time the current time in seconds
   */
  updateComponents(timeElapsed: number, time: number): void {
    for (const component of this.componentsToUpdate.values()) {
      component.onUpdate(timeElapsed, time);
    }
  }

  cleanUpDeadEntitiesAndComponents(): void {
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
            this.removeComponentFromEntity(entity, component, true);
          }
        }
      }

      for (const d of dead) {
        space.remove(d);
      }
    }
  }

  private isComponentMethodOverridden(
    instance: Component,
    methodName: string
  ): boolean {
    return Object.getOwnPropertyNames(instance.class.prototype).includes(
      methodName
    );
  }
}
