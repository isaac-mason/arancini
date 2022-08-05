import type { Component, ComponentClass } from './component';
import type { Entity } from './entity';
import { ComponentPool, EntityPool } from './pools';
import type { SpaceParams } from './space';
import { Space } from './space';
import { isSubclassMethodOverridden, uniqueId } from './utils';
import { World } from './world';

export type EntityBuilder = {
  addComponent: <T extends Component>(
    clazz: ComponentClass<T>,
    ...args: Parameters<T['construct']>
  ) => EntityBuilder;
  build: () => Entity;
};

/**
 * SpaceManager that manages Spaces that contain Entities, Entities themselves, and Components
 */
export class SpaceManager {
  /**
   * Spaces in the SpaceManager
   */
  spaces: Map<string, Space> = new Map();

  /**
   * An object pool of components
   */
  componentPool: ComponentPool;

  /**
   * An object pool of entities
   */
  entityPool: EntityPool;

  /**
   * Components that need recycling
   */
  private componentsToCleanup: Component[] = [];

  /**
   * Entities that need queries recycling
   */
  private entitiesToCleanup: Entity[] = [];

  /**
   * A map of ids to update functions for all components
   */
  private componentsToUpdate: Map<string, Component> = new Map();

  /**
   * The World the entity manager is part of
   */
  private world: World;

  /**
   * Constructs a new SpaceManager
   * @param world the World the SpaceManager is part of
   */
  constructor(world: World) {
    this.world = world;
    this.componentPool = new ComponentPool(world);
    this.entityPool = new EntityPool();
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

    // construct the component instance
    component.construct(...args);

    // add the component to the entity
    entity.components.set(clazz, component);
    entity.componentsBitSet.add(component.__recs.classIndex);

    // initialise the component if the entity is already initialised
    if (entity.initialised) {
      this.initialiseComponent(component);
    }

    return component as T;
  }

  /**
   * Creates a new Space in the SpaceManager
   * @param params params for the space
   * @returns the new Space
   */
  createSpace(params?: SpaceParams): Space {
    if (params?.id && this.spaces.has(params.id)) {
      throw new Error('A space with the provided id already exists');
    }

    const space = new Space(this.world, params);
    this.spaces.set(space.id, space);

    if (this.world.initialised) {
      this.initialiseSpace(space);
    }

    return space;
  }

  /**
   * Creates a new Entity in a Space
   *
   * Requests an entity from the entity object pool and initialises it in the space
   *
   * @param space the space to create a new entity in
   * @returns the provisioned entity
   */
  createEntity(
    space: Space,
    components: { clazz: ComponentClass; args: unknown[] }[] = []
  ): Entity {
    const entity = this.entityPool.request();
    entity.space = space;
    space.entities.set(entity.id, entity);

    for (const component of components) {
      this.world.spaceManager.addComponentToEntity(
        entity,
        component.clazz,
        component.args
      );
    }

    this.world.queryManager.onEntityComponentChange(entity);

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
    if (isSubclassMethodOverridden(component.__recs.class, 'onInit')) {
      component.onInit();
    }

    // add the components `onUpdate` method to the component update pool if overriden
    if (isSubclassMethodOverridden(component.__recs.class, 'onUpdate')) {
      this.componentsToUpdate.set(component.id, component);
    }
  }

  /**
   * Initialises an entity
   *
   * @param entity the entity to initialise
   */
  initialiseEntity(entity: Entity): void {
    // initialise the entity
    entity.initialised = true;

    // resize the components bitset
    entity.componentsBitSet.resize(
      this.world.componentRegistry.currentComponentIndex
    );

    // initialise components
    for (const component of entity.components.values()) {
      this.initialiseComponent(component);
    }
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
    const entities = this.entitiesToCleanup;
    this.entitiesToCleanup = [];

    for (const entity of entities) {
      // reset the entity
      entity.id = uniqueId();
      entity.events.reset();
      entity.componentsBitSet.reset();
      entity.alive = true;

      // release the entity back into the entity pool
      this.entityPool.release(entity);
    }

    // recycle destroyed components
    const components = this.componentsToCleanup;
    this.componentsToCleanup = [];

    for (const component of components) {
      component.id = uniqueId();
      (component.entity as unknown) = undefined;
      this.componentPool.release(component);
    }
  }

  /**
   * Removes a component from an entity
   *
   * @param entity the entity to remove from
   * @param component the component to remove
   */
  removeComponentFromEntity(entity: Entity, component: Component): void {
    // remove the onUpdate method from the component update pool if present
    this.componentsToUpdate.delete(component.id);

    // run the onDestroy method
    if (isSubclassMethodOverridden(component.__recs.class, 'onDestroy')) {
      component.onDestroy();
    }

    // remove the component from the entity
    entity.components.delete(component.__recs.class);
    entity.componentsBitSet.remove(component.__recs.classIndex);

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

    // emit the entity destroy event to the space
    this.world.queryManager.onEntityRemoved(entity);

    // destroy components
    for (const component of entity.components.values()) {
      this.removeComponentFromEntity(entity, component);
    }

    // mark the entity as dead
    entity.alive = false;

    // stage the entity for cleanup and reset on the next update
    this.entitiesToCleanup.push(entity);
  }

  /**
   * Run update `onUpdate` methods for all components that have them defined
   *
   * @param delta the time elapsed in seconds
   * @param time the current time in seconds
   */
  updateComponents(delta: number, time: number): void {
    for (const component of this.componentsToUpdate.values()) {
      component.onUpdate(delta, time);
    }
  }

  createEntityBuilder(space: Space): EntityBuilder {
    const components: { clazz: ComponentClass; args: unknown[] }[] = [];

    const builder = {
      addComponent: <T extends Component>(
        clazz: ComponentClass<T>,
        ...args: Parameters<T['construct']>
      ) => {
        components.push({ clazz, args });
        return builder;
      },
      build: (): Entity => {
        return this.createEntity(space, components);
      },
    };

    return builder;
  }
}
