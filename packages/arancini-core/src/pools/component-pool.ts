import type {
  Component,
  ComponentClass,
  ComponentDefinition,
  ComponentDefinitionInstance,
} from '../component'
import { ObjectPool } from './object-pool'

/**
 * @private internal
 */
export class ComponentPool {
  /**
   * The total number of component pools
   */
  get totalPools(): number {
    return this.objectPools.size
  }

  /**
   * The total size of all component object pools
   */
  get size(): number {
    let total = 0
    for (const pool of this.objectPools.values()) {
      total += pool.size
    }
    return total
  }

  /**
   * The number of available objects in the component object pools
   */
  get available(): number {
    let total = 0
    for (const pool of this.objectPools.values()) {
      total += pool.available
    }
    return total
  }

  /**
   * The number of used objects in the component object pools
   */
  get used(): number {
    let total = 0
    for (const pool of this.objectPools.values()) {
      total += pool.used
    }
    return total
  }

  /**
   * The a map of component names to object pools
   */
  private objectPools: Map<number, ObjectPool<Component>> = new Map()

  /**
   * Requests a component from the pool
   */
  request<T extends ComponentDefinition<unknown> & ComponentClass>(
    componentDefinition: T
  ): ComponentDefinitionInstance<T> {
    const pool = this.getPool(componentDefinition)

    return pool.request() as ComponentDefinitionInstance<T>
  }

  /**
   * Recycles a component into the pool
   * @param component the component to release
   */
  recycle(component: Component): void {
    const pool = this.objectPools.get(
      component._arancini_component_definition.componentIndex
    )

    if (pool) {
      pool.recycle(component)
    }
  }

  /**
   * Grows the component pool by the specified amount
   * @param componentDefinition the component class to grow the pool for
   * @param count the count of components to expand the pool by
   */
  grow(
    componentDefinition: ComponentDefinition<unknown> & ComponentClass,
    count: number
  ): void {
    this.getPool(componentDefinition).grow(count)
  }

  /**
   * Frees a given number of currently available components
   * @param clazz the component class to free the components for
   * @param count the number of available components to free
   */
  free(
    clazz: ComponentDefinition<unknown> & ComponentClass,
    count: number
  ): void {
    this.getPool(clazz).free(count)
  }

  private getPool(
    componentDefinition: ComponentDefinition<unknown> & ComponentClass
  ): ObjectPool<Component> {
    let pool = this.objectPools.get(componentDefinition.componentIndex)

    if (pool === undefined) {
      pool = new ObjectPool<Component>(() => {
        const Clazz = componentDefinition as ComponentClass
        const component = new Clazz()

        return component
      })

      this.objectPools.set(componentDefinition.componentIndex, pool)
    }

    return pool
  }
}
