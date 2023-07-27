import { beforeEach, describe, expect, test, vi } from 'vitest'
import { Component, Entity, System, World } from '../src'

class TestComponentOne extends Component {}
class TestComponentTwo extends Component {}
class TestComponentThree extends Component {}
class TestComponentFour extends Component {}
class TestComponentFive extends Component {}
class TestComponentSix extends Component {}

const systemUpdateFn = vi.fn()

class SystemOne extends System {
  onUpdate(): void {
    systemUpdateFn(SystemOne)
  }
}

class SystemTwo extends System {
  onUpdate(): void {
    systemUpdateFn(SystemTwo)
  }
}

class SystemThree extends System {
  onUpdate(): void {
    systemUpdateFn(SystemThree)
  }
}

class SystemFour extends System {
  onUpdate(): void {
    systemUpdateFn(SystemFour)
  }
}

class TestSystemWithOnUpdate extends System {
  onUpdate(): void {
    systemUpdateFn(TestSystemWithOnUpdate)
  }
}

const testSystemQueryDescription = {
  all: [TestComponentOne],
}

class TestSystemWithQuery extends System {
  exampleQuery = this.query(testSystemQueryDescription)
}

class AnotherTestSystemWithQuery extends System {
  exampleQuery = this.query(testSystemQueryDescription)
}

describe('System', () => {
  let world: World

  beforeEach(() => {
    world = new World()
    world.init()

    world.registerComponent(TestComponentOne)
    world.registerComponent(TestComponentTwo)
    world.registerComponent(TestComponentThree)
    world.registerComponent(TestComponentFour)
    world.registerComponent(TestComponentFive)
    world.registerComponent(TestComponentSix)

    systemUpdateFn.mockReset()
  })

  test('systems are initialised on initialising the world', () => {
    world = new World()

    const systemInitFn = vi.fn()

    class TestSystem extends System {
      onInit(): void {
        systemInitFn()
      }
    }

    world.registerSystem(TestSystem)

    expect(systemInitFn).not.toHaveBeenCalled()

    world.init()

    expect(systemInitFn).toHaveBeenCalled()
  })

  test('systems can have queries', () => {
    // system with query for both TestComponentOne and TestComponentTwo
    const onAddedFn = vi.fn()
    const onRemovedFn = vi.fn()
    class TestSystem extends System {
      testQuery = this.query({
        all: [TestComponentOne, TestComponentTwo],
      })

      onInit(): void {
        this.testQuery.onEntityAdded.add((e) => this.onAdded(e))
        this.testQuery.onEntityRemoved.add((e) => this.onRemoved(e))
      }

      onAdded(entity: Entity): void {
        onAddedFn(entity)
      }

      onRemoved(entity: Entity): void {
        onRemovedFn(entity)
      }
    }

    world.registerSystem(TestSystem)
    const system = world.getSystem(TestSystem) as TestSystem

    // create entity that matches query
    const entity = world.create()
    entity.add(TestComponentOne)
    entity.add(TestComponentTwo)

    expect(onAddedFn.mock.calls.length).toBe(1)
    expect(onRemovedFn.mock.calls.length).toBe(0)
    expect(system.testQuery.entities.length).toBe(1)

    // update, clearing added and removed arrays
    world.update()

    // remove component, assert removal is reflected in the query
    entity.remove(TestComponentOne)

    expect(system.testQuery.entities.length).toBe(0)
    expect(onAddedFn.mock.calls.length).toBe(1)
    expect(onRemovedFn.mock.calls.length).toBe(1)
  })

  test('onInit, onUpdate, and onDestroy lifecycle methods are called', () => {
    const systemInitJestFn = vi.fn()
    const systemUpdateJestFn = vi.fn()
    const systemDestroyJestFn = vi.fn()
    class TestSystem extends System {
      onDestroy(): void {
        systemDestroyJestFn()
      }

      onInit(): void {
        systemInitJestFn()
      }

      onUpdate(delta: number): void {
        systemUpdateJestFn(delta)
      }
    }

    world.registerSystem(TestSystem)
    const testSystem = world.getSystem(TestSystem) as TestSystem

    expect(world.initialised).toBe(true)

    const deltaUpdateOne = 1
    const deltaUpdateTwo = 2

    world.update(deltaUpdateOne)
    world.update(deltaUpdateTwo)

    testSystem.enabled = false
    world.update()

    world.destroy()

    expect(systemInitJestFn).toHaveBeenCalledTimes(1)

    expect(systemUpdateJestFn).toHaveBeenCalledTimes(2)
    expect(systemUpdateJestFn.mock.calls[0][0]).toBe(deltaUpdateOne)
    expect(systemUpdateJestFn.mock.calls[1][0]).toBe(deltaUpdateTwo)

    expect(systemDestroyJestFn).toHaveBeenCalledTimes(1)
  })

  test('silently swallows attempting to unregister a system that is not registered or has already been unregistered', () => {
    expect(() => {
      world
        .unregisterSystem(SystemOne)
        .registerSystem(SystemOne)
        .unregisterSystem(SystemOne)
        .unregisterSystem(SystemOne)
    }).not.toThrowError()
  })

  test('throws an error on attempting to re-register a system', () => {
    expect(() => {
      world.registerSystem(SystemOne).registerSystem(SystemOne)
    }).toThrowError()
  })

  test('system execution order defaults to order of registration', () => {
    world
      .registerSystem(SystemOne)
      .registerSystem(SystemTwo)
      .registerSystem(SystemThree)
      .registerSystem(SystemFour)

    expect(world.getSystems().map((s) => s.__internal.class)).toEqual([
      SystemOne,
      SystemTwo,
      SystemThree,
      SystemFour,
    ])

    world.update()

    expect(systemUpdateFn).toHaveBeenCalledTimes(4)
    expect(systemUpdateFn).nthCalledWith(1, SystemOne)
    expect(systemUpdateFn).nthCalledWith(2, SystemTwo)
    expect(systemUpdateFn).nthCalledWith(3, SystemThree)
    expect(systemUpdateFn).nthCalledWith(4, SystemFour)
  })

  test('system execution order should be in order of registration, with an optional system priority', () => {
    world
      .registerSystem(SystemOne, { priority: -100 })
      .registerSystem(SystemTwo)
      .registerSystem(SystemThree, { priority: -50 })
      .registerSystem(SystemFour)

    expect(world.getSystems().map((s) => s.__internal.class)).toEqual([
      SystemOne,
      SystemTwo,
      SystemThree,
      SystemFour,
    ])

    world.update()

    expect(systemUpdateFn).toHaveBeenCalledTimes(4)
    expect(systemUpdateFn).nthCalledWith(1, SystemTwo)
    expect(systemUpdateFn).nthCalledWith(2, SystemFour)
    expect(systemUpdateFn).nthCalledWith(3, SystemThree)
    expect(systemUpdateFn).nthCalledWith(4, SystemOne)
  })

  test('systems will not be updated after they have been unregistered', () => {
    world.registerSystem(TestSystemWithOnUpdate)

    expect(world.getSystems().map((s) => s.__internal.class)).toEqual([
      TestSystemWithOnUpdate,
    ])

    world.update()

    expect(systemUpdateFn).toHaveBeenCalledTimes(1)
    expect(systemUpdateFn).nthCalledWith(1, TestSystemWithOnUpdate)

    world.unregisterSystem(TestSystemWithOnUpdate)

    expect(systemUpdateFn).toHaveBeenCalledTimes(1)
    expect(systemUpdateFn).nthCalledWith(1, TestSystemWithOnUpdate)
  })

  test('systems can be removed, and queries will be removed if they are no longer used by any systems', () => {
    world.registerSystem(TestSystemWithQuery)
    const systemOne = world.getSystem(
      TestSystemWithQuery
    ) as TestSystemWithQuery

    world.registerSystem(AnotherTestSystemWithQuery)
    const systemTwo = world.getSystem(
      AnotherTestSystemWithQuery
    ) as AnotherTestSystemWithQuery

    expect(
      world.queryManager.hasQuery({
        all: [TestComponentOne],
      })
    ).toBe(true)

    systemOne.destroy()

    expect(
      world.queryManager.hasQuery({
        all: [TestComponentOne],
      })
    ).toBe(true)

    systemTwo.destroy()

    expect(
      world.queryManager.hasQuery({
        all: [TestComponentOne],
      })
    ).toBe(false)
  })

  test('systems can be removed, and queries will not be removed if they are used standalone outside of systems', () => {
    // use the query outside of a system
    const query = world.query(testSystemQueryDescription)

    world.registerSystem(TestSystemWithQuery)
    const systemOne = world.getSystem(
      TestSystemWithQuery
    ) as TestSystemWithQuery

    world.registerSystem(AnotherTestSystemWithQuery)
    const systemTwo = world.getSystem(
      AnotherTestSystemWithQuery
    ) as AnotherTestSystemWithQuery

    // assert the query exists
    expect(
      world.queryManager.hasQuery({
        all: [TestComponentOne],
      })
    ).toBe(true)

    // destroy both systems using the query
    systemOne.destroy()
    systemTwo.destroy()

    expect(
      world.queryManager.hasQuery({
        all: [TestComponentOne],
      })
    ).toBe(true)

    // remove the query manually
    query.destroy()

    expect(
      world.queryManager.hasQuery({
        all: [TestComponentOne],
      })
    ).toBe(false)
  })

  test('onUpdate will not be called if any required queries have no results', () => {
    class TestSystemWithRequiredQuery extends System {
      requiredQuery = this.query([TestComponentOne], { required: true })

      onUpdate(): void {
        systemUpdateFn()
      }
    }

    world.registerSystem(TestSystemWithRequiredQuery)

    world.update()

    expect(systemUpdateFn).toHaveBeenCalledTimes(0)

    world.create().add(TestComponentOne)

    world.update()

    expect(systemUpdateFn).toHaveBeenCalledTimes(1)
  })

  test('systems can have singleton components defined', () => {
    class TestSystemWithSingleton extends System {
      singletonComponent = this.singleton(TestComponentOne, { required: true })

      onUpdate(): void {
        systemUpdateFn()
      }
    }

    world.registerSystem(TestSystemWithSingleton)
    const system = world.getSystem(
      TestSystemWithSingleton
    ) as TestSystemWithSingleton

    // singletonComponent should be undefined before any entities are created
    expect(system.singletonComponent).toBe(undefined)

    // system should not update as the singleton is required
    world.update()
    expect(systemUpdateFn).toHaveBeenCalledTimes(0)

    // singletonComponent should be defined after an entity with the component is created
    const testEntity = world.create()
    const testComponentOne = testEntity.add(TestComponentOne)

    expect(system.singletonComponent).toBe(testComponentOne)
    expect(system.singletonComponent?._arancini_entity).toBe(testEntity)

    // system should update as the singleton is now defined
    world.update()
    expect(systemUpdateFn).toHaveBeenCalledTimes(1)

    // singletonComponent should be undefined after the component is destroyed
    testEntity.destroy()
    expect(system.singletonComponent).toBe(undefined)

    // ensure the old entity and component is not re-used
    world.entityManager.entityPool.free(1)
    world.entityManager.componentPool.free(TestComponentOne, 1)

    // singletonComponent should be set after a new entity with the component is created
    const newTestEntity = world.create()
    const newTestComponentOne = newTestEntity.add(TestComponentOne)

    expect(system.singletonComponent).toBe(newTestComponentOne)
    expect(system.singletonComponent?._arancini_entity).toBe(newTestEntity)

    expect(system.singletonComponent).not.toBe(testComponentOne)
    expect(system.singletonComponent).not.toBe(testEntity)
  })
})
