import { beforeEach, describe, expect, test } from 'vitest'
import { Component, World } from '../src'

describe('Entity', () => {
  let world: World

  beforeEach(() => {
    world = new World()

    world.init()
  })

  test('creating and destroying', () => {
    const entity = world.create()
    const { id } = entity

    entity.destroy()

    // assert the entity has been reset
    expect(entity.id).not.toEqual(id)
    expect(world.entities.has(entity.id)).toBe(false)
  })

  test('creating with initial components', () => {
    class TestComponent extends Component {}

    world.registerComponent(TestComponent)

    const query = world.query([TestComponent])

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
      const entityTwo = world.create()

      // add TestComponentOne to entities
      const testComponentOne = entityOne.add(TestComponentOne)
      entityTwo.add(TestComponentOne)
      expect(entityOne.has(TestComponentOne)).toBeTruthy()
      expect(entityOne.has(TestComponentTwo)).toBeFalsy()
      expect(entityTwo.has(TestComponentOne)).toBeTruthy()
      expect(entityTwo.has(TestComponentTwo)).toBeFalsy()

      // remove component by instance
      entityOne.remove(testComponentOne)

      // remove component by component class
      entityTwo.remove(TestComponentOne)
      expect(entityOne.has(TestComponentOne)).toBeFalsy()
      expect(entityTwo.has(TestComponentOne)).toBeFalsy()
      expect(entityOne.has(TestComponentTwo)).toBeFalsy()
      expect(entityTwo.has(TestComponentTwo)).toBeFalsy()

      // add TestComponentOne components back
      entityOne.add(TestComponentOne)
      entityTwo.add(TestComponentOne)
      expect(entityOne.has(TestComponentOne)).toBeTruthy()
      expect(entityTwo.has(TestComponentOne)).toBeTruthy()
      expect(entityOne.has(TestComponentTwo)).toBeFalsy()
      expect(entityTwo.has(TestComponentTwo)).toBeFalsy()
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

      const otherEntity = world.create()
      const component = otherEntity.add(TestComponentOne)

      expect(() => entity.remove(component)).toThrowError()
    })
  })
})
