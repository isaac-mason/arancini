/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { Component, World } from '../src';

describe('Entities And Components Integration Tests', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  it('entities should be able to register event handlers and emit events', () => {
    const entity = world.create.space().create.entity();

    const mockFn = jest.fn();

    world.init();

    const subscription = entity.on('event-name', () => mockFn());

    expect(mockFn).toBeCalledTimes(0);

    entity.emit({
      topic: 'event-name',
    });

    world.update(1);

    expect(mockFn).toBeCalledTimes(1);

    subscription.unsubscribe();

    entity.emit({
      topic: 'event-name',
    });

    world.update(1);

    expect(mockFn).toBeCalledTimes(1);
  });

  it('components can be added and removed from entities', () => {
    const space = world.create.space();
    const entityOne = space.create.entity();
    const entityTwo = space.create.entity();

    class TestComponentOne extends Component {}
    class TestComponentTwo extends Component {}

    entityOne.addComponent(TestComponentOne);
    entityTwo.addComponent(TestComponentOne);

    expect(entityOne.has(TestComponentOne)).toBeTruthy();
    expect(entityOne.has(TestComponentTwo)).toBeFalsy();

    expect(entityTwo.has(TestComponentOne)).toBeTruthy();
    expect(entityTwo.has(TestComponentTwo)).toBeFalsy();

    entityOne.removeComponent(TestComponentOne, { immediately: true });
    entityTwo.removeComponent(TestComponentOne);

    expect(entityOne.has(TestComponentOne)).toBeFalsy();
    expect(entityOne.has(TestComponentTwo)).toBeFalsy();

    expect(entityTwo.has(TestComponentOne)).toBeTruthy();
    expect(entityTwo.has(TestComponentTwo)).toBeFalsy();

    world.update();

    expect(entityTwo.has(TestComponentOne)).toBeFalsy();
    expect(entityTwo.has(TestComponentTwo)).toBeFalsy();

    entityOne.addComponent(TestComponentOne);
    entityTwo.addComponent(TestComponentOne);

    world.update();

    expect(entityOne.has(TestComponentOne)).toBeTruthy();
    expect(entityOne.has(TestComponentTwo)).toBeFalsy();

    expect(entityTwo.has(TestComponentOne)).toBeTruthy();
    expect(entityTwo.has(TestComponentTwo)).toBeFalsy();
  });

  it('components can be added with parameters', () => {
    const space = world.create.space();
    const entity = space.create.entity();

    class TestComponentWithConstructParams extends Component {
      position!: { x: number; y: number };

      construct(x: number, y: number): void {
        this.position = { x, y };
      }
    }

    entity.addComponent(TestComponentWithConstructParams, 1, 2);

    expect(entity.has(TestComponentWithConstructParams)).toBeTruthy();

    const component = entity.get(TestComponentWithConstructParams);
    expect(component.position.x).toBe(1);
    expect(component.position.y).toBe(2);

    entity.removeComponent(TestComponentWithConstructParams);
  });

  it('on re-adding a component to an entity, it will be newly constructed properly', () => {
    const space = world.create.space();
    const entity = space.create.entity();

    class TestComponentWithConstructParams extends Component {
      position!: { x: number; y: number };

      construct(x: number, y: number): void {
        this.position = { x, y };
      }
    }

    entity.addComponent(TestComponentWithConstructParams, 1, 2);

    expect(entity.has(TestComponentWithConstructParams)).toBeTruthy();

    const componentOne = entity.get(TestComponentWithConstructParams);
    expect(componentOne.position.x).toBe(1);
    expect(componentOne.position.y).toBe(2);

    entity.removeComponent(TestComponentWithConstructParams, {
      immediately: true,
    });

    expect(entity.has(TestComponentWithConstructParams)).toBeFalsy();

    entity.addComponent(TestComponentWithConstructParams, 3, 4);
    const componentTwo = entity.get(TestComponentWithConstructParams);
    expect(componentTwo.position.x).toBe(3);
    expect(componentTwo.position.y).toBe(4);
  });

  it('recs will not call component onInit, onUpdate, and onDestroy methods if they have not been extended', () => {
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

    const space = world.create.space();

    const entity = space.create.entity();

    entity.addComponent(MockComponentExtendedClass as never);

    world.init();

    expect(componentInitJestFn).toHaveBeenCalledTimes(0);

    const timeElapsed = 1001;
    world.update(timeElapsed);

    expect(componentUpdateJestFn).toHaveBeenCalledTimes(0);

    entity.destroy();

    world.update(timeElapsed);

    expect(componentUpdateJestFn).toHaveBeenCalledTimes(0);

    world.destroy();

    expect(componentDestroyJestFn).toHaveBeenCalledTimes(0);
  });

  it('recs will call component onInit, onUpdate, and onDestroy methods', () => {
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

      onUpdate(timeElapsed: number): void {
        componentUpdateJestFn(timeElapsed);
      }
    }

    const space = world.create.space();

    const entity = space.create.entity();

    entity.addComponent(TestComponentOne);

    world.init();

    expect(world.initialised).toBe(true);
    expect(componentInitJestFn).toHaveBeenCalledTimes(1);

    const timeElapsed = 1001;
    world.update(timeElapsed);

    expect(componentUpdateJestFn).toHaveBeenCalledTimes(1);

    expect(componentUpdateJestFn.mock.calls[0][0]).toBe(timeElapsed);

    entity.destroy();

    world.update(timeElapsed);

    expect(componentUpdateJestFn).toHaveBeenCalledTimes(1);

    world.destroy();

    expect(componentDestroyJestFn).toHaveBeenCalledTimes(1);
  });

  it('components should have a getter for the space the component is in', () => {
    class TestComponentOne extends Component {}

    world.init();

    const space = world.create.space();

    const entity = space.create.entity();

    const component = entity.addComponent(TestComponentOne);

    expect(component.space).toBe(space);
  });

  describe('get', () => {
    class TestComponentOne extends Component {}

    it('should throw an error if the component is not in the entity', () => {
      const space = world.create.space();
      const entity = space.create.entity();

      expect(() => entity.get(TestComponentOne)).toThrow();
    });

    it('should return the component instance if the component is in the entity', () => {
      const space = world.create.space();
      const entity = space.create.entity();

      entity.addComponent(TestComponentOne);

      expect(entity.get(TestComponentOne)).toBeInstanceOf(TestComponentOne);
    });
  });

  describe('find', () => {
    class TestComponentOne extends Component {}

    it('should return undefined if the component is not in the entity', () => {
      const space = world.create.space();
      const entity = space.create.entity();

      expect(entity.find(TestComponentOne)).toBeUndefined();
    });

    it('should return the component instance if the component is in the entity', () => {
      const space = world.create.space();
      const entity = space.create.entity();

      entity.addComponent(TestComponentOne);

      expect(entity.find(TestComponentOne)).toBeInstanceOf(TestComponentOne);
    });
  });

  describe('removeComponent', () => {
    class TestComponentOne extends Component {}

    it('should throw an error if the component does not exist in the entity', () => {
      const space = world.create.space();
      const entity = space.create.entity();

      expect(() => entity.removeComponent(TestComponentOne)).toThrowError();
      expect(() =>
        entity.removeComponent(new TestComponentOne())
      ).toThrowError();
    });
  });

  describe('has', () => {
    class TestComponentOne extends Component {}
    class TestComponentTwo extends Component {}

    it('should return true if the entity has the given component', () => {
      const space = world.create.space();
      const entity = space.create.entity();

      entity.addComponent(TestComponentOne);

      expect(entity.has(TestComponentOne)).toBe(true);
    });

    it('should return false if the entity does not have the given component', () => {
      const space = world.create.space();
      const entity = space.create.entity();

      entity.addComponent(TestComponentOne);

      expect(entity.has(TestComponentOne)).toBe(true);
      expect(entity.has(TestComponentTwo)).toBe(false);

      const componentTwo = entity.addComponent(TestComponentTwo);

      expect(entity.has(TestComponentOne)).toBe(true);
      expect(entity.has(TestComponentTwo)).toBe(true);

      entity.removeComponent(TestComponentOne, { immediately: true });

      expect(entity.has(TestComponentOne)).toBe(false);
      expect(entity.has(TestComponentTwo)).toBe(true);

      entity.removeComponent(componentTwo);

      expect(entity.has(TestComponentOne)).toBe(false);
      expect(entity.has(TestComponentTwo)).toBe(true);

      world.update();

      expect(entity.has(TestComponentOne)).toBe(false);
      expect(entity.has(TestComponentTwo)).toBe(false);
    });
  });
});
