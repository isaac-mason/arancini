import { World } from '@arancini/core'
import '@testing-library/jest-dom'
import { act, render, renderHook } from '@testing-library/react'
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { describe, expect, it } from 'vitest'
import { createReactAPI } from '../src'

type Entity = {
  foo?: boolean
  bar?: string
}

describe('createReactAPI', () => {
  describe('<Entity />', () => {
    it('creates an entity', () => {
      const world = new World<Entity>()

      const reactAPI = createReactAPI(world)

      render(<reactAPI.Entity />)

      expect(world.entities.length).toBe(1)
    })

    it('supports taking an existing entity via props', () => {
      const world = new World<Entity>()

      const reactAPI = createReactAPI(world)

      const entity = world.create({})

      render(<reactAPI.Entity entity={entity} />)

      expect(world.entities.length).toBe(1)
      expect(world.has(entity)).toBe(true)
    })

    it('supports refs', () => {
      const world = new World<Entity>()

      const reactAPI = createReactAPI(world)

      const ref = React.createRef<Entity>()
      const entity = world.create({})

      render(<reactAPI.Entity ref={ref} entity={entity} />)

      expect(ref.current).not.toBeNull()
      expect(ref.current).toBe(entity)
    })
  })

  describe('<Entities />', () => {
    it('adds components to entities', () => {
      const world = new World<Entity>()

      const reactAPI = createReactAPI(world)

      const entities = [world.create({}), world.create({}), world.create({})]

      render(
        <reactAPI.Entities in={entities}>
          <reactAPI.Component name="foo" value={true} />
        </reactAPI.Entities>
      )

      expect(entities.every((entity) => !!entity.foo)).toBe(true)
    })

    it('supports query instances', () => {
      const world = new World<Entity>()

      const reactAPI = createReactAPI(world)

      const entities = [world.create({}), world.create({}), world.create({})]

      world.update(entities[0], (e) => {
        e.foo = true
      })

      world.update(entities[1], (e) => {
        e.foo = true
      })

      const query = world.query((e) => e.has('foo'))

      render(
        <reactAPI.Entities in={query}>
          <reactAPI.Component name="bar" value="123" />
        </reactAPI.Entities>
      )

      expect(!!entities[0].bar).toBe(true)
      expect(!!entities[1].bar).toBe(true)
      expect(!!entities[2].bar).toBe(false)
    })
  })

  describe('<Component />', () => {
    it('adds and removes the given component to an entity', () => {
      const world = new World<Entity>()

      const reactAPI = createReactAPI(world)

      const entity = world.create({})

      const { unmount } = render(
        <reactAPI.Entity entity={entity}>
          <reactAPI.Component name="foo" value={true} />
        </reactAPI.Entity>
      )

      expect(entity.foo).toBe(true)

      act(() => {
        unmount()
      })

      expect(!!entity.foo).toBe(false)
    })

    it('captures child ref and use it as a component arg', () => {
      const world = new World<Entity>()

      const reactAPI = createReactAPI(world)

      const entity = world.create({})

      const stateChangeListeners = new Set<() => void>()

      const updateState = () => {
        stateChangeListeners.forEach((listener) => listener())
      }

      const TestComponentWithRef = forwardRef((_props, ref) => {
        const [value, setValue] = useState(0)

        useImperativeHandle(ref, () => value, [value])

        useEffect(() => {
          const fn = () =>
            setValue((v) => {
              return v + 1
            })

          stateChangeListeners.add(fn)

          return () => {
            stateChangeListeners.delete(fn)
          }
        }, [])


        return null
      })

      render(
        <reactAPI.Entity entity={entity}>
          <reactAPI.Component name="bar">
            <TestComponentWithRef />
          </reactAPI.Component>
        </reactAPI.Entity>
      )

      expect(entity.bar).toBe(0)

      expect(stateChangeListeners.size).toBe(1)

      act(() => {
        updateState()
      })

      expect(entity.bar).toBe(1)
    })
  })

  describe('useQuery', () => {
    it('rerenders when entities are added to or removed from the query', () => {
      const world = new World<Entity>()

      const reactAPI = createReactAPI(world)

      const entities = [world.create({}), world.create({}), world.create({})]

      entities.forEach((e) => {
        world.add(e, 'foo', true)
      })

      const query = world.query((e) => e.has('foo'))

      const { result } = renderHook(() => reactAPI.useQuery(query))

      expect(result.current.entities).toEqual(entities)

      act(() => {
        world.remove(entities[2], 'foo')
      })

      expect(result.current.entities).toEqual([entities[0], entities[1]])
    })
  })

  describe('useCurrentEntity', () => {
    it('returns the current entity', () => {
      const world = new World<Entity>()

      const reactAPI = createReactAPI(world)

      const entity = world.create({})

      const { result } = renderHook(() => reactAPI.useCurrentEntity(), {
        wrapper: ({ children }) => (
          <reactAPI.Entity entity={entity}>{children}</reactAPI.Entity>
        ),
      })

      expect(result.current).toBe(entity)
    })
  })
})
