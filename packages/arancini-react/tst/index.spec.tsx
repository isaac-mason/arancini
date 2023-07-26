import * as A from '@arancini/core'
import { act, render, renderHook } from '@testing-library/react'
import React, { forwardRef, useImperativeHandle } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createECS } from '../src'

import '@testing-library/jest-dom'

class ExampleComponent extends A.Component {}

class ExampleComponentWithArgs extends A.Component {
  exampleProperty!: string

  construct(exampleArg: string) {
    this.exampleProperty = exampleArg
  }
}

describe('createECS', () => {
  it('should be truthy', () => {
    const world = new A.World()
    const ECS = createECS(world)

    expect(ECS).toBeTruthy()
    expect(ECS.world).toBeTruthy()
  })

  describe('<Entity>', () => {
    it('should create an entity', () => {
      const world = new A.World()
      const ECS = createECS(world)

      render(<ECS.Entity />)

      expect(world.entities.size).toBe(1)
    })

    it('should support taking an existing entity via props', () => {
      const world = new A.World()
      const ECS = createECS(world)

      const entity = world.create()

      render(<ECS.Entity entity={entity} />)

      expect(world.entities.size).toBe(1)
      expect(world.entities.has(entity.id)).toBe(true)
    })

    it('supports refs', () => {
      const world = new A.World()
      const ECS = createECS(world)

      const ref = React.createRef<A.Entity>()
      const entity = world.create()

      render(<ECS.Entity ref={ref} entity={entity} />)

      expect(ref.current).not.toBeNull()
      expect(ref.current).toBe(entity)
    })
  })

  describe('<Entities>', () => {
    it('should add components to entities', () => {
      const world = new A.World()
      const ECS = createECS(world)

      world.registerComponent(ExampleComponent)

      const entities = [world.create(), world.create(), world.create()]

      render(
        <ECS.Entities entities={entities}>
          <ECS.Component type={ExampleComponent} />
        </ECS.Entities>
      )

      expect(entities.every((entity) => entity.has(ExampleComponent))).toBe(
        true
      )
    })
  })

  describe('<QueryEntities>', () => {
    it('should render entities that match the query description', () => {
      const world = new A.World()
      const ECS = createECS(world)

      world.registerComponent(ExampleComponent)
      world.registerComponent(ExampleComponentWithArgs)

      const entities = [world.create(), world.create(), world.create()]

      entities[0].add(ExampleComponent)
      entities[1].add(ExampleComponent)

      render(
        <ECS.QueryEntities query={[ExampleComponent]}>
          <ECS.Component type={ExampleComponentWithArgs} />
        </ECS.QueryEntities>
      )

      expect(entities[0].has(ExampleComponentWithArgs)).toBe(true)
      expect(entities[1].has(ExampleComponentWithArgs)).toBe(true)
      expect(entities[2].has(ExampleComponentWithArgs)).toBe(false)

      act(() => {
        entities[2].add(ExampleComponent)
      })

      expect(entities[2].has(ExampleComponentWithArgs)).toBe(true)

      act(() => {
        entities[2].remove(ExampleComponent)
      })

      expect(entities[2].has(ExampleComponentWithArgs)).toBe(false)
    })

    it('should render entities that match the query instance', () => {
      const world = new A.World()
      const ECS = createECS(world)

      world.registerComponent(ExampleComponent)
      world.registerComponent(ExampleComponentWithArgs)

      const entities = [world.create(), world.create(), world.create()]

      entities[0].add(ExampleComponent)
      entities[1].add(ExampleComponent)

      const query = world.query([ExampleComponent])

      render(
        <ECS.QueryEntities query={query}>
          <ECS.Component type={ExampleComponentWithArgs} />
        </ECS.QueryEntities>
      )

      expect(entities[0].has(ExampleComponentWithArgs)).toBe(true)
      expect(entities[1].has(ExampleComponentWithArgs)).toBe(true)
      expect(entities[2].has(ExampleComponentWithArgs)).toBe(false)

      act(() => {
        entities[2].add(ExampleComponent)
      })

      expect(entities[2].has(ExampleComponentWithArgs)).toBe(true)

      act(() => {
        entities[2].remove(ExampleComponent)
      })

      expect(entities[2].has(ExampleComponentWithArgs)).toBe(false)
    })
  })

  describe('<Component>', () => {
    it('should add and remove the given component to an entity', () => {
      const world = new A.World()
      const ECS = createECS(world)

      world.registerComponent(ExampleComponent)

      const entity = world.create()

      const { unmount } = render(
        <ECS.Entity entity={entity}>
          <ECS.Component type={ExampleComponent} />
        </ECS.Entity>
      )

      expect(entity.get(ExampleComponent)).toBeInstanceOf(ExampleComponent)

      act(() => {
        unmount()
      })

      expect(entity.has(ExampleComponent)).toBe(false)
    })

    it('should call construct with the args prop', () => {
      const world = new A.World()
      const ECS = createECS(world)

      world.registerComponent(ExampleComponentWithArgs)

      const entity = world.create()

      render(
        <ECS.Entity entity={entity}>
          <ECS.Component type={ExampleComponentWithArgs} args={['test']} />
        </ECS.Entity>
      )

      expect(entity.get(ExampleComponentWithArgs).exampleProperty).toBe('test')
    })

    it('should capture child ref and use it as a component arg', () => {
      const world = new A.World()
      const ECS = createECS(world)

      world.registerComponent(ExampleComponentWithArgs)

      const entity = world.create()

      const refValue = 'refValue'

      const TestComponentWithRef = forwardRef((_props, ref) => {
        useImperativeHandle(ref, () => refValue)
        return null
      })

      render(
        <ECS.Entity entity={entity}>
          <ECS.Component type={ExampleComponentWithArgs}>
            <TestComponentWithRef />
          </ECS.Component>
        </ECS.Entity>
      )

      expect(entity.get(ExampleComponentWithArgs).exampleProperty).toBe(
        refValue
      )
    })
  })

  describe('useQuery', () => {
    it('should return a reactive query instance when given a query description', () => {
      const world = new A.World()
      const ECS = createECS(world)

      world.registerComponent(ExampleComponent)

      const entities = [world.create(), world.create(), world.create()]

      entities.forEach((e) => {
        e.add(ExampleComponent)
      })

      const { result } = renderHook(() => ECS.useQuery([ExampleComponent]))

      expect(result.current.entities).toEqual(entities)

      act(() => {
        entities[2].remove(ExampleComponent)
      })

      expect(result.current.entities).toEqual([entities[0], entities[1]])
    })

    it('should return a reactive query instance when given a query instance', () => {
      const world = new A.World()
      const ECS = createECS(world)

      world.registerComponent(ExampleComponent)

      const entities = [world.create(), world.create(), world.create()]

      entities.forEach((e) => {
        e.add(ExampleComponent)
      })

      const query = world.query([ExampleComponent])

      const { result } = renderHook(() => ECS.useQuery(query))

      expect(result.current.entities).toEqual(entities)

      act(() => {
        entities[2].remove(ExampleComponent)
      })

      expect(result.current.entities).toEqual([entities[0], entities[1]])
    })
  })

  describe('useCurrentEntity', () => {
    it('should return the current entity', () => {
      const world = new A.World()
      const ECS = createECS(world)

      const entity = world.create()

      const { result } = renderHook(() => ECS.useCurrentEntity(), {
        wrapper: ({ children }) => (
          <ECS.Entity entity={entity}>{children}</ECS.Entity>
        ),
      })

      expect(result.current).toBe(entity)
    })
  })

  describe('update', () => {
    it('should update the world', () => {
      const world = new A.World()
      const ECS = createECS(world)

      const onUpdate = vi.fn()

      world.systemManager.registerSystem(
        class extends A.System {
          onUpdate(delta: number, time: number) {
            onUpdate(delta, time)
          }
        }
      )

      const delta = 0.01

      ECS.update(delta)
      expect(onUpdate).toBeCalledWith(delta, delta)

      ECS.update(delta)
      expect(onUpdate).toBeCalledWith(delta, delta * 2)
    })
  })
})
