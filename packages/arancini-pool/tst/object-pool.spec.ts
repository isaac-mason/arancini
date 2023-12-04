import { describe, it, expect } from 'vitest'
import { ObjectPool } from '../src'

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

  it('should grow and shrink as objects are requested and released', () => {
    class ExampleClass {}

    const factory = () => new ExampleClass()

    const pool = new ObjectPool(factory, 100)

    const objects: ExampleClass[] = []

    // request all 100
    for (let i = 0; i < 100; i++) {
      objects.push(pool.request())
    }

    // size should be unchanged
    expect(pool.size).toBe(100)
    expect(pool.available).toBe(0)

    // request one more
    objects.push(pool.request())

    // should should grow by 20% + 1
    expect(pool.size).toBe(121)
    expect(pool.available).toBe(20)

    // recycle until available is 20% of size
    for (let i = 0; i < 20; i++) {
      pool.recycle(objects.pop()!)
    }

    // total size should have shrunk
    expect(pool.size).toBe(102)
    expect(pool.available).toBe(21)

    // recycle all remaining objects
    for (let i = 0; i < 102; i++) {
      pool.recycle(objects.pop()!)
    }

    // should be empty
    expect(pool.size).toBe(0)
    expect(pool.available).toBe(0)

    // calling free should do nothing
    pool.free(1)

    expect(pool.size).toBe(0)
  })
})
