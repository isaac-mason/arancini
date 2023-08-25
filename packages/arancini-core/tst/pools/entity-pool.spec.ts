import { beforeEach, describe, expect, it } from 'vitest'
import { Entity } from '../../src/entity'
import { EntityPool } from '../../src/pools'
import { World } from '../../src/world'

describe('EntityPool', () => {
  let world = new World()
  let pool: EntityPool

  beforeEach(() => {
    world = new World()
    pool = world.entityPool
  })

  it('should return an entity on request', () => {
    expect(pool.size).toBe(0)
    expect(pool.available).toBe(0)
    expect(pool.used).toBe(0)

    const entity = pool.request()

    expect(entity).toBeTruthy()
    expect(entity instanceof Entity).toBeTruthy()

    expect(pool.size).toBe(1)
    expect(pool.available).toBe(0)
    expect(pool.used).toBe(1)
  })

  it('should recycle an entity', () => {
    expect(pool.size).toBe(0)
    expect(pool.available).toBe(0)
    expect(pool.used).toBe(0)

    const entity = pool.request()

    expect(entity).toBeTruthy()
    expect(entity instanceof Entity).toBeTruthy()

    expect(pool.size).toBe(1)
    expect(pool.available).toBe(0)
    expect(pool.used).toBe(1)

    pool.recycle(entity)

    expect(pool.size).toBe(1)
    expect(pool.available).toBe(1)
    expect(pool.used).toBe(0)
  })

  it('should support manually growing and shrinking', () => {
    expect(pool.size).toBe(0)
    expect(pool.available).toBe(0)
    expect(pool.used).toBe(0)

    pool.grow(10)

    expect(pool.size).toBe(10)
    expect(pool.available).toBe(10)
    expect(pool.used).toBe(0)

    pool.request()

    pool.free(5)

    expect(pool.size).toBe(5)
    expect(pool.available).toBe(4)
    expect(pool.used).toBe(1)

    pool.free(5)

    expect(pool.size).toBe(1)
    expect(pool.available).toBe(0)
    expect(pool.used).toBe(1)
  })
})
