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
    this.componentPool = new ComponentPool()
    this.entityPool = new EntityPool(this.world)
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
      this.destroySpace(space)
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
   * Destroys a space
   * @param space the space to destroy
   */
  destroySpace(space: Space): void {
    this.spaces.delete(space.id)
    for (const entity of space.entities.values()) {
      this.destroyEntity(entity, space)
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
    entity.id = uniqueId()
    entity.space = space
    entity.initialised = false

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

    entity._componentsBitSet.resize(
      this.world.componentRegistry.currentComponentIndex
    )

    for (const component of Object.values(entity._components)) {
      this.initialiseComponent(component)
    }
  }

  /**
   * Destroys an entity and releases it to the entity object pool
   * @param entity the entity to release
   */
  destroyEntity(entity: Entity, space: Space): void {
    entity.space = null as never

    space.entities.delete(entity.id)

    for (const component of Object.values(entity._components)) {
      this.removeComponentFromEntity(entity, component)
    }

    this.world.queryManager.onEntityRemoved(entity)

    // reset entity events and component bitset
    entity.events.reset()
    entity._componentsBitSet.reset()

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

    entity._components[clazz.componentIndex] = component
    entity._componentsBitSet.add(component._class.componentIndex)

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

    delete entity._components[component._class.componentIndex]
    entity._componentsBitSet.remove(component._class.componentIndex)

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
