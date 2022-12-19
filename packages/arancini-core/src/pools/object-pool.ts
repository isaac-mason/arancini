/**
 * ObjectPool manages a pool of objects of a given type
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
 *
 * @private internal class, do not use directly
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
  get free(): number {
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
      this.expand(size)
    }
  }

  /**
   * Expands the object pool by a given amount
   * @param count the count of objects to expand the object pool by
   */
  expand(count: number): void {
    for (let i = 0; i < count; i++) {
      this.availableObjects.push(this.factory())
    }
    this.size += count
  }

  /**
   * Requests an object from the object pool and returns it
   * @returns an object from the object pool
   */
  request(): T {
    // grow the list by ~20% if there are no more available objects
    if (this.availableObjects.length <= 0) {
      this.expand(Math.round(this.size * 0.2) + 1)
    }

    return this.availableObjects.pop() as T
  }

  /**
   * Releases an object into the object pool
   * @param object the object to release into the object pool
   */
  release(object: T): void {
    // push the object back into the pool as-is
    this.availableObjects.push(object)
  }
}
