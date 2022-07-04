import { Entity } from '../entity';
import { ObjectPool } from './object-pool';

/**
 * EntityPool that manages reuse of entity objects
 *
 * @private internal class, do not use directly
 */
export class EntityPool {
  /**
   * The object pool for the entity pool
   */
  private objectPool = new ObjectPool<Entity>(() => new Entity());

  /**
   * The total size of the entity pool
   */
  get totalSize(): number {
    return this.objectPool.totalSize;
  }

  /**
   * The number of available objects in the entity pool
   */
  get totalFree(): number {
    return this.objectPool.totalFree;
  }

  /**
   * The number of used objects in the entity pool
   */
  get totalUsed(): number {
    return this.objectPool.totalUsed;
  }

  /**
   * Releases an entity from the entity pool
   * @param e the entity to release
   */
  release(e: Entity): void {
    this.objectPool.release(e);
  }

  /**
   * Requests an entity from the entity pool
   */
  request(): Entity {
    return this.objectPool.request();
  }
}
