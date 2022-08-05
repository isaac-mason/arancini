/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { Component, Space, World } from '../src';

describe('Spaces, Entities, Components', () => {
  let world: World;
  let space: Space;

  beforeEach(() => {
    world = new World();
    space = world.create.space();

    world.init();
  });

  describe('Entity', () => {
    it('should support creation with or without components', () => {
      class TestComponentOne extends Component {}

      const entity = space.create.entity();

      expect(entity).toBeTruthy();
      expect(entity.components.size).toBe(0);

      const otherEntity = space.build
        .entity()
        .addComponent(TestComponentOne)
        .build();

      expect(otherEntity).toBeTruthy();
      expect(otherEntity.components.size).toBe(1);
      expect(otherEntity.has(TestComponentOne)).toBe(true);
    });

    it('can be destroyed or removed from a space', () => {
      const entityOne = space.create.entity();
      const entityTwo = space.create.entity();

      entityOne.destroy();
      space.removeEntity(entityTwo);

      expect(entityOne.alive).toBe(false);
      expect(space.entities.has(entityOne.id)).toBe(false);

      expect(entityTwo.alive).toBe(false);
      expect(space.entities.has(entityTwo.id)).toBe(false);
    });
  });

  describe('adding and removing components', () => {
    class TestComponentOne extends Component {}
    class TestComponentTwo extends Component {}

    beforeEach(() => {
      world.registerComponent(TestComponentOne);
      world.registerComponent(TestComponentTwo);
    });

    it('components can be added and removed from entities', () => {
      // create two entities
      const entityOne = space.create.entity();
      const entityTwo = space.create.entity();

      // add TestComponentOne to entities
      const testComponentOne = entityOne.addComponent(TestComponentOne);
      entityTwo.addComponent(TestComponentOne);
      expect(entityOne.has(TestComponentOne)).toBeTruthy();
      expect(entityOne.has(TestComponentTwo)).toBeFalsy();
      expect(entityTwo.has(TestComponentOne)).toBeTruthy();
      expect(entityTwo.has(TestComponentTwo)).toBeFalsy();

      // remove component by instance
      entityOne.removeComponent(testComponentOne);

      // remove component by component class
      entityTwo.removeComponent(TestComponentOne);
      expect(entityOne.has(TestComponentOne)).toBeFalsy();
      expect(entityTwo.has(TestComponentOne)).toBeFalsy();
      expect(entityOne.has(TestComponentTwo)).toBeFalsy();
      expect(entityTwo.has(TestComponentTwo)).toBeFalsy();

      // add TestComponentOne components back
      entityOne.addComponent(TestComponentOne);
      entityTwo.addComponent(TestComponentOne);
      expect(entityOne.has(TestComponentOne)).toBeTruthy();
      expect(entityTwo.has(TestComponentOne)).toBeTruthy();
      expect(entityOne.has(TestComponentTwo)).toBeFalsy();
      expect(entityTwo.has(TestComponentTwo)).toBeFalsy();
    });

    it('on re-adding a component to an entity, it will be newly constructed properly', () => {
      class TestComponentWithConstructParams extends Component {
        position!: { x: number; y: number };

        construct(x: number, y: number): void {
          this.position = { x, y };
        }
      }

      const entity = space.create.entity();
      entity.addComponent(TestComponentWithConstructParams, 1, 2);
      expect(entity.has(TestComponentWithConstructParams)).toBe(true);

      const componentOne = entity.get(TestComponentWithConstructParams);
      expect(componentOne.position.x).toBe(1);
      expect(componentOne.position.y).toBe(2);

      entity.removeComponent(TestComponentWithConstructParams);
      expect(entity.has(TestComponentWithConstructParams)).toBe(false);

      entity.addComponent(TestComponentWithConstructParams, 3, 4);
      const componentTwo = entity.get(TestComponentWithConstructParams);
      expect(componentTwo.position.x).toBe(3);
      expect(componentTwo.position.y).toBe(4);
    });

    it('should throw an error if the component does not exist in the entity', () => {
      const entity = space.create.entity();

      expect(() => entity.removeComponent(TestComponentOne)).toThrowError();

      const otherEntity = space.create.entity();
      const component = otherEntity.addComponent(TestComponentOne);

      expect(() => entity.removeComponent(component)).toThrowError();
    });
  });

  describe('events', () => {
    it('entities should be able to register event handlers and emit events', () => {
      // create an entity
      const entity = space.create.entity();

      // register an event handler
      const mockFn = jest.fn();
      const subscription = entity.on('event-name', () => mockFn());
      expect(mockFn).toBeCalledTimes(0);

      // event should be handled
      entity.emit({
        topic: 'event-name',
      });
      expect(mockFn).toBeCalledTimes(1);

      // event should not be handled
      subscription.unsubscribe();
      entity.emit({
        topic: 'event-name',
      });
      expect(mockFn).toBeCalledTimes(1);
    });

    it('spaces should be able to register event handlers and emit events', () => {
      // register an event handler
      const mockFn = jest.fn();
      const subscription = space.on('event-name', () => mockFn());
      expect(mockFn).toBeCalledTimes(0);

      // event should be handled
      space.emit({
        topic: 'event-name',
      });
      expect(mockFn).toBeCalledTimes(1);

      // event should not be handled
      subscription.unsubscribe();
      space.emit({
        topic: 'event-name',
      });
      expect(mockFn).toBeCalledTimes(1);
    });
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
      entity.addComponent(TestComponent);

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
      entity.addComponent(TestComponentOne);
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

      space.removeEntity(entity);
      world.update(delta);
      expect(componentUpdateJestFn).toHaveBeenCalledTimes(2);
      expect(componentDestroyJestFn).toHaveBeenCalledTimes(1);
    });

    it('will not call component onInit, onUpdate, and onDestroy methods if they have not been extended', () => {
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

      entity.addComponent(MockComponentExtendedClass as never);

      expect(componentInitJestFn).toHaveBeenCalledTimes(0);

      const delta = 1001;
      world.update(delta);

      expect(componentUpdateJestFn).toHaveBeenCalledTimes(0);

      entity.destroy();

      world.update(delta);

      expect(componentUpdateJestFn).toHaveBeenCalledTimes(0);

      world.destroy();

      expect(componentDestroyJestFn).toHaveBeenCalledTimes(0);
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

      entity.addComponent(TestComponentOne);

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

      entity.addComponent(TestComponentOne);

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

      entity.addComponent(TestComponentOne);

      expect(entity.has(TestComponentOne)).toBe(true);
    });

    it('should return false if the entity does not have the given component', () => {
      const entity = space.create.entity();

      entity.addComponent(TestComponentOne);

      expect(entity.has(TestComponentOne)).toBe(true);
      expect(entity.has(TestComponentTwo)).toBe(false);

      const componentTwo = entity.addComponent(TestComponentTwo);

      expect(entity.has(TestComponentOne)).toBe(true);
      expect(entity.has(TestComponentTwo)).toBe(true);

      entity.removeComponent(TestComponentOne);

      expect(entity.has(TestComponentOne)).toBe(false);
      expect(entity.has(TestComponentTwo)).toBe(true);

      entity.removeComponent(componentTwo);

      expect(entity.has(TestComponentOne)).toBe(false);
      expect(entity.has(TestComponentTwo)).toBe(false);
    });
  });

  it('components should have a getter for the space and world the component is in', () => {
    class TestComponentOne extends Component {}
    world.registerComponent(TestComponentOne);

    const entity = space.create.entity();

    const component = entity.addComponent(TestComponentOne);

    expect(component.space).toBe(space);
    expect(component.world).toBe(world);
  });
});
