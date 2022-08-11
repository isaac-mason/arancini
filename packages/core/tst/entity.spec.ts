/* eslint-disable max-classes-per-file */
import { World, Space, Component } from '../src';

describe('Entity', () => {
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

      const otherEntity = space.builder.entity().add(TestComponentOne).build();

      expect(otherEntity).toBeTruthy();
      expect(otherEntity.components.size).toBe(1);
      expect(otherEntity.has(TestComponentOne)).toBe(true);
    });

    it('can be destroyed or removed from a space', () => {
      const entityOne = space.create.entity();

      entityOne.destroy();

      expect(entityOne.alive).toBe(false);
      expect(space.entities.has(entityOne.id)).toBe(false);
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
      const testComponentOne = entityOne.add(TestComponentOne);
      entityTwo.add(TestComponentOne);
      expect(entityOne.has(TestComponentOne)).toBeTruthy();
      expect(entityOne.has(TestComponentTwo)).toBeFalsy();
      expect(entityTwo.has(TestComponentOne)).toBeTruthy();
      expect(entityTwo.has(TestComponentTwo)).toBeFalsy();

      // remove component by instance
      entityOne.remove(testComponentOne);

      // remove component by component class
      entityTwo.remove(TestComponentOne);
      expect(entityOne.has(TestComponentOne)).toBeFalsy();
      expect(entityTwo.has(TestComponentOne)).toBeFalsy();
      expect(entityOne.has(TestComponentTwo)).toBeFalsy();
      expect(entityTwo.has(TestComponentTwo)).toBeFalsy();

      // add TestComponentOne components back
      entityOne.add(TestComponentOne);
      entityTwo.add(TestComponentOne);
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
      entity.add(TestComponentWithConstructParams, 1, 2);
      expect(entity.has(TestComponentWithConstructParams)).toBe(true);

      const componentOne = entity.get(TestComponentWithConstructParams);
      expect(componentOne.position.x).toBe(1);
      expect(componentOne.position.y).toBe(2);

      entity.remove(TestComponentWithConstructParams);
      expect(entity.has(TestComponentWithConstructParams)).toBe(false);

      entity.add(TestComponentWithConstructParams, 3, 4);
      const componentTwo = entity.get(TestComponentWithConstructParams);
      expect(componentTwo.position.x).toBe(3);
      expect(componentTwo.position.y).toBe(4);
    });

    it('should throw an error if the component does not exist in the entity', () => {
      const entity = space.create.entity();

      expect(() => entity.remove(TestComponentOne)).toThrowError();

      const otherEntity = space.create.entity();
      const component = otherEntity.add(TestComponentOne);

      expect(() => entity.remove(component)).toThrowError();
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
});
