import { Component, ComponentClass } from '../component';
import { ObjectPool } from './object-pool';

/**
 * ComponentPool that manages reuse of component objects
 *
 * @private internal class, do not use directly
 */
export class ComponentPool {
  /**
   * The a map of component names to object pools
   */
  private objectPools: Map<ComponentClass, ObjectPool<Component>> = new Map();

  /**
   * The total number of component pools
   */
  get totalPools(): number {
    return this.objectPools.size;
  }

  /**
   * The total size of the component pool
   */
  get totalSize(): number {
    let total = 0;
    this.objectPools.forEach((p) => {
      total += p.totalSize;
    });
    return total;
  }

  /**
   * The number of available objects in the component pool
   */
  get totalFree(): number {
    let total = 0;
    this.objectPools.forEach((p) => {
      total += p.totalFree;
    });
    return total;
  }

  /**
   * The number of used objects in the component pool
   */
  get totalUsed(): number {
    let total = 0;
    this.objectPools.forEach((p) => {
      total += p.totalUsed;
    });
    return total;
  }

  /**
   * Releases a component from the component pool
   * @param component the component to release
   */
  release(component: Component): void {
    const pool = this.objectPools.get(component.class);

    if (pool !== undefined) {
      pool.release(component);
    }
  }

  /**
   * Requests a component from the component pool
   */
  request<T extends Component>(clazz: ComponentClass<T>): T {
    let pool = this.objectPools.get(clazz);

    if (pool === undefined) {
      pool = new ObjectPool<T>(() => {
        // eslint-disable-next-line new-cap
        const component = new clazz();

        // store a reference to the class in the component instance
        component.class = clazz;

        return component;
      });
      this.objectPools.set(clazz, pool);
    }

    return pool.request() as T;
  }
}
