import type {
  ComponentDefinition,
  ComponentDefinitionArgs,
  ComponentDefinitionInstance,
} from './component'
import { uniqueId } from './utils'
import { BitSet } from './utils/bit-set'
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
 * class ExampleComponent extends Component {}
 *
 * // create a world and register the component
 * const world = new World()
 * world.registerComponent(ExampleComponent)
 *
 * // create an entitty
 * const entity = world.create()
 *
 * // try retrieving a component that isn't in the entity
 * entity.find(ExampleComponent) // returns `undefined`
 * entity.get(ExampleComponent) // throws Error
 *
 * // add ExampleComponent to the entity
 * const exampleComponent = entity.add(ExampleComponent)
 *
 * entity.has(ExampleComponent) // returns `true`
 * entity.get(ExampleComponent) // returns `exampleComponent`
 * entity.get(ExampleComponent) // returns `exampleComponent`
 *
 * // remove the component
 * entity.remove(ExampleComponent);
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
   * Whether to update queries when components are added or removed
   * Used by the `bulk` method to control when queries are updated
   * @private
   */
  _updateQueries = true

  /**
   * Adds a component to the entity
   * @param componentDefinition the component to add
   */
  add<C extends ComponentDefinition<unknown>>(
    componentDefinition: C,
    ...args: ComponentDefinitionArgs<C>
  ): ComponentDefinitionInstance<C> {
    // add the component to this entity
    const component = this.world.entityManager.addComponentToEntity(
      this,
      componentDefinition,
      args
    )

    if (this._updateQueries) {
      this.world.queryManager.onEntityComponentChange(this)
    }

    return component
  }

  /**
   * Removes a component from the entity and destroys it
   * The value can either be a Component constructor, or the component instance itself
   * @param value the component to remove and destroy
   */
  remove(component: ComponentDefinition<unknown>): Entity {
    this.world.entityManager.removeComponentFromEntity(this, component, true)

    if (this._updateQueries) {
      this.world.queryManager.onEntityComponentChange(this)
    }

    return this
  }

  /**
   * Utility method for adding and removing components in bulk.
   *
   * Wrap multiple `add` and `remove` calls in `entity.bulk(() => { ... })` to prevent queries from updating until all components have been added or removed.
   *
   * @param updateFn callback to update the Entity
   *
   * @example
   * ```ts
   * world.create().bulk((entity) => {
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
   * @param value a constructor for the component type to retrieve
   * @returns the component
   */
  get<T extends ComponentDefinition<unknown>>(
    value: T
  ): ComponentDefinitionInstance<T> {
    const component = this._components[value.componentIndex]

    if (component) {
      return component as ComponentDefinitionInstance<T>
    }

    throw new Error(
      `Component ${value}} with componentIndex ${
        value.componentIndex
      } not in entity ${this.id} - ${Object.keys(this._components)}`
    )
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
  ): ComponentDefinitionInstance<T> | undefined {
    return this._components[value.componentIndex] as
      | ComponentDefinitionInstance<T>
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
   * Destroy the Entity's components and remove the Entity from the world
   */
  destroy(): void {
    if (!this.world) return

    this.world.entityManager.destroyEntity(this)
  }
}
