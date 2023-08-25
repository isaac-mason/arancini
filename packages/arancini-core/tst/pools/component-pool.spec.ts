import { beforeEach, describe, expect, it } from 'vitest'
import { Component, objectPooled } from '../../src/component'
import { ComponentPool } from '../../src/pools'
import { World } from '../../src/world'

describe('ComponentPool', () => {
  @objectPooled()
  class ExampleComponentOne extends Component {}

  @objectPooled()
  class ExampleComponentTwo extends Component {}

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
