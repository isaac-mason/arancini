import {
  ComponentDefinitionType,
  InternalComponentInstanceProperties,
  type ComponentDefinition,
  type ComponentDefinitionArgs,
  type ComponentInstance,
  Component,
} from './component'
import { uniqueId } from './unique-id'
import { BitSet } from './bit-set'
import type { World } from './world'

/**
 * An Entity is a collection of Components with a unique id.
 *
 * Entities can have components dynamically added and removed from them.
 *
 * Aside from containing Components, Entities also have an event system that can be used to share data.
 *
 * ```ts
 * import { Component, World } from '@arancini/core'
 *
 * // example tag component without any data or behavior
 * const TagComponent = Component.tag('TagComponent')
 *
 * // create a world and register the component
 * const world = new World()
 * world.registerComponent(TagComponent)
 *
 * // create an entitty
 * const entity = world.create()
 *
 * // try retrieving a component that isn't in the entity
 * entity.find(TagComponent) // returns `undefined`
 * entity.get(TagComponent) // throws Error
 *
 * // add TagComponent to the entity
 * const tagComponent = entity.add(TagComponent)
 *
 * entity.has(TagComponent) // returns `true`
 * entity.get(TagComponent) // returns `tagComponent`
 * entity.get(TagComponent) // returns `tagComponent`
 *
 * // remove the component
 * entity.remove(TagComponent);
 *
 * // destroy the entity
 * entity.destroy();
 * ```
 */
export class Entity {
  /**
   * The unique ID of the entity
   */
  id = uniqueId()

  /**
   * Whether the entity has been initialised
   */
  initialised = false

  /**
   * The World the entity is in
   */
  world!: World

  /**
   * The BitSet for the entity
   * @private internal
   */
  _componentsBitSet = new BitSet()

  /**
   * The components for the entity
   * @private internal
   */
  _components: { [index: string]: unknown } = {}

  /**
   * @private internal
   */
  _updateQueries = true

  /**
   * @private internal
   */
  _updateBitSet = true

  /**
   * Adds a component to the entity
   * @param componentDefinition the component to add
   */
  add<C extends ComponentDefinition<unknown>>(
    componentDefinition: C,
    ...args: ComponentDefinitionArgs<C>
  ): ComponentInstance<C> {
    if (this._components[componentDefinition.componentIndex]) {
      throw new Error(
        `Cannot add component ${componentDefinition.name}, entity with id ${this.id} already has this component`
      )
    }

    let component: ComponentInstance<C>

    if (componentDefinition.type === ComponentDefinitionType.CLASS) {
      component = (
        componentDefinition.objectPooled
          ? this.world.componentPool.request(componentDefinition)
          : new (componentDefinition as any)()
      ) as ComponentInstance<C>
      ;(component as Component).construct(...args)
    } else if (componentDefinition.type === ComponentDefinitionType.OBJECT) {
      component = args[0] as ComponentInstance<C>
    } else {
      component = {} as ComponentInstance<C>
    }

    const internal = component as InternalComponentInstanceProperties
    internal._arancini_id = uniqueId()
    internal._arancini_component_definition = componentDefinition

    this._components[componentDefinition.componentIndex] = component
    this._componentsBitSet.add(componentDefinition.componentIndex)

    if (componentDefinition.type === ComponentDefinitionType.CLASS) {
      ;(component as Component).entity = this

      if (this.initialised) {
        ;(component as Component).onInit!()
      }
    }

    if (this._updateQueries) {
      this.world.queryManager.onEntityComponentChange(this)
    }

    return component
  }

  /**
   * Removes a component from the entity and destroys it
   * @param value the component to remove and destroy
   */
  remove<T extends ComponentDefinition<unknown>>(
    componentDefinition: T
  ): Entity {
    const component = this.find(componentDefinition)

    if (component === undefined) {
      throw new Error('Component does not exist in Entity')
    }

    const internal = component as InternalComponentInstanceProperties
    const { componentIndex } = internal._arancini_component_definition!

    delete this._components[componentIndex]

    if (this._updateBitSet) {
      this._componentsBitSet.remove(componentIndex)
    }

    if (
      internal._arancini_component_definition!.type ===
      ComponentDefinitionType.CLASS
    ) {
      const classComponent = component as Component

      classComponent.onDestroy()
      classComponent.entity = undefined!

      if (internal._arancini_component_definition!.objectPooled) {
        internal._arancini_id = uniqueId()
        this.world.componentPool.recycle(component)
      }
    } else {
      delete internal._arancini_component_definition
      delete internal._arancini_id
    }

    if (this._updateQueries) {
      this.world.queryManager.onEntityComponentChange(this)
    }

    return this
  }

  /**
   * Utility method for adding and removing components in bulk.
   *
   * Wrap multiple `add` and `remove` calls in `entity.bulk(() => { ... })` to update queries once after adding or removing multiple components.
   *
   * @param updateFn callback to update the Entity
   *
   * @example
   * ```ts
   * entity.bulk((entity) => {
   *   entity.add(TestComponentOne)
   *   entity.add(TestComponentTwo)
   *   entity.remove(TestComponentThree)
   * })
   * ```
   */
  bulk(updateFn: (entity: Entity) => void): this {
    this._updateQueries = false

    updateFn(this)

    this._updateQueries = true

    this.world.queryManager.onEntityComponentChange(this)

    return this
  }

  /**
   * Retrieves a component on an entity by type, throws an error if the component is not in the entity
   * @param componentDefinition the component to to get
   * @returns the component
   */
  get<T extends ComponentDefinition<unknown>>(
    componentDefinition: T
  ): ComponentInstance<T> {
    const component = this._components[componentDefinition.componentIndex]

    if (!component) {
      throw new Error(
        `Component ${componentDefinition}} with componentIndex ${
          componentDefinition.componentIndex
        } not in entity ${this.id} - ${Object.keys(this._components)}`
      )
    }

    return component as ComponentInstance<T>
  }

  /**
   * Returns all components for the entity
   * @returns all components for the entity
   */
  getAll(): unknown[] {
    return Object.values(this._components)
  }

  /**
   * Retrieves a component on an entity by type, returns undefined if the component is not in the entity
   * @param value a constructor for the component type to retrieve
   * @returns the component if it is found, or undefined
   */
  find<T extends ComponentDefinition<unknown>>(
    value: T
  ): ComponentInstance<T> | undefined {
    return this._components[value.componentIndex] as
      | ComponentInstance<T>
      | undefined
  }

  /**
   * Returns whether the entity contains the given component
   * @param value the component constructor, a component instance, or the string name of the component
   * @returns whether the entity contains the given component
   */
  has<T extends ComponentDefinition<unknown>>(value: T): boolean {
    return !!this._components[value.componentIndex]
  }

  /**
   * Destroys the Entity
   */
  destroy(): void {
    this.world?.destroy(this)
  }
}
