import { describe, expect, it } from 'vitest'
import { QueryBuilder } from '../src/query'
import { World } from '../src/world'

type Entity = {
  foo?: string
  bar?: number
}

describe('Queries', () => {
  it('should update queries as entity composition changes', () => {
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

    const entity = { foo: 'test' }

    world.create(entity)

    expect(added).toBe(1)

    world.add(entity, 'bar', 1)

    expect(removed).toBe(1)

    world.remove(entity, 'bar')

    expect(added).toBe(2)

    world.destroy(entity)

    expect(removed).toBe(2)
  })

  it('emits events when entities are added or removed from a query', () => {
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

  it('should update an entity in bulk when calling update', () => {
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

    const entity = world.create({})

    // add to query
    world.update(entity, (e) => {
      e.foo = 'test'
    })

    expect(added).toBe(1)
    expect(removed).toBe(0)

    // remove from query
    world.update(entity, {
      bar: 1,
    })

    expect(added).toBe(1)
    expect(removed).toBe(1)

    // add to query
    world.update(entity, (e) => {
      delete e.bar
    })

    expect(added).toBe(2)
    expect(removed).toBe(1)

    // remove from query
    world.update(entity, {
      bar: 1,
    })

    expect(added).toBe(2)
    expect(removed).toBe(2)

    // add to query
    world.update(entity, (e) => {
      e.bar = undefined
    })

    expect(added).toBe(3)
    expect(removed).toBe(2)

    // remove from query
    world.update(entity, {
      foo: undefined,
    })

    expect(added).toBe(3)
    expect(removed).toBe(3)
  })

  it('should update queries on removing entities from the world', () => {
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

    const entity = { foo: 'test' }

    world.create(entity)

    expect(added).toBe(1)

    world.destroyQuery(query)

    world.add(entity, 'bar', 1)

    expect(removed).toBe(0)
  })

  it('supports ad-hoc queries', () => {
    const world = new World<Entity>()

    const query = (e: QueryBuilder<Entity>) => e.has('foo').but.not('bar')

    const entity = { foo: 'test' }

    world.create(entity)

    let resultEntities = world.filter(query)
    let resultEntity = world.find(query)

    expect(resultEntities.length).toBe(1)
    expect(resultEntity).toBe(entity)

    world.add(entity, 'bar', 1)

    resultEntities = world.filter(query)
    resultEntity = world.find(query)

    expect(resultEntities.length).toBe(0)
    expect(resultEntity).toBe(undefined)
  })

  it('should reuse existing equivalent queries for ad-hoc queries', () => {
    const world = new World<Entity>()

    const queryDescription = (e: QueryBuilder<Entity>) => e.has('foo', 'bar')

    const query = world.query(queryDescription)

    const entity = { foo: 'test' }
    world.create(entity)

    const resultEntities = world.filter(queryDescription)
    const resultEntity = world.find(queryDescription)

    expect(query.entities).toBe(resultEntities)
    expect(query.first).toBe(resultEntity)
  })

  it('supports iterating over query results in reverse order with Symbol.iterator', () => {
    const world = new World<Entity>()

    const entityOne = { foo: 'test' }
    const entityTwo = { foo: 'test' }

    world.create(entityOne)
    world.create(entityTwo)

    const query = world.query((q) => q.has('foo'))

    const entities = [...query]

    expect(entities.length).toBe(2)
    expect(entities[0]).toBe(entityTwo)
    expect(entities[1]).toBe(entityOne)
  })

  it('should reuse existing equivalent queries', () => {
    const world = new World<Entity>()

    const queryOne = world.query((q) => q.has('foo', 'bar'))
    const queryTwo = world.query((q) => q.has('foo').and.has('bar'))

    expect(queryOne).toBe(queryTwo)
  })

  it('supports the "any" condition type', () => {
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

  it('supports the "not" condition type', () => {
    const world = new World<Entity>()

    const query = world.query((q) => q.not('foo'))

    const entityOne = { bar: 1 }
    world.create(entityOne)

    expect(query.entities.length).toBe(1)

    world.add(entityOne, 'foo', 'test')

    expect(query.entities.length).toBe(0)
  })

  it('supports multiple conditions', () => {
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
})
