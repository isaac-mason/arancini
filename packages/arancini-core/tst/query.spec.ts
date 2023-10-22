import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import type { Entity, QueryDescription } from '../src'
import { Component, Query, System, World } from '../src'
import { getQueryDedupeString } from '../src/query-utils'

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

    world.registerComponent(TestComponentOne)
    world.registerComponent(TestComponentTwo)
    world.registerComponent(TestComponentThree)
    world.registerComponent(TestComponentFour)
    world.registerComponent(TestComponentFive)
    world.registerComponent(TestComponentSix)

    world.init()
  })

  test('should throw an error when attempting to create a query with no conditions', () => {
    try {
      world.query([])
      throw new Error('Expected an error to be thrown')
    } catch (e) {
      expect(e.message).toBe('Query must have at least one condition')
    }
  })

  test('world.filter', () => {
    const entityOne = world.create((e) => {
      e.add(TestComponentOne)
    })

    const entityTwo = world.create((e) => {
      e.add(TestComponentOne)
    })

    const queryResults = world.filter((entities) =>
      entities.with(TestComponentOne)
    )

    expect(queryResults).toBeTruthy()
    expect(queryResults.length).toBe(2)
    expect(queryResults.includes(entityOne)).toBeTruthy()
    expect(queryResults.includes(entityTwo)).toBeTruthy()
  })

  test('world.find', () => {
    const entityOne = world.create((e) => {
      e.add(TestComponentOne)
    })

    world.create((e) => {
      e.add(TestComponentOne)
    })

    const queryResult = world.find((entities) =>
      entities.with(TestComponentOne)
    )

    expect(queryResult).toBeTruthy()
    expect(queryResult).toBe(entityOne)
  })

  it('should be populated with existing entities on creation', () => {
    // query for TestComponentOne
    const description: QueryDescription = (entities) =>
      entities.with(TestComponentOne)

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
    const descriptionOne: QueryDescription = [TestComponentOne]

    const descriptionTwo: QueryDescription = (entities) =>
      entities.all(TestComponentOne)

    const descriptionThree: QueryDescription = [
      {
        all: [TestComponentOne],
      },
    ]

    const queryOne = world.query(descriptionOne)
    const queryTwo = world.query(descriptionTwo)
    const queryThree = world.query(descriptionThree)

    expect(queryOne).toBeTruthy()
    expect(queryTwo).toBeTruthy()
    expect(queryThree).toBeTruthy()

    expect(queryOne).toEqual(queryTwo)
    expect(queryTwo).toEqual(queryThree)
  })

  it('can be removed from a world', () => {
    // query for TestComponentOne
    const description: QueryDescription = (entities) =>
      entities.with(TestComponentOne)

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
    expect(query.entities.length).toBe(1)
    expect(query.entities.includes(entityOne)).toBeTruthy()
    expect(query.entities.includes(entityTwo)).toBeFalsy()

    // removing a query that isn't in the world is swallowed silently
    world.queryManager.removeQuery(
      new Query(
        {} as World,
        'some key not in the query manager',
        [],
        undefined!
      )
    )

    // removing an already removed query is swallowed silently
    world.queryManager.removeQuery(query)
  })

  describe('first', () => {
    it('should retrieve the first Entity in the Query, or null if no Entities match the query', () => {
      const description: QueryDescription = (entities) =>
        entities.with(TestComponentOne)

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
      // create an entity matching the query
      const entityOne = world.create()
      entityOne.add(TestComponentOne)

      // create another entity that matches the query
      const entityTwo = world.create()
      entityTwo.add(TestComponentOne)

      // get query results
      const queryResults = world.filter((entities) =>
        entities.with(TestComponentOne)
      )

      expect(queryResults).toBeTruthy()
      expect(queryResults.length).toBe(2)
      expect(queryResults.includes(entityOne)).toBeTruthy()
      expect(queryResults.includes(entityTwo)).toBeTruthy()
    })

    it('should reuse query results if the same query already exists', () => {
      const description: QueryDescription = (entities) =>
        entities.with(TestComponentOne)

      const entityOne = world.create()
      entityOne.add(TestComponentOne)

      const activeQuery = world.query(description)

      world.update()

      const entityTwo = world.create()
      entityTwo.add(TestComponentOne)

      const onceOffQueryResults = world.filter(description)

      const onceOffFindResult = world.find(description)

      // once-off query results should be the same as the active query results
      expect(onceOffQueryResults).toBeTruthy()
      expect(onceOffQueryResults.includes(entityOne)).toBeTruthy()
      expect(onceOffQueryResults.length).toBe(activeQuery.entities.length)
      
      expect(onceOffFindResult).toBe(activeQuery.first)
    })
  })

  describe('query evaluation', () => {
    it('should emit events when entities are added and removed from a query', () => {
      const onAddedHandlerOne = vi.fn()
      const onAddedHandlerTwo = vi.fn()

      const onRemovedHandlerOne = vi.fn()
      const onRemovedHandlerTwo = vi.fn()

      const query = world.query((q) => q.all(TestComponentOne))

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
        testQuery = this.query((q) => q.any(TestComponentOne, TestComponentTwo))

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
        world.queryManager.queries.get(system.testQuery.key)?.has(entity)
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
        testQuery = this.query((q) => q.not(TestComponentOne))

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
        testQuery = this.query((q) =>
          q.all(TestComponentOne, TestComponentTwo, TestComponentThree)
        )

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
        testQuery = this.query((q) =>
          q
            .all(TestComponentOne, TestComponentTwo)
            .any(TestComponentThree, TestComponentFour)
            .not(TestComponentFive, TestComponentSix)
        )

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
      const query = world.query((entities) => entities.with(TestComponentOne))

      expect(query.entities.length).toBe(0)

      // create entity that matches query
      const entityOne = world.create()
      entityOne.add(TestComponentOne)

      // create another entity that matches query
      const entityTwo = world.create()
      entityTwo.add(TestComponentOne)
      entityTwo.add(TestComponentTwo)

      expect(world.queryManager.queries.get(query.key)?.has(entityOne)).toBe(
        true
      )

      expect(world.queryManager.queries.get(query.key)?.has(entityTwo)).toBe(
        true
      )

      expect(query.entities.length).toBe(2)
      expect(query.entities.includes(entityOne)).toBeTruthy()
      expect(query.entities.includes(entityTwo)).toBeTruthy()

      // update, flushing added and removed
      world.update()

      // destroy entityOne, removing it from the query
      entityOne.destroy()

      expect(world.queryManager.queries.get(query.key)?.has(entityOne)).toBe(
        false
      )

      expect(world.queryManager.queries.get(query.key)?.has(entityTwo)).toBe(
        true
      )

      expect(query.entities.length).toBe(1)
      expect(query.entities.includes(entityOne)).toBeFalsy()
      expect(query.entities.includes(entityTwo)).toBeTruthy()
    })
  })

  describe('getDescriptionDedupeString', () => {
    it('should contain class names', () => {
      const query = world.query((entities) =>
        entities.with(TestComponentOne, TestComponentTwo)
      )

      expect(getQueryDedupeString(query.conditions)).toEqual('0,1')
    })

    it('should return the same key for two matching query descriptions', () => {
      const queryOne: QueryDescription = [
        {
          any: [TestComponentOne, TestComponentTwo],
        },
        {
          all: [TestComponentThree, TestComponentFour],
        },
        {
          not: [TestComponentFive, TestComponentSix],
        },
      ]

      const queryTwo: QueryDescription = [
        {
          not: [TestComponentSix, TestComponentFive],
        },
        {
          all: [TestComponentFour, TestComponentThree],
        },
        {
          any: [TestComponentTwo, TestComponentOne],
        },
      ]

      expect(getQueryDedupeString(queryOne)).toEqual(
        getQueryDedupeString(queryTwo)
      )
    })

    it('should return a different key for two different query descriptions', () => {
      const differentComponentsOne: QueryDescription = [
        {
          all: [TestComponentOne],
        },
      ]

      const differentComponentsTwo: QueryDescription = [
        {
          all: [TestComponentTwo],
        },
      ]

      expect(getQueryDedupeString(differentComponentsOne)).not.toEqual(
        getQueryDedupeString(differentComponentsTwo)
      )

      const differentConditionOne: QueryDescription = [
        {
          all: [TestComponentOne],
        },
      ]

      const differentConditionTwo: QueryDescription = [
        {
          not: [TestComponentOne],
        },
      ]

      expect(getQueryDedupeString(differentConditionOne)).not.toEqual(
        getQueryDedupeString(differentConditionTwo)
      )

      const partiallyDifferentOne: QueryDescription = [
        {
          all: [TestComponentOne],
        },
      ]

      const partiallyDifferentTwo: QueryDescription = [
        {
          all: [TestComponentOne],
        },
        {
          not: [TestComponentTwo],
        },
      ]

      expect(getQueryDedupeString(partiallyDifferentOne)).not.toEqual(
        getQueryDedupeString(partiallyDifferentTwo)
      )
    })
  })
})
