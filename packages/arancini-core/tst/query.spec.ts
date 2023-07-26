import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Entity, QueryDescription } from '../src'
import { Component, Query, System, World } from '../src'

class TestComponentOne extends Component {}
class TestComponentTwo extends Component {}
class TestComponentThree extends Component {}
class TestComponentFour extends Component {}
class TestComponentFive extends Component {}
class TestComponentSix extends Component {}

describe('Query', () => {
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
  })

  it('should throw an error when attempting to create a query with no conditions', () => {
    expect(() => {
      world.query({})
    }).toThrow()
  })

  it('should be populated with existing entities on creation', () => {
    // query for TestComponentOne
    const description: QueryDescription = {
      all: [TestComponentOne],
    }

    // create entity matching query
    const entity = world.create()
    entity.add(TestComponentOne)

    // create query
    const query = world.query(description)

    // query is populated with existing entity
    expect(query).toBeTruthy()
    expect(query.entities.length).toBe(1)
    expect(query.entities.includes(entity)).toBeTruthy()
  })

  it('should reuse existing equivalent queries', () => {
    const descriptionOne: QueryDescription = {
      all: [TestComponentOne],
    }

    const descriptionTwo: QueryDescription = [TestComponentOne]

    const queryOne = world.query(descriptionOne)
    const queryTwo = world.query(descriptionTwo)

    expect(queryOne).toBeTruthy()
    expect(queryTwo).toBeTruthy()

    expect(queryOne).toEqual(queryTwo)
  })

  it('can be removed from a world', () => {
    // query for TestComponentOne
    const description: QueryDescription = {
      all: [TestComponentOne],
    }
    const query = world.query(description)

    // create entity matching the query
    const entityOne = world.create()
    entityOne.add(TestComponentOne)

    // entity should be updated
    expect(query).toBeTruthy()
    expect(query.entities.length).toBe(1)
    expect(query.entities.includes(entityOne)).toBeTruthy()

    // remove the query
    query.destroy()

    // creating an entity matching the removed query should not update the query
    const entityTwo = world.create()
    entityTwo.add(TestComponentOne)
    expect(query).toBeTruthy()
    expect(query.entities.length).toBe(1)
    expect(query.entities.includes(entityOne)).toBeTruthy()
    expect(query.entities.includes(entityTwo)).toBeFalsy()

    // removing a query that isn't in the world is swallowed silently
    world.queryManager.removeQuery(
      new Query({} as World, 'some key not in the query manager')
    )

    // removing an already removed query is swallowed silently
    world.queryManager.removeQuery(query)
  })

  describe('first', () => {
    it('should retrieve the first Entity in the Query, or null if no Entities match the query', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      }

      const entityOne = world.create()
      entityOne.add(TestComponentOne)

      const entityTwo = world.create()
      entityTwo.add(TestComponentOne)

      const query = world.query(description)

      expect(query.first).toBe(entityOne)

      entityOne.destroy()
      entityTwo.destroy()

      expect(query.first).toBe(undefined)
    })
  })

  describe('query creation', () => {
    it('should generate new query results if the same query does not already exists', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      }

      // create an entity matching the query
      const entityOne = world.create()
      entityOne.add(TestComponentOne)

      // create another entity that matches the query
      const entityTwo = world.create()
      entityTwo.add(TestComponentOne)

      // get query results
      const queryResults = world.find(description)
      expect(queryResults).toBeTruthy()
      expect(queryResults.length).toBe(2)
      expect(queryResults.includes(entityOne)).toBeTruthy()
      expect(queryResults.includes(entityTwo)).toBeTruthy()
    })

    it('should reuse query results if the same query already exists', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      }

      const entityOne = world.create()
      entityOne.add(TestComponentOne)

      const activeQuery = world.query(description)

      world.update()

      const entityTwo = world.create()
      entityTwo.add(TestComponentOne)

      const onceOffQueryResults = world.find(description)

      // once-off query results should be the same as the active query results
      expect(onceOffQueryResults).toBeTruthy()
      expect(onceOffQueryResults.includes(entityOne)).toBeTruthy()
      expect(onceOffQueryResults.length).toBe(activeQuery.entities.length)
    })
  })

  describe('query evaluation', () => {
    it('should emit events when entities are added and removed from a query', () => {
      const onAddedHandlerOne = vi.fn()
      const onAddedHandlerTwo = vi.fn()

      const onRemovedHandlerOne = vi.fn()
      const onRemovedHandlerTwo = vi.fn()

      const query = world.query([TestComponentOne])

      query.onEntityAdded.add(onAddedHandlerOne)
      query.onEntityRemoved.add(onRemovedHandlerOne)
      query.onEntityAdded.add(onAddedHandlerTwo)
      query.onEntityRemoved.add(onRemovedHandlerTwo)

      const entityOne = world.create()
      entityOne.add(TestComponentOne)

      expect(onAddedHandlerOne.mock.calls.length).toBe(1)
      expect(onAddedHandlerOne.mock.calls[0][0]).toBe(entityOne)
      expect(onAddedHandlerTwo.mock.calls.length).toBe(1)
      expect(onAddedHandlerTwo.mock.calls[0][0]).toBe(entityOne)

      entityOne.remove(TestComponentOne)

      expect(onRemovedHandlerOne.mock.calls.length).toBe(1)
      expect(onRemovedHandlerOne.mock.calls[0][0]).toBe(entityOne)
      expect(onRemovedHandlerTwo.mock.calls.length).toBe(1)
      expect(onRemovedHandlerTwo.mock.calls[0][0]).toBe(entityOne)

      query.onEntityAdded.remove(onAddedHandlerTwo)
      query.onEntityRemoved.remove(onRemovedHandlerTwo)

      const entityTwo = world.create()
      entityTwo.add(TestComponentOne)

      expect(onAddedHandlerOne.mock.calls.length).toBe(2)
      expect(onAddedHandlerOne.mock.calls[1][0]).toBe(entityTwo)
      expect(onAddedHandlerTwo.mock.calls.length).toBe(1)

      entityTwo.remove(TestComponentOne)

      expect(onRemovedHandlerOne.mock.calls.length).toBe(2)
      expect(onRemovedHandlerOne.mock.calls[1][0]).toBe(entityTwo)
      expect(onRemovedHandlerTwo.mock.calls.length).toBe(1)
    })

    it('updates system query results if an entity matches a query with the ANY condition', () => {
      const onAddedFn = vi.fn()
      const onRemovedFn = vi.fn()
      class TestSystem extends System {
        testQuery = this.query({ any: [TestComponentOne, TestComponentTwo] })

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

      const entity = world.create()
      entity.add(TestComponentOne)

      expect(system.testQuery.entities.length).toBe(1)
      expect(system.testQuery.entities.includes(entity)).toBeTruthy()

      expect(onAddedFn.mock.calls.length).toBe(1)
      expect(onAddedFn.mock.calls[0][0]).toBe(entity)
      expect(onRemovedFn.mock.calls.length).toBe(0)

      entity.remove(TestComponentOne)

      expect(
        world.queryManager.dedupedQueries
          .get(system.testQuery.key)
          ?.entitySet.has(entity)
      ).toBe(false)

      expect(system.testQuery.entities.length).toBe(0)
      expect(system.testQuery.entities.includes(entity)).toBeFalsy()

      expect(onAddedFn.mock.calls.length).toBe(1)
      expect(onRemovedFn.mock.calls.length).toBe(1)
      expect(onRemovedFn.mock.calls[0][0]).toBe(entity)
    })

    it('updates system query results if an entity matches a query with the NOT condition', () => {
      const onAddedFn = vi.fn()
      const onRemovedFn = vi.fn()
      class TestSystem extends System {
        testQuery = this.query({ not: [TestComponentOne] })

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

      const entity = world.create()
      entity.add(TestComponentTwo)

      expect(system.testQuery.entities.length).toBe(1)
      expect(system.testQuery.entities.includes(entity)).toBeTruthy()

      expect(onAddedFn.mock.calls.length).toBe(1)
      expect(onAddedFn.mock.calls[0][0]).toBe(entity)
      expect(onRemovedFn.mock.calls.length).toBe(0)

      entity.add(TestComponentOne)

      expect(system.testQuery.entities.length).toBe(0)
      expect(system.testQuery.entities.includes(entity)).toBeFalsy()

      expect(onAddedFn.mock.calls.length).toBe(1)
      expect(onRemovedFn.mock.calls.length).toBe(1)
      expect(onRemovedFn.mock.calls[0][0]).toBe(entity)
    })

    it('updates system query results if an entity matches a query with the ALL condition', () => {
      const onAddedFn = vi.fn()
      const onRemovedFn = vi.fn()
      class TestSystem extends System {
        testQuery = this.query([
          TestComponentOne,
          TestComponentTwo,
          TestComponentThree,
        ])

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

      const entity = world.create()
      entity.add(TestComponentOne)
      entity.add(TestComponentTwo)
      entity.add(TestComponentThree)

      expect(system.testQuery.entities.length).toBe(1)
      expect(system.testQuery.entities.includes(entity)).toBeTruthy()

      expect(onAddedFn.mock.calls.length).toBe(1)
      expect(onAddedFn.mock.calls[0][0]).toBe(entity)
      expect(onRemovedFn.mock.calls.length).toBe(0)

      entity.remove(TestComponentThree)

      expect(system.testQuery.entities.length).toBe(0)
      expect(system.testQuery.entities.includes(entity)).toBeFalsy()

      expect(onAddedFn.mock.calls.length).toBe(1)
      expect(onRemovedFn.mock.calls.length).toBe(1)
      expect(onRemovedFn.mock.calls[0][0]).toBe(entity)
    })

    it('updates system query results if an entity matches a query with multiple conditions', () => {
      const onAddedFn = vi.fn()
      const onRemovedFn = vi.fn()
      class TestSystem extends System {
        testQuery = this.query({
          all: [TestComponentOne, TestComponentTwo],
          any: [TestComponentThree, TestComponentFour],
          not: [TestComponentFive, TestComponentSix],
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

      const entity = world.create()
      entity.add(TestComponentOne)
      entity.add(TestComponentTwo)
      entity.add(TestComponentFour)

      expect(system.testQuery.entities.length).toBe(1)
      expect(system.testQuery.entities.includes(entity)).toBeTruthy()

      expect(onAddedFn.mock.calls.length).toBe(1)
      expect(onAddedFn.mock.calls[0][0]).toBe(entity)
      expect(onRemovedFn.mock.calls.length).toBe(0)
    })

    it('should remove destroyed entities from all queries', () => {
      // query for TestComponentOne
      const description: QueryDescription = {
        all: [TestComponentOne],
      }
      const query = world.query(description)

      expect(query.entities.length).toBe(0)

      // create entity that matches query
      const entityOne = world.create()
      entityOne.add(TestComponentOne)

      // create another entity that matches query
      const entityTwo = world.create()
      entityTwo.add(TestComponentOne)
      entityTwo.add(TestComponentTwo)

      expect(
        world.queryManager.dedupedQueries
          .get(query.key)
          ?.entitySet.has(entityOne)
      ).toBe(true)

      expect(
        world.queryManager.dedupedQueries
          .get(query.key)
          ?.entitySet.has(entityTwo)
      ).toBe(true)

      expect(query.entities.length).toBe(2)
      expect(query.entities.includes(entityOne)).toBeTruthy()
      expect(query.entities.includes(entityTwo)).toBeTruthy()

      // update, flushing added and removed
      world.update()

      // destroy entityOne, removing it from the query
      entityOne.destroy()

      expect(
        world.queryManager.dedupedQueries
          .get(query.key)
          ?.entitySet.has(entityOne)
      ).toBe(false)

      expect(
        world.queryManager.dedupedQueries
          .get(query.key)
          ?.entitySet.has(entityTwo)
      ).toBe(true)

      expect(query.entities.length).toBe(1)
      expect(query.entities.includes(entityOne)).toBeFalsy()
      expect(query.entities.includes(entityTwo)).toBeTruthy()
    })
  })

  describe('getDescriptionDedupeString', () => {
    it('should contain class names', () => {
      const queryOne: QueryDescription = {
        all: [TestComponentOne, TestComponentTwo],
      }

      expect(Query.getDescriptionDedupeString(queryOne)).toEqual(
        'TestComponentOne&TestComponentTwo'
      )
    })

    it('should return the same key for two matching query descriptions', () => {
      const queryOne: QueryDescription = {
        any: [TestComponentOne, TestComponentTwo],
        all: [TestComponentThree, TestComponentFour],
        not: [TestComponentFive, TestComponentSix],
      }

      const queryTwo: QueryDescription = {
        not: [TestComponentSix, TestComponentFive],
        all: [TestComponentFour, TestComponentThree],
        any: [TestComponentTwo, TestComponentOne],
      }

      expect(Query.getDescriptionDedupeString(queryOne)).toEqual(
        Query.getDescriptionDedupeString(queryTwo)
      )
    })

    it('should return a different key for two different query descriptions', () => {
      const differentComponentsOne: QueryDescription = {
        all: [TestComponentOne, TestComponentTwo],
      }

      const differentComponentsTwo: QueryDescription = {
        all: [TestComponentOne],
      }

      expect(
        Query.getDescriptionDedupeString(differentComponentsOne)
      ).not.toEqual(Query.getDescriptionDedupeString(differentComponentsTwo))

      const differentConditionOne: QueryDescription = {
        all: [TestComponentOne],
      }

      const differentConditionTwo: QueryDescription = {
        not: [TestComponentOne],
      }

      expect(
        Query.getDescriptionDedupeString(differentConditionOne)
      ).not.toEqual(Query.getDescriptionDedupeString(differentConditionTwo))

      const partiallyDifferentOne: QueryDescription = {
        all: [TestComponentOne],
      }

      const partiallyDifferentTwo: QueryDescription = {
        all: [TestComponentOne],
        not: [TestComponentTwo],
      }

      expect(
        Query.getDescriptionDedupeString(partiallyDifferentOne)
      ).not.toEqual(Query.getDescriptionDedupeString(partiallyDifferentTwo))
    })
  })
})
