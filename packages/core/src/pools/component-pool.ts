import { Component, ComponentClass } from '../component';
import { World } from '../world';
import { ObjectPool } from './object-pool';

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
   * The a map of component names to object pools
   */
  private objectPools: Map<ComponentClass, ObjectPool<Component>> = new Map();

  /**
   * The World the ComponentPool is in
   */
  private world: World;

  /**
   * Constructor for a ComponentPool
   * @param world the World the ComponentPool being created in
   */
  constructor(world: World) {
    this.world = world;
  }

  /**
   * Releases a component from the component pool
   * @param component the component to release
   */
  release(component: Component): void {
    const pool = this.objectPools.get(component.__recs.class);

    if (pool !== undefined) {
      pool.release(component);
    }
  }

  /**
   * Requests a component from the component pool
   */
  request<T extends Component>(Clazz: ComponentClass<T>): T {
    let pool = this.objectPools.get(Clazz);

    if (pool === undefined) {
      pool = new ObjectPool<T>(() => {
        const component = new Clazz();

        component.__recs = {
          class: Clazz,
          classIndex: this.world.componentRegistry.getComponentIndex(Clazz),
        };

        return component;
      });

      this.objectPools.set(Clazz, pool);
    }

    return pool.request() as T;
  }
}
