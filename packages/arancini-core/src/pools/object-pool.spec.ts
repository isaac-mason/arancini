/* eslint-disable max-classes-per-file */
import { describe, expect, it } from 'vitest'
import { ObjectPool } from './object-pool'

describe('ObjectPool', () => {
  it('should construct with and without an initial size argument', () => {
    class ExampleClass {}

    const factory = () => new ExampleClass()

    const poolWithoutSize = new ObjectPool(factory)
    expect(poolWithoutSize.size).toBe(0)
    expect(poolWithoutSize.available).toBe(0)
    expect(poolWithoutSize.used).toBe(0)

    const poolWithSize = new ObjectPool(factory, 1)
    expect(poolWithSize.size).toBe(1)
    expect(poolWithSize.available).toBe(1)
    expect(poolWithSize.used).toBe(0)
  })

  it('should provide an object on request', () => {
    class ExampleClass {}

    const factory = () => new ExampleClass()

    const pool = new ObjectPool(factory, 1)

    const object = pool.request()

    expect(object instanceof ExampleClass).toBeTruthy()
    expect(pool.size).toBe(1)
    expect(pool.available).toBe(0)
    expect(pool.used).toBe(1)
  })

  it('should reuse released objects', () => {
    class ExampleClass {}

    const factory = () => new ExampleClass()

    const pool = new ObjectPool(factory, 1)

    const objectOne = pool.request()

    expect(pool.size).toBe(1)
    expect(pool.available).toBe(0)
    expect(pool.used).toBe(1)

    pool.recycle(objectOne)

    expect(pool.size).toBe(1)
    expect(pool.available).toBe(1)
    expect(pool.used).toBe(0)

    const objectTwo = pool.request()

    expect(pool.size).toBe(1)
    expect(pool.available).toBe(0)
    expect(pool.used).toBe(1)

    pool.recycle(objectTwo)

    expect(pool.size).toBe(1)
    expect(pool.available).toBe(1)
    expect(pool.used).toBe(0)
  })

  it('should grow the pool on request if there are no objects available', () => {
    class ExampleClass {}

    const factory = () => new ExampleClass()

    const pool = new ObjectPool(factory, 10)

    for (let i = 0; i < 10; i++) {
      pool.request()
    }

    expect(pool.size).toBe(10)
    expect(pool.available).toBe(0)
    expect(pool.used).toBe(10)

    pool.request()

    expect(pool.size).toBe(13) // grow by 20% - ((10 * 0.2) + 1) = 13
    expect(pool.available).toBe(2)
    expect(pool.used).toBe(11)
  })
})
