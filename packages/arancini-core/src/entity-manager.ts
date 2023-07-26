import { Component, ComponentClass } from './component'
import type { Entity } from './entity'
import { ComponentPool, EntityPool } from './pools'
import { uniqueId } from './utils'
import { World } from './world'

export class EntityManager {
  /**
   * Object pool for components
   */
  componentPool: ComponentPool

  /**
   * Object pool for entities
   */
  entityPool: EntityPool

  /**
   * The World the entity manager is part of
   */
  private world: World

  constructor(world: World) {
    this.world = world
    this.componentPool = new ComponentPool()
    this.entityPool = new EntityPool(this.world)
  }

  /**
   * Initialise all entities
   */
  init(): void {
    for (const entity of this.world.entities.values()) {
      this.initialiseEntity(entity)
    }
  }

  /**
   * Destroy all entities
   */
  destroy(): void {
    for (const entity of this.world.entities.values()) {
      this.destroyEntity(entity)
    }
  }

  /**
   * Creates a new entity
   * @returns the new entity
   */
  createEntity(): Entity {
    const entity = this.entityPool.request()

    this.world.entities.set(entity.id, entity)

    if (this.world.initialised) {
      this.initialiseEntity(entity)
    }

    return entity
  }

  /**
   * Destroys an entity and releases it to the entity object pool
   * @param entity the entity to release
   */
  destroyEntity(entity: Entity): void {
    this.world.entities.delete(entity.id)

    for (const component of Object.values(entity._components)) {
      this.removeComponentFromEntity(entity, component, false)
    }

    this.world.queryManager.onEntityRemoved(entity)

    this.entityPool.recycle(entity)
  }

  /**
   * Adds a component to an entity
   * @param entity the entity to add to
   * @param clazz the component to add
   */
  addComponentToEntity<T extends Component>(
    entity: Entity,
    clazz: ComponentClass<T>,
    args?: Parameters<T['construct']>
  ): T {
    if (entity._components[clazz.componentIndex]) {
      throw new Error(
        `Cannot add component ${clazz.name}, entity with id ${entity.id} already has this component`
      )
    }

    const component = this.componentPool.request(clazz)
    component._entity = entity
    component.construct(...(args ?? []))

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
   * @param value the component or component class to remove
   */
  removeComponentFromEntity(
    entity: Entity,
    value: Component | ComponentClass,
    updateBitSet: boolean
  ): void {
    let component: Component | undefined
    if (value instanceof Component) {
      if (!entity._components[value._class.componentIndex]) {
        throw new Error('Component instance does not exist in Entity')
      }
      component = value
    } else {
      component = entity.find(value)
      if (component === undefined) {
        throw new Error('Component does not exist in Entity')
      }
    }

    component.onDestroy()

    delete entity._components[component._class.componentIndex]

    if (updateBitSet) {
      entity._componentsBitSet.remove(component._class.componentIndex)
    }

    // reset and recycle the component object
    component._id = uniqueId()
    ;(component._entity as unknown) = undefined
    this.componentPool.recycle(component)
  }

  /**
   * Initialises an entity
   * @param entity the entity to initialise
   */
  private initialiseEntity(entity: Entity): void {
    entity.initialised = true

    entity._componentsBitSet.resize(
      this.world.componentRegistry.currentComponentIndex
    )

    for (const component of Object.values(entity._components)) {
      this.initialiseComponent(component)
    }
  }

  /**
   * Initialises a component
   * @param component the component to initialise
   */
  private initialiseComponent(component: Component): void {
    component.onInit()
  }
}
