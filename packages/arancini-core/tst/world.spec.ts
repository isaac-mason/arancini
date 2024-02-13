import { describe, expect, it } from 'vitest'
import { World } from '../src/world'

type Entity = {
  foo?: string
  bar?: number
  car?: number
}

describe('World', () => {
  it('supports computing an id for an entity, then retrieving an entity by id later', () => {
    const world = new World<Entity>()

    const entityOne = {}

    world.create(entityOne)

    const id = world.id(entityOne)!

    expect(world.entity(id)).toBe(entityOne)
  })
})
