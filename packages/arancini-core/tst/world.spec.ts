import { beforeEach, describe, expect, it } from 'vitest'
import { System, World } from '../src'

describe('World', () => {
  let world: World

  beforeEach(() => {
    world = new World()
    world.init()
  })

  it('should have a default space that entities can be created in', () => {
    expect(Array.from(world.spaceManager.spaces.values())[0]).toBe(
      world.defaultSpace
    )

    const entityOne = world.create.entity()

    expect(world.defaultSpace.entities.get(entityOne.id)).toBe(entityOne)

    const entityTwo = world.create.entity()

    expect(world.defaultSpace.entities.get(entityTwo.id)).toBe(entityTwo)
  })

  it('can retrieve systems by system class', () => {
    class TestSystem extends System {}

    world.registerSystem(TestSystem)

    const testSystem = world.getSystem(TestSystem)
    expect(testSystem?.__internal.class).toBe(TestSystem)
  })

  it('can retrieve all systems registered in the world', () => {
    class TestSystem extends System {}

    world.registerSystem(TestSystem)

    const systems = world.getSystems()
    expect(systems.length).toBe(1)
    expect(systems[0].__internal.class).toBe(TestSystem)
  })

  it('can retrieve spaces by id', () => {
    const space = world.create.space({ id: 'SpaceName' })

    expect(world.getSpace('SpaceName')).toBe(space)
  })

  it('removes all Systems and Spaces on destroying a World', () => {
    world.create.space()

    class TestSystem extends System {}
    world.registerSystem(TestSystem)

    expect(world.spaceManager.spaces.size).toBe(2)
    expect(world.systemManager.systems.size).toBe(1)

    world.destroy()

    expect(world.spaceManager.spaces.size).toBe(0)
    expect(world.systemManager.systems.size).toBe(0)
  })
})
