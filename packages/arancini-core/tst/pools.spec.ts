/* eslint-disable max-classes-per-file */
import { beforeEach, describe, expect, it } from 'vitest'
import { Component, objectPooled } from '../src/component'
import { Entity } from '../src/entity'
import { ComponentPool, EntityPool, ObjectPool } from '../src/pools'
import { World } from '../src/world'

describe('Pools', () => {
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

  describe('ComponentPool', () => {
    class ExampleComponentOne extends Component {
      static objectPooled = true
    }

    class ExampleComponentTwo extends Component {
      static objectPooled = true
    }

    let world: World
    let pool: ComponentPool

    beforeEach(() => {
      world = new World()
      world.registerComponent(ExampleComponentOne)
      world.registerComponent(ExampleComponentTwo)
      pool = world.componentPool
    })

    it('should create a new pool on retrieving a component for the first time', () => {
      expect(pool.totalPools).toBe(0)
      expect(pool.size).toBe(0)
      expect(pool.available).toBe(0)
      expect(pool.used).toBe(0)

      const componentOne = pool.request(ExampleComponentOne)

      expect(pool.totalPools).toBe(1)
      expect(pool.size).toBe(1)
      expect(pool.available).toBe(0)
      expect(pool.used).toBe(1)
      expect(componentOne).toBeTruthy()
      expect(componentOne instanceof ExampleComponentOne).toBeTruthy()

      const componentTwo = pool.request(ExampleComponentOne)
      expect(pool.totalPools).toBe(1)
      expect(pool.size).toBe(2)
      expect(pool.available).toBe(0)
      expect(pool.used).toBe(2)

      expect(componentTwo).toBeTruthy()
      expect(componentTwo instanceof ExampleComponentOne).toBeTruthy()

      const componentThree = pool.request(ExampleComponentTwo)
      expect(componentThree).toBeTruthy()
      expect(componentThree instanceof ExampleComponentTwo).toBeTruthy()
      expect(pool.totalPools).toBe(2)
      expect(pool.size).toBe(3)
      expect(pool.available).toBe(0)
      expect(pool.used).toBe(3)
    })

    it('should recycle components', () => {
      expect(pool.totalPools).toBe(0)
      expect(pool.size).toBe(0)
      expect(pool.available).toBe(0)
      expect(pool.used).toBe(0)

      const entity = world.create()
      const component = entity.add(ExampleComponentOne)

      expect(pool.totalPools).toBe(1)
      expect(pool.size).toBe(1)
      expect(pool.available).toBe(0)
      expect(pool.used).toBe(1)

      expect(component).toBeTruthy()
      expect(component instanceof ExampleComponentOne).toBeTruthy()

      entity.remove(ExampleComponentOne)

      expect(pool.totalPools).toBe(1)
      expect(pool.size).toBe(1)
      expect(pool.available).toBe(1)
      expect(pool.used).toBe(0)
    })

    it('should support manually growing and shrinking', () => {
      expect(pool.totalPools).toBe(0)
      expect(pool.size).toBe(0)
      expect(pool.available).toBe(0)
      expect(pool.used).toBe(0)

      pool.grow(ExampleComponentOne, 10)

      expect(pool.totalPools).toBe(1)

      expect(pool.size).toBe(10)
      expect(pool.available).toBe(10)
      expect(pool.used).toBe(0)

      pool.request(ExampleComponentOne)

      pool.free(ExampleComponentOne, 5)

      expect(pool.size).toBe(5)
      expect(pool.available).toBe(4)
      expect(pool.used).toBe(1)

      pool.free(ExampleComponentOne, 5)

      expect(pool.size).toBe(1)
      expect(pool.available).toBe(0)
      expect(pool.used).toBe(1)
    })
  })
})
