import type { ComponentClass } from './component'
import type { World } from './world'

/**
 * ComponentRegistry that manages Component registration
 *
 * @private used internally, do not use directly
 */
export class ComponentRegistry {
  /**
   * Component classes to component ids
   */
  components: Map<ComponentClass, number> = new Map()

  /**
   * The current component index. Increments when a new component is registered.
   */
  currentComponentIndex = -1

  /**
   * The World the ComponentRegistry is in
   */
  private world: World

  constructor(world: World) {
    this.world = world
  }

  /**
   * Registers a component
   * @param component the component class to register
   * @returns the component index
   */
  registerComponent(component: ComponentClass): number {
    let componentIndex = this.components.get(component)
    if (componentIndex !== undefined) {
      return componentIndex
    }

    this.currentComponentIndex++
    componentIndex = this.currentComponentIndex

    component.componentIndex = componentIndex
    this.components.set(component, componentIndex)

    // if the world has already been initialised, resize all entity components bitsets
    if (this.world.initialised) {
      for (const space of this.world.spaceManager.spaces.values()) {
        for (const entity of space.entities.values()) {
          entity._componentsBitSet.resize(this.currentComponentIndex)
        }
      }
    }

    return componentIndex
  }
}
