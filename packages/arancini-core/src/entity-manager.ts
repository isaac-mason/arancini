import {
  Component,
  ComponentClass,
  ComponentDefinition,
  ComponentDefinitionArgs,
  ComponentDefinitionInstance,
  ComponentDefinitionType,
  InternalComponentInstanceProperties,
} from './component'
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
      const internal = component as InternalComponentInstanceProperties
      this.removeComponentFromEntity(
        entity,
        internal._arancini_component_definition!,
        false
      )
    }

    this.world.queryManager.onEntityRemoved(entity)

    this.entityPool.recycle(entity)
  }

  /**
   * Adds a component to an entity
   * @param entity the entity to add to
   * @param componentDefinition the component to add
   */
  addComponentToEntity<T extends ComponentDefinition<unknown>>(
    entity: Entity,
    componentDefinition: T,
    args: ComponentDefinitionArgs<T>
  ): ComponentDefinitionInstance<T> {
    if (entity._components[componentDefinition.componentIndex]) {
      throw new Error(
        `Cannot add component ${componentDefinition.name}, entity with id ${entity.id} already has this component`
      )
    }

    let component: ComponentDefinitionInstance<T>

    if (componentDefinition.type === ComponentDefinitionType.CLASS) {
      const classComponent = this.componentPool.request(
        componentDefinition as ComponentClass
      )
      classComponent.construct(...(args ?? []))
      component = classComponent as ComponentDefinitionInstance<T>
    } else if (componentDefinition.type === ComponentDefinitionType.OBJECT) {
      component = args[0] as ComponentDefinitionInstance<T>
    } else {
      component = {} as ComponentDefinitionInstance<T>
    }

    const internal = component as InternalComponentInstanceProperties
    internal._arancini_entity = entity
    internal._arancini_id = uniqueId()
    internal._arancini_component_definition = componentDefinition

    entity._components[componentDefinition.componentIndex] = component
    entity._componentsBitSet.add(componentDefinition.componentIndex)

    if (entity.initialised && component instanceof Component) {
      component.onInit()
    }

    return component as ComponentDefinitionInstance<T>
  }

  /**
   * Removes a component from an entity
   * @param entity the entity to remove from
   * @param componentDefinition the component to remove
   */
  removeComponentFromEntity<T extends ComponentDefinition<unknown>>(
    entity: Entity,
    componentDefinition: T,
    updateBitSet: boolean
  ): void {
    const component = entity.find(componentDefinition)
    if (component === undefined) {
      throw new Error('Component does not exist in Entity')
    }

    const internal = component as InternalComponentInstanceProperties
    const { componentIndex } = internal._arancini_component_definition!

    const isClass =
      internal._arancini_component_definition!.type ===
      ComponentDefinitionType.CLASS

    delete entity._components[componentIndex]

    if (updateBitSet) {
      entity._componentsBitSet.remove(componentIndex)
    }

    if (isClass) {
      ;(component as Component)?.onDestroy()

      internal._arancini_id = uniqueId()
      internal._arancini_entity = undefined
      this.componentPool.recycle(component as Component)
    } else {
      delete internal._arancini_entity
      delete internal._arancini_component_definition
      delete internal._arancini_id
    }
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
      if (component instanceof Component) {
        component.onInit()
      }
    }
  }
}
