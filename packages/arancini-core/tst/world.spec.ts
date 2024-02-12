import { describe, expect, it } from 'vitest'
import { World } from '../src/world'

type Entity = {
  foo?: string
  bar?: number
  car?: number
}

describe('World', () => {
  it('supports registering components on an existing world', () => {
    const world = new World<Entity>()

    const entityOne = {}
    const entityTwo = {}

    world.create(entityOne)
    world.create(entityTwo)

    world.registerComponents(['foo', 'bar'])
  })

  it('supports automatically registering components', () => {
    const world = new World<Entity>()

    const entity = { foo: 'test' }

    world.create(entity)

    const queryForBar = world.query((q) => q.has('bar'))
    expect(queryForBar.entities.length).toBe(0)

    world.add(entity, 'bar', 1)
    expect(queryForBar.entities.length).toBe(1)

    const queryForCar = world.query((q) => q.has('car'))
    expect(queryForCar.entities.length).toBe(0)

    world.add(entity, 'car', 1)
    expect(queryForCar.entities.length).toBe(1)
  })

  it('supports computing an id for an entity, then retrieving an entity by id later', () => {
    const world = new World<Entity>()

    const entityOne = {}

    world.create(entityOne)

    const id = world.id(entityOne)!

    expect(world.entity(id)).toBe(entityOne)
  })
})
