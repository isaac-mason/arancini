import { describe, it, expect } from '@jest/globals'
import { Entity } from '../entity'
import { EntityPool } from './entity-pool'

describe('EntityPool', () => {
  let pool: EntityPool

  beforeEach(() => {
    pool = new EntityPool()
  })

  it('should return an entity on request', () => {
    expect(pool.size).toBe(0)
    expect(pool.free).toBe(0)
    expect(pool.used).toBe(0)

    const entity = pool.request()

    expect(entity).toBeTruthy()
    expect(entity instanceof Entity).toBeTruthy()

    expect(pool.size).toBe(1)
    expect(pool.free).toBe(0)
    expect(pool.used).toBe(1)
  })

  it('should release an entity', () => {
    expect(pool.size).toBe(0)
    expect(pool.free).toBe(0)
    expect(pool.used).toBe(0)

    const entity = pool.request()

    expect(entity).toBeTruthy()
    expect(entity instanceof Entity).toBeTruthy()

    expect(pool.size).toBe(1)
    expect(pool.free).toBe(0)
    expect(pool.used).toBe(1)

    pool.release(entity)

    expect(pool.size).toBe(1)
    expect(pool.free).toBe(1)
    expect(pool.used).toBe(0)
  })
})
