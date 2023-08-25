import { beforeEach, describe, expect, it } from 'vitest'
import { Component, World } from '../src'
import { ComponentRegistry } from '../src/component-registry'

describe('ComponentRegistry', () => {
  let world: World
  let componentRegistry: ComponentRegistry

  beforeEach(() => {
    world = new World()
    componentRegistry = world.componentRegistry
  })

  it('should assign new components an index on registration', () => {
    for (let i = 0; i < 100; i++) {
      const ExampleComponent = class extends Component {}
      world.registerComponent(ExampleComponent)
      expect(componentRegistry.components.get(ExampleComponent)).toBe(i)
      expect(ExampleComponent.componentIndex).toBe(i)
    }
  })

  it('on reregistering a component, should return the existing component index', () => {
    const ExampleComponent = class extends Component {}
    world.registerComponent(ExampleComponent)

    const index = world.componentRegistry.registerComponent(ExampleComponent)

    expect(world.componentRegistry.registerComponent(ExampleComponent)).toBe(
      index
    )
  })

  it('should support registering a component after the world is initialised', () => {
    const ExampleComponent = class extends Component {}

    world.create()
    world.init()

    world.componentRegistry.registerComponent(ExampleComponent)

    expect(ExampleComponent.componentIndex).toBe(0)
  })

  it('should support registering tag components', () => {
    const TagComponent = Component.tag('tag')
    world.registerComponent(TagComponent)

    expect(TagComponent.componentIndex).toBe(0)
  })

  it('should support registering object components', () => {
    const ObjectComponent = Component.object<{ x: number; y: number }>(
      'Object Component'
    )
    world.registerComponent(ObjectComponent)

    expect(ObjectComponent.componentIndex).toBe(0)
  })
})
