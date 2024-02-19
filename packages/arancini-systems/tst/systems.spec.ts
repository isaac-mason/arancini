import { World } from '@arancini/core'
import { describe, expect, it, vi } from 'vitest'
import { Executor, System } from '../src'

type Entity = {
  foo?: string
  bar?: number
}

describe('Systems', () => {
  it('should update systems', () => {
    const world = new World<Entity>()
    const executor = new Executor(world)

    const onUpdateFn = vi.fn()

    class ExampleSystem extends System<Entity> {
      onUpdate(delta: number, time: number) {
        onUpdateFn(delta, time)
      }
    }

    executor.add(ExampleSystem)

    executor.update(0.1)
    executor.update(0.1)

    expect(onUpdateFn).toHaveBeenCalledTimes(2)
    expect(onUpdateFn).toHaveBeenCalledWith(0.1, 0.1)
    expect(onUpdateFn).toHaveBeenCalledWith(0.1, 0.2)

    executor.remove(ExampleSystem)

    executor.update(0.1)

    expect(onUpdateFn).toHaveBeenCalledTimes(2)
  })

  it('should support attaching systems to other systems', () => {
    const world = new World<Entity>()
    const executor = new Executor(world)

    class ExampleSystem extends System<Entity> {}

    class ExampleSystemTwo extends System<Entity> {
      exampleSystem = this.attach(ExampleSystem)!
    }

    executor.add(ExampleSystem)
    executor.add(ExampleSystemTwo)

    executor.init()

    const exampleSystem = executor.get(ExampleSystem)!
    const exampleSystemTwo = executor.get(ExampleSystemTwo)!

    expect(exampleSystemTwo.exampleSystem).toBe(exampleSystem)
  })

  it('should support attaching queries to systems', () => {
    const world = new World<Entity>()
    const executor = new Executor(world)

    class ExampleSystem extends System<Entity> {
      exampleQuery = this.query((q) => q.has('foo'))

      exampleSingleton = this.singleton('foo')!
    }

    executor.add(ExampleSystem)

    executor.init()

    const exampleSystem = executor.get(ExampleSystem)!

    world.create({ foo: 'bar' })

    expect(exampleSystem.exampleQuery.entities.length).toBe(1)
    expect(exampleSystem.exampleSingleton).toBe('bar')
  })

  it('should support sorting systems by registration order and priority', () => {
    const world = new World<Entity>()
    const executor = new Executor(world)

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

    executor.add(ExampleSystem)
    executor.add(ExampleSystemTwo, { priority: 1 })
    executor.add(ExampleSystemThree)

    executor.init()

    executor.update(0.1)

    expect(updateFn).toHaveBeenCalledTimes(3)
    expect(updateFn).toHaveBeenNthCalledWith(1, executor.get(ExampleSystemTwo))
    expect(updateFn).toHaveBeenNthCalledWith(2, executor.get(ExampleSystem))
    expect(updateFn).toHaveBeenNthCalledWith(
      3,
      executor.get(ExampleSystemThree)
    )
  })

  it('throws an error on attempting to re-register a system', () => {
    class ExampleSystem extends System {}

    expect(() => {
      const world = new World<Entity>()
      const executor = new Executor(world)

      executor.add(ExampleSystem).add(ExampleSystem)
    }).toThrowError()
  })

  it('throws an error on attempting to unregister a system that is not registered', () => {
    class ExampleSystem extends System {}

    expect(() => {
      const world = new World<Entity>()
      const executor = new Executor(world)

      executor.remove(ExampleSystem)
    }).toThrowError()
  })

  it('should remove queries if they are no longer used by any systems', () => {
    const world = new World<Entity>()
    const executor = new Executor(world)

    class TestSystemWithQuery extends System<Entity> {
      exampleQuery = this.query((entities) => entities.with('foo'))
    }

    class AnotherTestSystemWithQuery extends System<Entity> {
      exampleQuery = this.query((entities) => entities.with('foo'))
    }

    executor.add(TestSystemWithQuery)
    executor.add(AnotherTestSystemWithQuery)

    world.queries.size === 1

    executor.remove(TestSystemWithQuery)

    world.queries.size === 1

    executor.remove(AnotherTestSystemWithQuery)

    world.queries.size === 0
  })

  it('should not remove queries used by systems if an equivalent standalone query is in use', () => {
    const world = new World<Entity>()
    const executor = new Executor(world)

    class TestSystemWithQuery extends System<Entity> {
      exampleQuery = this.query((entities) => entities.with('foo'))
    }

    executor.add(TestSystemWithQuery)

    world.queries.size === 1

    world.query((entities) => entities.with('foo'))

    world.queries.size === 1

    executor.remove(TestSystemWithQuery)

    world.queries.size === 1
  })

  it('supports making queries required, preventing system updates if there are no results', () => {
    const world = new World<Entity>()
    const executor = new Executor(world)

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

    executor.add(TestSystemWithQuery)

    executor.init()

    executor.update(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(0)

    const entityOne = { foo: 'value' }
    world.create(entityOne)

    executor.update(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(0)

    const entityTwo = { bar: 1 }
    world.create(entityTwo)

    executor.update(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)

    world.destroy(entityOne)

    executor.update(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)
  })

  it('should call system onDestroy methods on destroying the Executor', () => {
    const world = new World<Entity>()
    const executor = new Executor(world)

    const onDestroyFn = vi.fn()

    class ExampleSystem extends System<Entity> {
      onDestroy() {
        onDestroyFn()
      }
    }

    executor.add(ExampleSystem)

    executor.init()

    executor.destroy()

    expect(onDestroyFn).toHaveBeenCalledTimes(1)
  })

  it('should not update systems if "enabled" is false', () => {
    const world = new World<Entity>()
    const executor = new Executor(world)

    const onUpdateFn = vi.fn()

    class ExampleSystem extends System<Entity> {
      onUpdate() {
        onUpdateFn()
      }
    }

    executor.add(ExampleSystem)

    executor.init()

    executor.update(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)

    executor.get(ExampleSystem)!.enabled = false

    executor.update(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)
  })

  it('should not update systems after they are unregistered', () => {
    const world = new World<Entity>()
    const executor = new Executor(world)

    const onUpdateFn = vi.fn()

    class ExampleSystem extends System<Entity> {
      onUpdate() {
        onUpdateFn()
      }
    }

    executor.add(ExampleSystem)

    executor.init()

    executor.update(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)

    executor.remove(ExampleSystem)

    executor.update(0.1)
    expect(onUpdateFn).toHaveBeenCalledTimes(1)
  })
})
