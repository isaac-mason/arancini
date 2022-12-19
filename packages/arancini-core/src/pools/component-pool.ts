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
  get free(): number {
    let total = 0
    for (const pool of this.objectPools.values()) {
      total += pool.free
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
   * Requests a component from the component pool
   */
  request<T extends Component>(Clazz: ComponentClass<T>): T {
    let pool = this.objectPools.get(Clazz)

    if (pool === undefined) {
      pool = new ObjectPool<T>(() => {
        const component = new Clazz()

        component._class = Clazz

        return component
      })

      this.objectPools.set(Clazz, pool)
    }

    return pool.request() as T
  }

  /**
   * Releases a component from the component pool
   * @param component the component to release
   */
  release(component: Component): void {
    const pool = this.objectPools.get(component._class)

    if (pool !== undefined) {
      pool.release(component)
    }
  }
}
