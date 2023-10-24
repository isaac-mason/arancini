import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import { Component, World, cloneComponentDefinition } from '../src'
import { InternalComponentInstanceProperties } from '../dist'

describe('Entities and Components', () => {
  let world: World

  beforeEach(() => {
    world = new World()

    world.init()
  })

  test('creating and destroying an entity', () => {
    const entity = world.create()
    const { id } = entity

    entity.destroy()

    // assert the entity has been reset
    expect(entity.id).not.toEqual(id)
    expect(world.has(entity)).toBe(false)
  })

  describe('pooled class component', () => {
    test('with no construct args', () => {
      class TestComponent extends Component {}

      world.registerComponent(TestComponent)

      const entity = world.create()
      const testComponent = entity.add(TestComponent)

      expect(testComponent).toBeInstanceOf(TestComponent)

      entity.remove(TestComponent)
    })

    test('with construct args', () => {
      class TestComponentWithConstructParams extends Component {
        position!: { x: number; y: number }

        construct(x: number, y: number): void {
          this.position = { x, y }
        }
      }

      world.registerComponent(TestComponentWithConstructParams)

      const entity = world.create()
      const testComponent = entity.add(TestComponentWithConstructParams, 1, 2)

      expect(testComponent.position.x).toBe(1)
      expect(testComponent.position.y).toBe(2)

      entity.remove(TestComponentWithConstructParams)
    })
  })

  test('object component', () => {
    const TestComponent = Component.object<{ x: number; y: number }>({
      name: 'TestComponent',
    })

    world.registerComponent(TestComponent)

    const entity = world.create()
    const arg = { x: 1, y: 2 }
    const testComponent = entity.add(TestComponent, arg)

    // object identity should be preserved
    expect(testComponent).toBe(arg)

    expect(testComponent.x).toBe(1)
    expect(testComponent.y).toBe(2)

    const internal =
      testComponent as unknown as InternalComponentInstanceProperties

    expect(internal._arancini_id).toBeTruthy()
    expect(internal._arancini_component_definition).toBe(TestComponent)

    entity.remove(TestComponent)

    expect(internal._arancini_id).toBeUndefined()
    expect(internal._arancini_component_definition).toBeUndefined()
  })

  test('tag component', () => {
    const TagComponent = Component.tag({ name: 'TagComponent' })

    world.registerComponent(TagComponent)

    const entity = world.create()
    entity.add(TagComponent)

    expect(entity.has(TagComponent)).toBe(true)

    entity.remove(TagComponent)
  })

  test('cloneComponentDefinition', () => {
    const TestComponent = Component.object<{ x: number; y: number }>({
      name: 'TestComponent',
    })
    const Clone = cloneComponentDefinition(TestComponent)

    world.registerComponent(TestComponent)
    world.registerComponent(Clone)

    expect(world.componentRegistry.components.size).toBe(2)

    class TestClassComponent extends Component {}
    const ClassClone = cloneComponentDefinition(TestClassComponent)

    world.registerComponent(TestClassComponent)
    world.registerComponent(ClassClone)

    expect(world.componentRegistry.components.size).toBe(4)
  })

  test('entity initial components should be added in a bulk update', () => {
    class TestComponent extends Component {}

    world.registerComponent(TestComponent)

    const query = world.query((entities) => entities.with(TestComponent))

    let added = 0
    let removed = 0

    query.onEntityAdded.add(() => {
      added++
    })

    query.onEntityRemoved.add(() => {
      removed++
    })

    world.create((e) => {
      e.add(TestComponent)
      e.remove(TestComponent)
      e.add(TestComponent)
    })

    expect(added).toBe(1)
    expect(removed).toBe(0)
  })

  describe('adding and removing components', () => {
    class TestComponentOne extends Component {}
    class TestComponentTwo extends Component {}
    class TestComponentWithConstructParams extends Component {
      position!: { x: number; y: number }

      construct(x: number, y: number): void {
        this.position = { x, y }
      }
    }

    beforeEach(() => {
      world.registerComponent(TestComponentOne)
      world.registerComponent(TestComponentTwo)
      world.registerComponent(TestComponentWithConstructParams)
    })

    test('components can be added and removed from entities', () => {
      // create two entities
      const entityOne = world.create()

      // add TestComponentOne to entities
      entityOne.add(TestComponentOne)
      expect(entityOne.has(TestComponentOne)).toBeTruthy()
      expect(entityOne.has(TestComponentTwo)).toBeFalsy()

      // remove component
      entityOne.remove(TestComponentOne)

      expect(entityOne.has(TestComponentOne)).toBeFalsy()
      expect(entityOne.has(TestComponentTwo)).toBeFalsy()

      // add TestComponentOne components back
      entityOne.add(TestComponentOne)
      expect(entityOne.has(TestComponentOne)).toBeTruthy()
      expect(entityOne.has(TestComponentTwo)).toBeFalsy()
    })

    test('components can be added and removed in bulk', () => {
      const entity = world.create()

      entity.add(TestComponentOne)

      expect(entity.has(TestComponentOne)).toBeTruthy()

      entity.bulk(() => {
        entity.remove(TestComponentOne)
        entity.add(TestComponentTwo)
        entity.add(TestComponentWithConstructParams, 1, 2)
      })

      expect(entity.has(TestComponentOne)).toBeFalsy()

      expect(entity.has(TestComponentTwo)).toBeTruthy()

      const testComponentWithConstructParams = entity.get(
        TestComponentWithConstructParams
      )
      expect(testComponentWithConstructParams).toBeTruthy()
      expect(testComponentWithConstructParams.position.x).toBe(1)
      expect(testComponentWithConstructParams.position.y).toBe(2)
    })

    test('should throw if adding a component to an entity that already has the component', () => {
      const entity = world.create()
      entity.add(TestComponentOne)

      expect(() => {
        entity.add(TestComponentOne)
      }).toThrowError()
    })

    test('on re-adding a component to an entity, it will be newly constructed properly', () => {
      const entity = world.create()
      entity.add(TestComponentWithConstructParams, 1, 2)
      expect(entity.has(TestComponentWithConstructParams)).toBe(true)

      const componentOne = entity.get(TestComponentWithConstructParams)
      expect(componentOne.position.x).toBe(1)
      expect(componentOne.position.y).toBe(2)

      entity.remove(TestComponentWithConstructParams)
      expect(entity.has(TestComponentWithConstructParams)).toBe(false)

      entity.add(TestComponentWithConstructParams, 3, 4)
      const componentTwo = entity.get(TestComponentWithConstructParams)
      expect(componentTwo.position.x).toBe(3)
      expect(componentTwo.position.y).toBe(4)
    })

    test('should throw an error if the component does not exist in the entity', () => {
      const entity = world.create()

      expect(() => entity.remove(TestComponentOne)).toThrowError()
    })
  })

  test('world, entity, component lifecycle', () => {
    // uninitialized world
    world = new World()

    const componentInitFn = vi.fn()
    const componentDestroyFn = vi.fn()

    class TestComponentOne extends Component {
      onInit(): void {
        componentInitFn()
      }

      onDestroy(): void {
        componentDestroyFn()
      }
    }

    world.registerComponent(TestComponentOne)

    const entity = world.create()
    entity.add(TestComponentOne)

    expect(world.initialised).toBe(false)
    expect(componentInitFn).toHaveBeenCalledTimes(0)

    world.init()

    expect(world.initialised).toBe(true)
    expect(componentInitFn).toHaveBeenCalledTimes(1)

    entity.destroy()
    world.update(0)
    expect(componentDestroyFn).toHaveBeenCalledTimes(1)
  })

  describe('Component', () => {
    describe('get', () => {
      class TestComponentOne extends Component {}

      beforeEach(() => {
        world.registerComponent(TestComponentOne)
      })

      it('should throw an error if the component is not in the entity', () => {
        const entity = world.create()

        expect(() => entity.get(TestComponentOne)).toThrow()
      })

      it('should return the component instance if the component is in the entity', () => {
        const entity = world.create()

        entity.add(TestComponentOne)

        expect(entity.get(TestComponentOne)).toBeInstanceOf(TestComponentOne)
      })
    })

    describe('find', () => {
      class TestComponentOne extends Component {
        value = 0
      }

      beforeEach(() => {
        world.registerComponent(TestComponentOne)
      })

      it('should return undefined if the component is not in the entity', () => {
        const entity = world.create()

        const result = entity.find(TestComponentOne)

        expect(result).toBeUndefined()
      })

      it('should return the component instance if the component is in the entity', () => {
        const entity = world.create()

        entity.add(TestComponentOne)

        const result = entity.find(TestComponentOne)

        expect(result!.value).toBe(0)
        expect(result).toBeInstanceOf(TestComponentOne)
      })
    })
  })

  describe('Entity', () => {
    describe('has', () => {
      class TestComponentOne extends Component {}
      class TestComponentTwo extends Component {}

      beforeEach(() => {
        world.registerComponent(TestComponentOne)
        world.registerComponent(TestComponentTwo)
      })

      it('should return true if the entity has the given component', () => {
        const entity = world.create()

        entity.add(TestComponentOne)

        expect(entity.has(TestComponentOne)).toBe(true)
      })

      it('should return false if the entity does not have the given component', () => {
        const entity = world.create()

        entity.add(TestComponentOne)

        expect(entity.has(TestComponentOne)).toBe(true)
        expect(entity.has(TestComponentTwo)).toBe(false)

        entity.add(TestComponentTwo)

        expect(entity.has(TestComponentOne)).toBe(true)
        expect(entity.has(TestComponentTwo)).toBe(true)

        entity.remove(TestComponentOne)

        expect(entity.has(TestComponentOne)).toBe(false)
        expect(entity.has(TestComponentTwo)).toBe(true)

        entity.remove(TestComponentTwo)

        expect(entity.has(TestComponentOne)).toBe(false)
        expect(entity.has(TestComponentTwo)).toBe(false)
      })
    })

    describe('getAll', () => {
      class TestComponentOne extends Component {}
      class TestComponentTwo extends Component {}

      beforeEach(() => {
        world.registerComponent(TestComponentOne)
        world.registerComponent(TestComponentTwo)
      })

      it('should return an array containing all components in the entity', () => {
        const entity = world.create()

        expect(entity.getAll()).toEqual([])

        const testComponentOne = entity.add(TestComponentOne)

        expect(entity.getAll()).toEqual([testComponentOne])

        entity.remove(TestComponentOne)

        expect(entity.getAll()).toEqual([])
      })
    })
  })
})
