import { Entity } from '../entity'
import { World } from '../world'
import { ObjectPool } from './object-pool'

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
