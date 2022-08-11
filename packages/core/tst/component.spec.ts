/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { Component, Space, World } from '../src';

describe('Components', () => {
  let world: World;
  let space: Space;

  beforeEach(() => {
    world = new World();
    space = world.create.space();

    world.init();
  });

  describe('lifecycle methods', () => {
    it('will initialise entity components on initialising an entity', () => {
      world = new World();
      space = world.create.space();

      const onInit = jest.fn();
      class TestComponent extends Component {
        onInit() {
          onInit();
        }
      }

      const entity = space.create.entity();
      entity.add(TestComponent);

      expect(onInit).toBeCalledTimes(0);

      world.init();

      expect(onInit).toBeCalledTimes(1);
    });

    it('will call component onInit, onUpdate, and onDestroy methods if they have been extended', () => {
      const componentInitJestFn = jest.fn();
      const componentUpdateJestFn = jest.fn();
      const componentDestroyJestFn = jest.fn();

      class TestComponentOne extends Component {
        onDestroy(): void {
          componentDestroyJestFn();
        }

        onInit(): void {
          componentInitJestFn();
        }

        onUpdate(delta: number, time: number): void {
          componentUpdateJestFn(delta, time);
        }
      }

      // onInit
      const entity = space.create.entity();
      entity.add(TestComponentOne);
      expect(world.initialised).toBe(true);
      expect(componentInitJestFn).toHaveBeenCalledTimes(1);

      // onUpdate
      const delta = 100;
      world.update(delta);
      world.update(delta);

      expect(componentUpdateJestFn).toHaveBeenCalledTimes(2);
      expect(componentUpdateJestFn.mock.calls[0][0]).toBe(delta);
      expect(componentUpdateJestFn.mock.calls[0][1]).toBe(delta);
      expect(componentUpdateJestFn.mock.calls[1][0]).toBe(delta);
      expect(componentUpdateJestFn.mock.calls[1][1]).toBe(delta * 2);

      entity.destroy();
      world.update(delta);
      expect(componentUpdateJestFn).toHaveBeenCalledTimes(2);
      expect(componentDestroyJestFn).toHaveBeenCalledTimes(1);
    });

    it('will not call component onUpdate method on world update if it has not been extended', () => {
      const componentInitJestFn = jest.fn();
      const componentUpdateJestFn = jest.fn();
      const componentDestroyJestFn = jest.fn();

      class MockComponent {
        onDestroy(): void {
          componentDestroyJestFn();
        }

        onInit(): void {
          componentInitJestFn();
        }

        onUpdate(): void {
          componentUpdateJestFn();
        }
      }

      class MockComponentExtendedClass extends MockComponent {
        construct() {}
      }

      world.registerComponent(MockComponent as never);
      world.registerComponent(MockComponentExtendedClass as never);

      const entity = space.create.entity();
      entity.add(MockComponentExtendedClass as never);

      world.update();

      expect(componentUpdateJestFn).toHaveBeenCalledTimes(0);
    });
  });

  describe('get', () => {
    class TestComponentOne extends Component {}

    beforeEach(() => {
      world.registerComponent(TestComponentOne);
    });

    it('should throw an error if the component is not in the entity', () => {
      const entity = space.create.entity();

      expect(() => entity.get(TestComponentOne)).toThrow();
    });

    it('should return the component instance if the component is in the entity', () => {
      const entity = space.create.entity();

      entity.add(TestComponentOne);

      expect(entity.get(TestComponentOne)).toBeInstanceOf(TestComponentOne);
    });
  });

  describe('find', () => {
    class TestComponentOne extends Component {}

    beforeEach(() => {
      world.registerComponent(TestComponentOne);
    });

    it('should return undefined if the component is not in the entity', () => {
      const entity = space.create.entity();

      expect(entity.find(TestComponentOne)).toBeUndefined();
    });

    it('should return the component instance if the component is in the entity', () => {
      const entity = space.create.entity();

      entity.add(TestComponentOne);

      expect(entity.find(TestComponentOne)).toBeInstanceOf(TestComponentOne);
    });
  });

  describe('has', () => {
    class TestComponentOne extends Component {}
    class TestComponentTwo extends Component {}

    beforeEach(() => {
      world.registerComponent(TestComponentOne);
      world.registerComponent(TestComponentTwo);
    });

    it('should return true if the entity has the given component', () => {
      const entity = space.create.entity();

      entity.add(TestComponentOne);

      expect(entity.has(TestComponentOne)).toBe(true);
    });

    it('should return false if the entity does not have the given component', () => {
      const entity = space.create.entity();

      entity.add(TestComponentOne);

      expect(entity.has(TestComponentOne)).toBe(true);
      expect(entity.has(TestComponentTwo)).toBe(false);

      const componentTwo = entity.add(TestComponentTwo);

      expect(entity.has(TestComponentOne)).toBe(true);
      expect(entity.has(TestComponentTwo)).toBe(true);

      entity.remove(TestComponentOne);

      expect(entity.has(TestComponentOne)).toBe(false);
      expect(entity.has(TestComponentTwo)).toBe(true);

      entity.remove(componentTwo);

      expect(entity.has(TestComponentOne)).toBe(false);
      expect(entity.has(TestComponentTwo)).toBe(false);
    });
  });

  it('components should have a getter for the space and world the component is in', () => {
    class TestComponentOne extends Component {}
    world.registerComponent(TestComponentOne);

    const entity = space.create.entity();

    const component = entity.add(TestComponentOne);

    expect(component.space).toBe(space);
    expect(component.world).toBe(world);
  });
});
