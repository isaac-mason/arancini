import { describe, expect, it } from 'vitest'
import { World } from '../src/world'

type Entity = {
  foo?: string
  bar?: number
}

describe('World', () => {
  it('supports registering components after init', () => {
    const world = new World<Entity>()

    world.init()

    const entityOne = {}
    const entityTwo = {}

    world.create(entityOne)
    world.create(entityTwo)

    world.registerComponents(['foo', 'bar'])
  })

  it('supports computing an id for an entity, then retrieving an entity by id later', () => {
    const world = new World<Entity>()

    world.init()

    const entityOne = {}

    world.create(entityOne)

    const id = world.id(entityOne)!

    expect(world.entity(id)).toBe(entityOne)
  })
})
