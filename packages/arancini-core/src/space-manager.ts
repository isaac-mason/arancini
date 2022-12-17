import type { Component, ComponentClass, ComponentDetails } from './component'
import type { Entity } from './entity'
import { ComponentPool, EntityPool } from './pools'
import type { SpaceParams } from './space'
import { Space } from './space'
import { uniqueId } from './utils'
import { World } from './world'

/**
 * SpaceManager that manages Spaces that contain Entities, Entities themselves, and Components
 */
export class SpaceManager {
  /**
   * Spaces in the SpaceManager
   */
  spaces: Map<string, Space> = new Map()

  /**
   * An object pool of components
   */
  componentPool: ComponentPool

  /**
   * An object pool of entities
   */
  entityPool: EntityPool

  /**
   * The World the entity manager is part of
   */
  private world: World

  /**
   * Constructs a new SpaceManager
   * @param world the World the SpaceManager is part of
   */
  constructor(world: World) {
    this.world = world
    this.componentPool = new ComponentPool(world)
    this.entityPool = new EntityPool()
  }

  /**
   * Initialise all spaces
   */
  init(): void {
    for (const space of this.spaces.values()) {
      this.initialiseSpace(space)
    }
  }

  /**
   * Destroy all spaces
   */
  destroy(): void {
    for (const space of this.spaces.values()) {
      this.removeSpace(space)
    }
  }

  /**
   * Creates a new space in the SpaceManager
   * @param params params for the space
   * @returns the new space
   */
  createSpace(params?: SpaceParams): Space {
    if (params?.id && this.spaces.has(params.id)) {
      throw new Error('A space with the provided id already exists')
    }

    const space = new Space(this.world, params)
    this.spaces.set(space.id, space)

    if (this.world.initialised) {
      this.initialiseSpace(space)
    }

    return space
  }

  /**
   * Initialises a space
   * @param space the space to initialise
   */
  initialiseSpace(space: Space): void {
    space.initialised = true
    for (const entity of space.entities.values()) {
      this.initialiseEntity(entity)
    }
  }

  /**
   * Remove a space
   * @param space the space to remove
   */
  removeSpace(space: Space): void {
    this.spaces.delete(space.id)
    for (const entity of space.entities.values()) {
      this.removeEntity(entity, space)
    }
  }

  /**
   * Creates a new entity in a space
   * @param space the space to create a new entity in
   * @param components the components to add to the entity
   * @returns the new entity
   */
  createEntity(space: Space, components: ComponentDetails[] = []): Entity {
    const entity = this.entityPool.request()
    entity.space = space
    space.entities.set(entity.id, entity)

    for (const component of components) {
      this.world.spaceManager.addComponentToEntity(
        entity,
        component.type,
        component.args ?? []
      )
    }

    this.world.queryManager.onEntityComponentChange(entity)

    if (space.initialised) {
      this.world.spaceManager.initialiseEntity(entity)
    }

    return entity
  }

  /**
   * Initialises an entity
   * @param entity the entity to initialise
   */
  initialiseEntity(entity: Entity): void {
    entity.initialised = true

    entity.__internal.componentsBitSet.resize(
      this.world.componentRegistry.currentComponentIndex
    )

    for (const component of entity.components.values()) {
      this.initialiseComponent(component)
    }
  }

  /**
   * Removes an entity from a space and releases it to the entity object pool
   * @param entity the entity to release
   */
  removeEntity(entity: Entity, space: Space): void {
    entity.space = null as never
    entity.initialised = false
    space.entities.delete(entity.id)

    for (const component of entity.components.values()) {
      this.removeComponentFromEntity(entity, component)
    }

    this.world.queryManager.onEntityRemoved(entity)

    // reset and recycle the entity object
    entity.id = uniqueId()
    entity.events.reset()
    entity.__internal.componentsBitSet.reset()

    this.entityPool.release(entity)
  }

  /**
   * Adds a component to an entity
   * @param entity the entity to add to
   * @param clazz the component to add
   */
  addComponentToEntity<T extends Component>(
    entity: Entity,
    clazz: ComponentClass<T>,
    args: Parameters<T['construct']>
  ): T {
    const component = this.componentPool.request(clazz)
    component.entity = entity
    component.construct(...args)

    entity.components.set(clazz, component)
    entity.__internal.componentsBitSet.add(component.__internal.classIndex)

    if (entity.initialised) {
      this.initialiseComponent(component)
    }

    return component as T
  }

  /**
   * Removes a component from an entity
   * @param entity the entity to remove from
   * @param component the component to remove
   */
  removeComponentFromEntity(entity: Entity, component: Component): void {
    component.onDestroy()

    entity.components.delete(component.__internal.class)
    entity.__internal.componentsBitSet.remove(component.__internal.classIndex)

    // reset and recycle the component object
    component.id = uniqueId()
    ;(component.entity as unknown) = undefined
    this.componentPool.release(component)
  }

  /**
   * Initialises a component
   * @param component the component to initialise
   */
  initialiseComponent(component: Component): void {
    component.onInit()
  }
}
