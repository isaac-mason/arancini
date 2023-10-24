import { System, World } from '@arancini/core'
import '@testing-library/jest-dom'
import { act, render, renderHook } from '@testing-library/react'
import React, { forwardRef, useImperativeHandle } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createECS } from '../src'

type Entity = {
  foo?: boolean
  bar?: string
}

describe('createECS', () => {
  it('should be truthy', () => {
    const world = new World<Entity>({ components: ['foo', 'bar'] })
    world.init()

    const ECS = createECS(world)

    expect(ECS).toBeTruthy()
    expect(ECS.world).toBeTruthy()
  })

  describe('<Entity />', () => {
    it('should create an entity', () => {
      const world = new World<Entity>({ components: ['foo', 'bar'] })
      world.init()

      const ECS = createECS(world)

      render(<ECS.Entity />)

      expect(world.entities.length).toBe(1)
    })

    it('should support taking an existing entity via props', () => {
      const world = new World<Entity>({ components: ['foo', 'bar'] })
      world.init()

      const ECS = createECS(world)

      const entity = world.create({})

      render(<ECS.Entity entity={entity} />)

      expect(world.entities.length).toBe(1)
      expect(world.has(entity)).toBe(true)
    })

    it('supports refs', () => {
      const world = new World<Entity>({ components: ['foo', 'bar'] })
      world.init()

      const ECS = createECS(world)

      const ref = React.createRef<Entity>()
      const entity = world.create({})

      render(<ECS.Entity ref={ref} entity={entity} />)

      expect(ref.current).not.toBeNull()
      expect(ref.current).toBe(entity)
    })
  })

  describe('<Entities />', () => {
    it('should add components to entities', () => {
      const world = new World<Entity>({ components: ['foo', 'bar'] })
      world.init()

      const ECS = createECS(world)

      const entities = [world.create({}), world.create({}), world.create({})]

      render(
        <ECS.Entities entities={entities}>
          <ECS.Component name="foo" data={true} />
        </ECS.Entities>
      )

      expect(entities.every((entity) => !!entity.foo)).toBe(true)
    })
  })

  describe('<QueryEntities />', () => {
    it('should render entities that match the query description', () => {
      const world = new World<Entity>({ components: ['foo', 'bar'] })
      world.init()

      const ECS = createECS(world)

      const entities = [world.create({}), world.create({}), world.create({})]

      world.update(entities[0], (e) => {
        e.foo = true
      })

      world.update(entities[1], (e) => {
        e.foo = true
      })

      render(
        <ECS.QueryEntities query={(e) => e.has('foo')}>
          <ECS.Component name="bar" data="123" />
        </ECS.QueryEntities>
      )

      expect(!!entities[0].bar).toBe(true)
      expect(!!entities[1].bar).toBe(true)
      expect(!!entities[2].bar).toBe(false)

      act(() => {
        world.add(entities[2], 'foo', true)
      })

      expect(!!entities[2].bar).toBe(true)

      act(() => {
        world.remove(entities[2], 'foo')
      })

      expect(!!entities[2].bar).toBe(false)
    })
  })

  describe('<Component />', () => {
    it('should add and remove the given component to an entity', () => {
      const world = new World<Entity>({ components: ['foo', 'bar'] })
      world.init()

      const ECS = createECS(world)

      const entity = world.create({})

      const { unmount } = render(
        <ECS.Entity entity={entity}>
          <ECS.Component name="foo" data={true} />
        </ECS.Entity>
      )

      expect(entity.foo).toBe(true)

      act(() => {
        unmount()
      })

      expect(!!entity.foo).toBe(false)
    })

    it('should capture child ref and use it as a component arg', () => {
      const world = new World<Entity>({ components: ['foo', 'bar'] })
      world.init()

      const ECS = createECS(world)

      const entity = world.create({})

      const refValue = 'refValue'

      const TestComponentWithRef = forwardRef((_props, ref) => {
        useImperativeHandle(ref, () => refValue)
        return null
      })

      render(
        <ECS.Entity entity={entity}>
          <ECS.Component name="bar">
            <TestComponentWithRef />
          </ECS.Component>
        </ECS.Entity>
      )

      expect(entity.bar).toBe(refValue)
    })
  })

  describe('useQuery', () => {
    it('should return a reactive query instance when given a query description', () => {
      const world = new World<Entity>({ components: ['foo', 'bar'] })
      world.init()

      const ECS = createECS(world)

      const entities = [world.create({}), world.create({}), world.create({})]

      entities.forEach((e) => {
        world.add(e, 'foo', true)
      })

      const { result } = renderHook(() => ECS.useQuery((e) => e.has('foo')))

      expect(result.current.entities).toEqual(entities)

      act(() => {
        world.remove(entities[2], 'foo')
      })

      expect(result.current.entities).toEqual([entities[0], entities[1]])
    })
  })

  describe('useCurrentEntity', () => {
    it('should return the current entity', () => {
      const world = new World<Entity>({ components: ['foo', 'bar'] })
      world.init()

      const ECS = createECS(world)

      const entity = world.create({})

      const { result } = renderHook(() => ECS.useCurrentEntity(), {
        wrapper: ({ children }) => (
          <ECS.Entity entity={entity}>{children}</ECS.Entity>
        ),
      })

      expect(result.current).toBe(entity)
    })
  })

  describe('step', () => {
    it('should step the world', () => {
      const world = new World<Entity>({ components: ['foo', 'bar'] })
      world.init()

      const ECS = createECS(world)

      const onUpdate = vi.fn()

      world.systemManager.registerSystem(
        class extends System {
          onUpdate(delta: number, time: number) {
            onUpdate(delta, time)
          }
        }
      )

      const delta = 0.01

      ECS.step(delta)
      expect(onUpdate).toBeCalledWith(delta, delta)

      ECS.step(delta)
      expect(onUpdate).toBeCalledWith(delta, delta * 2)
    })
  })
})
