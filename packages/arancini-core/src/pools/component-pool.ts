import type { Component, ComponentClass } from '../component'
import { ObjectPool } from './object-pool'

/**
 * ComponentPool that manages reuse of component objects
 *
 * @private internal class, do not use directly
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
  private objectPools: Map<ComponentClass, ObjectPool<Component>> = new Map()

  /**
   * Requests a component from the pool
   */
  request<T extends Component>(componentClass: ComponentClass<T>): T {
    const pool = this.getPool(componentClass)

    return pool.request() as T
  }

  /**
   * Recycles a component into the pool
   * @param component the component to release
   */
  recycle(component: Component): void {
    const pool = this.objectPools.get(component._class)

    if (pool !== undefined) {
      pool.recycle(component)
    }
  }

  /**
   * Grows the component pool by the specified amount
   * @param componentClass the component class to grow the pool for
   * @param count the count of components to expand the pool by
   */
  grow(componentClass: ComponentClass, count: number): void {
    this.getPool(componentClass).grow(count)
  }

  /**
   * Frees a given number of currently available components
   * @param componentClass the component class to free the components for
   * @param count the number of available objects to free
   */
  free(componentClass: ComponentClass, count: number): void {
    this.getPool(componentClass).free(count)
  }

  private getPool(Clazz: ComponentClass): ObjectPool<Component> {
    let pool = this.objectPools.get(Clazz)

    if (pool === undefined) {
      pool = new ObjectPool<Component>(() => {
        const component = new Clazz()

        component._class = Clazz

        return component
      })

      this.objectPools.set(Clazz, pool)
    }

    return pool
  }
}
