import {
  type ClassComponentDefinition,
  type ComponentInstance,
} from './component'
import { Entity } from './entity'
import { uniqueId } from './utils'
import { World } from './world'

/**
 * Pools of objects of a given type
 *
 * @param T the type of object to pool
 *
 * @example
 * ```ts
 * // create a new pool
 * const pool = new ObjectPool(() => new MyObject())
 *
 * // expand the pool
 * pool.expand(10)
 *
 * // request an object from the pool
 * const object = pool.request()
 *
 * // release the object back into the pool
 * pool.release(object)
 * ```
 */
export class ObjectPool<T> {
  /**
   * An array of available objects
   */
  availableObjects: T[] = []

  /**
   * Factory method for creating a new object to add to the pool
   */
  factory: () => T

  /**
   * Returns the number of available objects in the object pool
   */
  get available(): number {
    return this.availableObjects.length
  }

  /**
   * Returns the number of used objects in the object pool
   */
  get used(): number {
    return this.size - this.availableObjects.length
  }

  /**
   * The number of objects in the pool
   */
  size = 0

  /**
   * Constructor for a new object pool
   * @param factory factory method for creating a new object
   */
  constructor(factory: () => T, size?: number) {
    this.factory = factory
    if (size !== undefined) {
      this.grow(size)
    }
  }

  /**
   * Grows the object pool by a given amount
   * @param count the count of objects to expand the object pool by
   */
  grow(count: number): void {
    for (let i = 0; i < count; i++) {
      this.availableObjects.push(this.factory())
    }
    this.size += count
  }

  /**
   * Frees a given number of currently available objects
   * @param count the number of available objects to free
   */
  free(count: number): void {
    for (let i = 0; i < count; i++) {
      const object = this.availableObjects.pop()

      if (object) {
        this.size--
      } else {
        break
      }
    }
  }

  /**
   * Requests an object from the object pool and returns it
   * @returns an object from the object pool
   */
  request(): T {
    // grow the list by ~20% if there are no more available objects
    if (this.availableObjects.length <= 0) {
      this.grow(Math.round(this.size * 0.2) + 1)
    }

    return this.availableObjects.pop() as T
  }

  /**
   * Recycles an object into the object pool
   * @param object the object to recycle
   */
  recycle(object: T): void {
    this.availableObjects.push(object)
  }
}

/**
 * EntityPool that manages reuse of entity objects
 *
 * @private internal class, do not use directly
 */
export class EntityPool {
  /**
   * The object pool for the entity pool
   */
  private objectPool = new ObjectPool<Entity>(() => {
    const entity = new Entity()
    entity.world = this.world
    return entity
  })

  /**
   * The size of the entity pool
   */
  get size(): number {
    return this.objectPool.size
  }

  /**
   * The number of available objects in the entity pool
   */
  get available(): number {
    return this.objectPool.available
  }

  /**
   * The number of used objects in the entity pool
   */
  get used(): number {
    return this.objectPool.used
  }

  /**
   * The world the entity pool is part of
   */
  private world: World

  constructor(world: World) {
    this.world = world
  }

  /**
   * Requests an entity from the pool
   */
  request(): Entity {
    return this.objectPool.request()
  }

  /**
   * Recycles an entity into the pool
   * @param e the entity to recycle
   */
  recycle(e: Entity): void {
    e.id = uniqueId()
    e.initialised = false
    e._componentsBitSet.reset()

    this.objectPool.recycle(e)
  }

  /**
   * Grows the entity pool by the specified amount
   * @param count the count of entities to expand the pool by
   */
  grow(count: number): void {
    this.objectPool.grow(count)
  }

  /**
   * Frees a given number of currently available entities
   * @param count the number of available entities to free
   */
  free(count: number): void {
    this.objectPool.free(count)
  }
}

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
  private objectPools: Map<number, ObjectPool<unknown>> = new Map()

  /**
   * Requests a component from the pool
   */
  request<T extends ClassComponentDefinition<unknown>>(
    componentDefinition: T
  ): ComponentInstance<T> {
    const pool = this.getPool(componentDefinition)

    return pool.request() as ComponentInstance<T>
  }

  /**
   * Recycles a component into the pool
   * @param component the component to release
   */
  recycle(component: ComponentInstance<any>): void {
    this.objectPools
      .get(component._arancini_component_definition.componentIndex)
      ?.recycle(component)
  }

  /**
   * Grows the component pool by the specified amount
   * @param componentDefinition the component class to grow the pool for
   * @param count the count of components to expand the pool by
   */
  grow(
    componentDefinition: ClassComponentDefinition<unknown>,
    count: number
  ): void {
    this.getPool(componentDefinition).grow(count)
  }

  /**
   * Frees a given number of currently available components
   * @param componentDefinition the component to free the components for
   * @param count the number of available components to free
   */
  free(
    componentDefinition: ClassComponentDefinition<unknown>,
    count: number
  ): void {
    this.getPool(componentDefinition).free(count)
  }

  private getPool(
    componentDefinition: ClassComponentDefinition<unknown>
  ): ObjectPool<unknown> {
    let pool = this.objectPools.get(componentDefinition.componentIndex)

    if (pool === undefined) {
      pool = new ObjectPool(() => {
        return new (componentDefinition as any)()
      })

      this.objectPools.set(componentDefinition.componentIndex, pool)
    }

    return pool
  }
}
