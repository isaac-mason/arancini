import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import { Component, World } from '../src'

describe('Components', () => {
  let world: World

  beforeEach(() => {
    world = new World()

    world.init()
  })

  describe('object', () => {
    test('should define a component with the provided type', () => {
      const TestComponent = Component.data<{ x: number; y: number }>()

      world.registerComponent(TestComponent)

      const entity = world.create()
      const testComponent = entity.add(TestComponent, { x: 1, y: 2 })

      expect(testComponent.x).toBe(1)
      expect(testComponent.y).toBe(2)
    })
  })

  describe('lifecycle methods', () => {
    it('will initialise entity components on initialising an entity', () => {
      world = new World()

      const onInit = vi.fn()
      class TestComponent extends Component {
        onInit() {
          onInit()
        }
      }

      world.registerComponent(TestComponent)

      const entity = world.create()
      entity.add(TestComponent)

      expect(onInit).toBeCalledTimes(0)

      world.init()

      expect(onInit).toBeCalledTimes(1)
    })

    it('will call component onInit and onDestroy methods', () => {
      const componentInitJestFn = vi.fn()
      const componentDestroyJestFn = vi.fn()

      class TestComponentOne extends Component {
        onInit(): void {
          componentInitJestFn()
        }

        onDestroy(): void {
          componentDestroyJestFn()
        }
      }

      world.registerComponent(TestComponentOne)

      const entity = world.create()
      entity.add(TestComponentOne)
      expect(world.initialised).toBe(true)
      expect(componentInitJestFn).toHaveBeenCalledTimes(1)

      entity.destroy()
      world.update(0)
      expect(componentDestroyJestFn).toHaveBeenCalledTimes(1)
    })
  })

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
    class TestComponentOne extends Component {}

    beforeEach(() => {
      world.registerComponent(TestComponentOne)
    })

    it('should return undefined if the component is not in the entity', () => {
      const entity = world.create()

      expect(entity.find(TestComponentOne)).toBeUndefined()
    })

    it('should return the component instance if the component is in the entity', () => {
      const entity = world.create()

      entity.add(TestComponentOne)

      expect(entity.find(TestComponentOne)).toBeInstanceOf(TestComponentOne)
    })
  })

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

      const componentTwo = entity.add(TestComponentTwo)

      expect(entity.has(TestComponentOne)).toBe(true)
      expect(entity.has(TestComponentTwo)).toBe(true)

      entity.remove(TestComponentOne)

      expect(entity.has(TestComponentOne)).toBe(false)
      expect(entity.has(TestComponentTwo)).toBe(true)

      entity.remove(componentTwo)

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

      entity.add(TestComponentOne)

      expect(entity.getAll()).toEqual([expect.any(TestComponentOne)])

      entity.remove(TestComponentOne)

      expect(entity.getAll()).toEqual([])
    })
  })
})
