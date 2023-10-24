import { describe, it, expect, vi } from 'vitest'
import { World } from '../src/world'
import { System } from '../src/system'

type Entity = {
  foo?: string
  bar?: number
}

describe('Systems', () => {
  it('should update systems', () => {
    const world = new World<Entity>()

    world.init()

    const onUpdateFn = vi.fn()

    class ExampleSystem extends System<Entity> {
      onUpdate(delta: number, time: number) {
        onUpdateFn(delta, time)
      }
    }

    world.registerSystem(ExampleSystem)

    world.step(0.1)
    world.step(0.1)

    expect(onUpdateFn).toHaveBeenCalledTimes(2)
    expect(onUpdateFn).toHaveBeenCalledWith(0.1, 0.1)
    expect(onUpdateFn).toHaveBeenCalledWith(0.1, 0.2)

    world.unregisterSystem(ExampleSystem)

    world.step(0.1)

    expect(onUpdateFn).toHaveBeenCalledTimes(2)
  })

  it('should support attaching systems to other systems', () => {
    const world = new World<Entity>()

    class ExampleSystem extends System<Entity> {}

    class ExampleSystemTwo extends System<Entity> {
      exampleSystem = this.attach(ExampleSystem)!
    }

    world.registerSystem(ExampleSystem)
    world.registerSystem(ExampleSystemTwo)

    world.init()

    const exampleSystem = world.getSystem(ExampleSystem)!
    const exampleSystemTwo = world.getSystem(ExampleSystemTwo)!

    expect(exampleSystemTwo.exampleSystem).toBe(exampleSystem)
  })

  it('should support attaching queries to systems', () => {
    const world = new World<Entity>({ components: ['foo', 'bar'] })

    class ExampleSystem extends System<Entity> {
      exampleQuery = this.query((q) => q.has('foo'))

      exampleSingleton = this.singleton('foo')!
    }

    world.registerSystem(ExampleSystem)

    world.init()

    const exampleSystem = world.getSystem(ExampleSystem)!

    world.create({ foo: 'bar' })

    expect(exampleSystem.exampleQuery.entities.length).toBe(1)
    expect(exampleSystem.exampleSingleton).toBe('bar')
  })

  it('should support sorting systems by registration order and priority', () => {
    const world = new World<Entity>()

    const updateFn = vi.fn()

    class ExampleSystem extends System<Entity> {
      onUpdate() {
        updateFn(this)
      }
    }

    class ExampleSystemTwo extends System<Entity> {
      onUpdate() {
        updateFn(this)
      }
    }

    class ExampleSystemThree extends System<Entity> {
      onUpdate() {
        updateFn(this)
      }
    }

    world.registerSystem(ExampleSystem)
    world.registerSystem(ExampleSystemTwo, { priority: 1 })
    world.registerSystem(ExampleSystemThree)

    world.init()

    world.step(0.1)

    expect(updateFn).toHaveBeenCalledTimes(3)
    expect(updateFn).toHaveBeenNthCalledWith(
      1,
      world.getSystem(ExampleSystemTwo)
    )
    expect(updateFn).toHaveBeenNthCalledWith(2, world.getSystem(ExampleSystem))
    expect(updateFn).toHaveBeenNthCalledWith(
      3,
      world.getSystem(ExampleSystemThree)
    )
  })

  it('silently swallows attempting to unregister a system that is not registered or has already been unregistered', () => {
    class ExampleSystem extends System {}

    expect(() => {
      const world = new World<Entity>()

      world
        .unregisterSystem(ExampleSystem)
        .registerSystem(ExampleSystem)
        .unregisterSystem(ExampleSystem)
        .unregisterSystem(ExampleSystem)
    }).not.toThrowError()
  })

  it('throws an error on attempting to re-register a system', () => {
    class ExampleSystem extends System {}

    expect(() => {
      const world = new World<Entity>()

      world.registerSystem(ExampleSystem).registerSystem(ExampleSystem)
    }).toThrowError()
  })

  it('should remove queries if they are no longer used by any systems', () => {
    const world = new World<Entity>({ components: ['foo', 'bar'] })

    class TestSystemWithQuery extends System<Entity> {
      exampleQuery = this.query((entities) => entities.with('foo'))
    }

    class AnotherTestSystemWithQuery extends System<Entity> {
      exampleQuery = this.query((entities) => entities.with('foo'))
    }

    world.registerSystem(TestSystemWithQuery)
    world.registerSystem(AnotherTestSystemWithQuery)

    world.queries.size === 1

    world.unregisterSystem(TestSystemWithQuery)

    world.queries.size === 1

    world.unregisterSystem(AnotherTestSystemWithQuery)

    world.queries.size === 0
  })

  it('should not remove queries used by systems if an equivalent standalone query is in use', () => {
    const world = new World<Entity>({ components: ['foo', 'bar'] })

    class TestSystemWithQuery extends System<Entity> {
      exampleQuery = this.query((entities) => entities.with('foo'))
    }

    world.registerSystem(TestSystemWithQuery)

    world.queries.size === 1

    world.query((entities) => entities.with('foo'))

    world.queries.size === 1

    world.unregisterSystem(TestSystemWithQuery)

    world.queries.size === 1
  })

  it('supports making queries required, preventing system updates if there are no results', () => {
    const world = new World<Entity>({ components: ['foo', 'bar'] })

    const onUpdateFn = vi.fn()

    class TestSystemWithQuery extends System<Entity> {
      exampleQuery = this.query((entities) => entities.with('foo'), {
        required: true,
      })

      exampleSingleton = this.singleton('bar', { required: true })!

      onUpdate(): void {
        onUpdateFn()
      }
    }

    world.registerSystem(TestSystemWithQuery)

    world.init()

    world.step(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(0)

    const entityOne = { foo: 'value' }
    world.create(entityOne)

    world.step(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(0)

    const entityTwo = { bar: 1 }
    world.create(entityTwo)

    world.step(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)

    world.destroy(entityOne)

    world.step(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)
  })

  it('should call system onDestroy methods on resetting the world', () => {
    const world = new World<Entity>()

    const onDestroyFn = vi.fn()

    class ExampleSystem extends System<Entity> {
      onDestroy() {
        onDestroyFn()
      }
    }

    world.registerSystem(ExampleSystem)

    world.init()

    world.reset()

    expect(onDestroyFn).toHaveBeenCalledTimes(1)
  })

  it('should not update systems if "enabled" is false', () => {
    const world = new World<Entity>()

    const onUpdateFn = vi.fn()

    class ExampleSystem extends System<Entity> {
      onUpdate() {
        onUpdateFn()
      }
    }

    world.registerSystem(ExampleSystem)

    world.init()

    world.step(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)

    world.getSystem(ExampleSystem)!.enabled = false

    world.step(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)
  })

  it('should not update systems after they are unregistered', () => {
    const world = new World<Entity>()

    const onUpdateFn = vi.fn()

    class ExampleSystem extends System<Entity> {
      onUpdate() {
        onUpdateFn()
      }
    }

    world.registerSystem(ExampleSystem)

    world.init()

    world.step(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)

    world.unregisterSystem(ExampleSystem)

    world.step(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)
  })
})
