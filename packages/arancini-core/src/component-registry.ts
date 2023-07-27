import type { ComponentDefinition } from './component'
import type { World } from './world'

/**
 * ComponentRegistry that manages Component registration
 *
 * @private internal class, do not use directly
 */
export class ComponentRegistry {
  /**
   * Component definition to component id
   */
  components: Map<ComponentDefinition<unknown>, number> = new Map()

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
   * @param componentDefinition the component definition to register
   * @returns the component index
   */
  registerComponent(componentDefinition: ComponentDefinition<unknown>): number {
    let componentIndex = this.components.get(componentDefinition)
    if (componentIndex !== undefined) {
      return componentIndex
    }

    this.currentComponentIndex++
    componentIndex = this.currentComponentIndex

    componentDefinition.componentIndex = componentIndex
    this.components.set(componentDefinition, componentIndex)

    // if the world has already been initialised, resize all entity components bitsets
    if (this.world.initialised) {
      for (const entity of this.world.entities.values()) {
        entity._componentsBitSet.resize(this.currentComponentIndex)
      }
    }

    return componentIndex
  }
}
