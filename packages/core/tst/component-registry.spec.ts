/* eslint-disable max-classes-per-file */

import { Component, World } from '../src';
import { ComponentRegistry } from '../src/component-registry';

describe('ComponentManager', () => {
  let world: World;
  let componentRegistry: ComponentRegistry;

  beforeEach(() => {
    world = new World();
    componentRegistry = world.componentRegistry;
  });

  it('should assign new components an index on registration', () => {
    for (let i = 0; i < 100; i++) {
      const ExampleComponent = class extends Component {};
      world.registerComponent(ExampleComponent);
      expect(componentRegistry.getComponentIndex(ExampleComponent)).toBe(i);
    }
  });

  it('on reregistering a component, should return the existing component index', () => {
    const ExampleComponent = class extends Component {};

    const index = world.componentRegistry.registerComponent(ExampleComponent);

    expect(world.componentRegistry.registerComponent(ExampleComponent)).toBe(
      index
    );
  });

  it('should register unregistered components on requesting their component index', () => {
    class ExampleComponent extends Component {}

    const space = world.create.space();
    const entity = space.create.entity();

    entity.addComponent(ExampleComponent);

    expect(world.componentRegistry.getComponentIndex(ExampleComponent)).toBe(0);
  });
});
