import { beforeEach, describe, expect, test } from 'vitest'
import { System, World } from '../src'

describe('World', () => {
  let world: World

  beforeEach(() => {
    world = new World()
    world.init()
  })

  test('getSystem', () => {
    class TestSystem extends System {}

    world.registerSystem(TestSystem)

    const testSystem = world.getSystem(TestSystem)
    expect(testSystem?.__internal.class).toBe(TestSystem)
  })

  test('getSystems', () => {
    class TestSystem extends System {}

    world.registerSystem(TestSystem)

    const systems = world.getSystems()
    expect(systems.length).toBe(1)
    expect(systems[0].__internal.class).toBe(TestSystem)
  })

  test('destroy', () => {
    world.create()

    expect(world.initialised).toBe(true)
    expect(world.entities.size).toBe(1)

    world.destroy()

    expect(world.initialised).toBe(false)
    expect(world.entities.size).toBe(0)
  })
})
