import * as A from '@arancini/core'
import '@testing-library/jest-dom'
import { act, render, renderHook } from '@testing-library/react'
import React, { forwardRef, useImperativeHandle } from 'react'
import { createECS } from '../src'

class ExampleComponent extends A.Component {}

class ExampleComponentWithArgs extends A.Component {
  exampleProperty!: string

  construct(exampleArg: string) {
    this.exampleProperty = exampleArg
  }
}

describe('createECS', () => {
  let world: A.World
  let ECS: ReturnType<typeof createECS>

  beforeEach(() => {
    world = new A.World()
    world.init()

    ECS = createECS(world)
  })

  it('should be truthy', () => {
    expect(ECS).toBeTruthy()
    expect(ECS.world).toBeTruthy()
  })

  describe('<Entity>', () => {
    it('should create an entity', () => {
      render(<ECS.Entity />)

      expect(world.defaultSpace.entities.size).toBe(1)
    })

    it('should support taking an existing entity via props', () => {
      const entity = world.create.entity()

      render(<ECS.Entity entity={entity} />)

      expect(world.defaultSpace.entities.size).toBe(1)
      expect(world.defaultSpace.entities.has(entity.id)).toBe(true)
    })
  })

  describe('<Entities>', () => {
    it('should add components to entities', () => {
      world.registerComponent(ExampleComponent)

      const entities = [
        world.create.entity(),
        world.create.entity(),
        world.create.entity(),
      ]

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
      world.registerComponent(ExampleComponent)
      world.registerComponent(ExampleComponentWithArgs)

      const entities = [
        world.create.entity(),
        world.create.entity(),
        world.create.entity(),
      ]

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
      world.registerComponent(ExampleComponent)
      world.registerComponent(ExampleComponentWithArgs)

      const entities = [
        world.create.entity(),
        world.create.entity(),
        world.create.entity(),
      ]

      entities[0].add(ExampleComponent)
      entities[1].add(ExampleComponent)

      const query = world.create.query([ExampleComponent])

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

  describe('<Space>', () => {
    it('should support creation of entities within the space', () => {
      const testSpaceName = 'testSpaceName'
      const { unmount } = render(
        <ECS.Space id={testSpaceName}>
          <ECS.Entity />
        </ECS.Space>
      )

      expect(world.defaultSpace.entities.size).toBe(0)
      expect(world.spaceManager.spaces.size).toBe(2)
      expect(world.getSpace(testSpaceName)!.entities.size).toBe(1)

      act(() => {
        unmount()
      })

      expect(world.spaceManager.spaces.size).toBe(1)
    })
  })

  describe('<Component>', () => {
    it('should add and remove the given component to an entity', () => {
      world.registerComponent(ExampleComponent)

      const entity = world.create.entity()

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
      world.registerComponent(ExampleComponentWithArgs)

      const entity = world.create.entity()

      render(
        <ECS.Entity entity={entity}>
          <ECS.Component type={ExampleComponentWithArgs} args={['test']} />
        </ECS.Entity>
      )

      expect(entity.get(ExampleComponentWithArgs).exampleProperty).toBe('test')
    })

    it('should capture child ref and use it as a component arg', () => {
      world.registerComponent(ExampleComponentWithArgs)

      const entity = world.create.entity()

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
      world.registerComponent(ExampleComponent)

      const entities = [
        world.create.entity(),
        world.create.entity(),
        world.create.entity(),
      ]

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
      world.registerComponent(ExampleComponent)

      const entities = [
        world.create.entity(),
        world.create.entity(),
        world.create.entity(),
      ]

      entities.forEach((e) => {
        e.add(ExampleComponent)
      })

      const query = world.create.query([ExampleComponent])

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
      const entity = world.create.entity()

      const { result } = renderHook(() => ECS.useCurrentEntity(), {
        wrapper: ({ children }) => (
          <ECS.Entity entity={entity}>{children}</ECS.Entity>
        ),
      })

      expect(result.current).toBe(entity)
    })
  })

  describe('useCurrentSpace', () => {
    it('should return the default space when not wrapped in a space', () => {
      const { result } = renderHook(() => ECS.useCurrentSpace())

      expect(result.current).toBe(world.defaultSpace)
    })

    it('should return the default space when not wrapped in a space', () => {
      const testSpaceId = 'testSpaceId'
      const { result } = renderHook(() => ECS.useCurrentSpace(), {
        wrapper: ({ children }) => (
          <ECS.Space id={testSpaceId}>{children}</ECS.Space>
        ),
      })

      expect(result.current).toBe(world.getSpace(testSpaceId))
    })
  })

  describe('step', () => {
    it('should step the world', () => {
      const onUpdate = jest.fn()

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
