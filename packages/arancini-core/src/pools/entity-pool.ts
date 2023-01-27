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
  get free(): number {
    return this.objectPool.free
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
   * Requests an entity from the entity pool
   */
  request(): Entity {
    return this.objectPool.request()
  }

  /**
   * Releases an entity from the entity pool
   * @param e the entity to release
   */
  release(e: Entity): void {
    this.objectPool.release(e)
  }
}
