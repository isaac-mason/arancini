import { describe, expect, test } from 'vitest'
import { World } from '../src'

type Entity = {
  foo?: string
  bar?: number
  car?: number
}

describe('World', () => {
  describe('iteration', () => {
    test('world Symbol.iterator', () => {
      const world = new World<Entity>()

      const entityOne = { foo: 'test' }
      const entityTwo = { foo: 'test' }

      world.create(entityOne)
      world.create(entityTwo)

      const entities = [...world]

      expect(entities.length).toBe(2)
      expect(entities[1]).toBe(entityOne)
      expect(entities[0]).toBe(entityTwo)
    })

    test('query Symbol.iterator', () => {
      const world = new World<Entity>()

      const entityOne = { foo: 'test' }
      const entityTwo = { foo: 'test' }

      world.create(entityOne)
      world.create(entityTwo)

      const query = world.query((q) => q.has('foo'))

      const entities = [...query]

      expect(entities.length).toBe(2)
      expect(entities[1]).toBe(entityOne)
      expect(entities[0]).toBe(entityTwo)
    })
  })

  describe('query creation and destruction', () => {
    test('throws an error when creating invalid queries', () => {
      const world = new World<Entity>()

      expect(() => {
        world.query((() => {}) as any)
      }).toThrow()

      expect(() => {
        world.query((q) => q.all())
      }).toThrow()
    })

    test('creates a new query if no equivalent query exists', () => {
      const world = new World<Entity>()

      const queryOne = world.query((q) => q.has('foo'))
      const queryTwo = world.query((q) => q.has('foo', 'bar'))

      expect(queryOne).not.toBe(queryTwo)
    })

    test('reuses existing equivalent queries', () => {
      const world = new World<Entity>()

      const allQueryOne = world.query((q) => q.has('foo', 'bar'))
      const allQueryTwo = world.query((q) => q.has('foo').and.has('bar'))

      expect(allQueryOne).toBe(allQueryTwo)

      const notQueryOne = world.query((q) => q.has('foo').but.not('bar', 'car'))
      const notQueryTwo = world.query((q) => q.has('foo').but.not('bar').and.not('car'))

      expect(notQueryOne).toBe(notQueryTwo)
    })

    test('queries should be removed if there are no remaining references', () => {
      const world = new World<Entity>()

      const query = world.query((q) => q.has('foo'))

      expect(world.queries.length).toBe(1)

      world.destroyQuery(query)

      expect(world.queries.length).toBe(0)
    })

    test('queries should not be destroyed if there are remaining references', () => {
      const world = new World<Entity>()

      const queryHandle = 'test'

      const queryOne = world.query((q) => q.has('foo'), { handle: queryHandle })

      const queryTwo = world.query((q) => q.has('foo'))

      expect(world.queries.length).toBe(1)

      world.destroyQuery(queryTwo)

      expect(world.queries.length).toBe(1)

      world.destroyQuery(queryOne, { handle: queryHandle })

      expect(world.queries.length).toBe(0)
    })

    test('destroying a query not in the world should noop', () => {
      const world = new World<Entity>()

      const query = world.query((q) => q.has('foo'))

      const otherWorld = new World<Entity>()

      otherWorld.destroyQuery(query)

      expect(world.queries.length).toBe(1)
    })

    test('supports noop grammar', () => {
      const world = new World<Entity>()

      const query = world.query((q) => q.and.but.where.are.and.has('foo'))

      const entity = { foo: 'test' }
      world.create(entity)

      expect(query.entities.length).toBe(1)
    })
  })

  describe('query evaluation', () => {
    test('"all" condition', () => {
      const world = new World<Entity>()

      const query = world.query((q) => q.all('foo', 'bar'))

      const entity = { foo: 'test', bar: 1 }
      world.create(entity)

      expect(query.entities.length).toBe(1)

      world.remove(entity, 'foo')

      expect(query.entities.length).toBe(0)
    })

    test('"any" condition', () => {
      const world = new World<Entity>()

      const query = world.query((q) => q.any('foo', 'bar'))

      const entityOne = { foo: 'test' }
      world.create(entityOne)

      expect(query.entities.length).toBe(1)
      expect(query.entities[0]).toBe(entityOne)

      const entityTwo = { bar: 1 }
      world.create(entityTwo)

      expect(query.entities.length).toBe(2)
      expect(query.entities[1]).toBe(entityTwo)

      world.remove(entityOne, 'foo')

      expect(query.entities.length).toBe(1)
      expect(query.entities[0]).toBe(entityTwo)

      world.destroy(entityTwo)

      expect(query.entities.length).toBe(0)
    })

    test('"not" condition', () => {
      const world = new World<Entity>()

      const query = world.query((q) => q.not('foo'))

      const entityOne = { bar: 1 }
      world.create(entityOne)

      expect(query.entities.length).toBe(1)

      world.add(entityOne, 'foo', 'test')

      expect(query.entities.length).toBe(0)
    })

    test('multiple conditions', () => {
      type EntityWithManyComponents = {
        one?: string
        two?: string
        three?: string
        four?: string
        five?: string
      }
      const world = new World<EntityWithManyComponents>()

      const query = world.query((q) =>
        q.all('one', 'two').and.any('three', 'four').but.not('five')
      )

      const entity = {
        one: 'test',
        two: 'test',
        three: 'test',
      }

      world.create(entity)

      expect(query.entities.length).toBe(1)
    })

    test('existing entities should be added to new queries', () => {
      const world = new World<Entity>()

      const entity = { foo: 'test' }
      world.create(entity)

      const query = world.query((q) => q.has('foo'))

      expect(query.entities.length).toBe(1)
      expect(query.entities[0]).toBe(entity)
    })

    test('removing an entity from the world removes it from all queries', () => {
      const world = new World<Entity>()

      const query = world.query((q) => q.has('foo'))

      const entityOne = {}
      world.create(entityOne)

      const entityTwo = { foo: 'test' }
      world.create(entityTwo)

      expect(query.entities).toHaveLength(1)

      world.add(entityOne, 'foo', '')

      expect(query.entities).toHaveLength(2)

      world.destroy(entityOne)

      expect(query.entities).toHaveLength(1)
    })

    test('when adding or removing multiple components with world.update queries should only be updated once', () => {
      const world = new World<Entity>()

      const query = world.query((q) => q.has('foo').but.not('bar'))

      let added = 0
      let removed = 0

      query.onEntityAdded.add(() => {
        added++
      })

      query.onEntityRemoved.add(() => {
        removed++
      })

      // adding in series
      const entityOne = world.create({})

      world.add(entityOne, 'foo', 'test')
      world.add(entityOne, 'bar', 1)

      expect(added).toBe(1)
      expect(removed).toBe(1)

      // adding in bulk - should not update query
      const entityTwo = { foo: 'test', bar: 1 }
      world.create(entityTwo)

      expect(added).toBe(1)
      expect(removed).toBe(1)
      expect(query.has(entityTwo)).toBe(false)
    })
  })

  describe('query events', () => {
    test('events are emitted when entities are added or removed from a query', () => {
      const world = new World<Entity>()

      const query = world.query((q) => q.has('foo'))

      const addEvents: Entity[] = []
      const removeEvents: Entity[] = []

      query.onEntityAdded.add((entity) => {
        addEvents.push({ ...entity })
      })

      query.onEntityRemoved.add((entity) => {
        removeEvents.push({ ...entity })
      })

      const entity = {}
      world.create(entity)

      expect(query.entities).toHaveLength(0)

      // add to query
      world.add(entity, 'foo', '')

      expect(query.first).toEqual({ foo: '' })
      expect(query.entities).toHaveLength(1)

      // remove from query
      world.remove(entity, 'foo')

      expect(query.entities).toHaveLength(0)

      // add to query
      world.update(entity, { foo: '' })

      expect(query.first).toEqual({ foo: '' })
      expect(query.entities).toHaveLength(1)

      // remove from query
      world.update(entity, { foo: undefined })

      expect(query.entities).toHaveLength(0)

      // add to query
      world.update(entity, (e) => {
        e.foo = ''
      })

      expect(query.first).toEqual({ foo: '' })
      expect(query.entities).toHaveLength(1)

      // remove from query
      world.update(entity, (e) => {
        e.foo = undefined
      })

      expect(query.entities).toHaveLength(0)

      expect(addEvents.length).toBe(3)
      expect(addEvents.every((e) => e.foo === '')).toBe(true)

      expect(removeEvents.length).toBe(3)
      expect(removeEvents.every((e) => e.foo !== undefined)).toBe(true)
    })
  })

  describe('world.filter', () => {
    test('returns all entities that match the query', () => {
      const world = new World<Entity>()

      const entityOne = { foo: 'test' }
      const entityTwo = { foo: 'test' }

      world.create(entityOne)
      world.create(entityTwo)

      const entities = world.filter((q) => q.has('foo'))

      expect(entities.length).toBe(2)
      expect(entities[0]).toBe(entityOne)
      expect(entities[1]).toBe(entityTwo)
    })

    test('reuses existing equivalent queries', () => {
      const world = new World<Entity>()

      const queryOne = world.query((q) => q.has('foo', 'bar'))

      world.create({ foo: 'test', bar: 1 })

      const result = world.filter((q) => q.has('foo', 'bar'))

      expect(queryOne.entities).toEqual(result)
    })

    test('returns an empty array if no entities match the query', () => {
      const world = new World<Entity>()

      const entities = world.filter((q) => q.has('foo'))

      expect(entities).toEqual([])
    })
  })

  describe('world.find', () => {
    test('returns the first entity that matches the query', () => {
      const world = new World<Entity>()

      const entityOne = { foo: 'test' }
      const entityTwo = { foo: 'test' }

      world.create(entityOne)
      world.create(entityTwo)

      const entity = world.find((q) => q.has('foo'))

      expect(entity).toBe(entityOne)
    })

    test('reuses existing equivalent queries', () => {
      const world = new World<Entity>()

      const queryOne = world.query((q) => q.has('foo', 'bar'))

      world.create({ foo: 'test', bar: 1 })

      const result = world.find((q) => q.has('foo', 'bar'))

      expect(queryOne.first).toBe(result)
    })

    test('returns undefined if no entity matches the query', () => {
      const world = new World<Entity>()

      const entity = world.find((q) => q.has('foo'))

      expect(entity).toBe(undefined)
    })
  })

  describe('world.clear', () => {
    test('removes all entities', () => {
      const world = new World<Entity>()

      const query = world.query((q) => q.has('foo'))

      world.create({ foo: 'test' })
      world.create({ foo: 'test' })

      expect(world.entities.length).toBe(2)
      expect(query.entities.length).toBe(2)
      expect(world.queries.length).toBe(1)

      world.clear()

      console.log(world.entities)

      expect(world.entities.length).toBe(0)
      expect(query.entities.length).toBe(0)
      expect(world.queries.length).toBe(1)
    })
  })
})
