/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { World } from '../src';

describe('World Integration Tests', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  it('should have a default space that entities can be created in', () => {
    expect(Array.from(world.spaceManager.spaces.values())[0]).toBe(
      world.defaultSpace
    );

    const entityOne = world.create.entity();

    expect(world.defaultSpace.entities.get(entityOne.id)).toBe(entityOne);

    const entityTwo = world.build.entity().build();

    expect(world.defaultSpace.entities.get(entityTwo.id)).toBe(entityTwo);
  });

  describe('getSpace', () => {
    it('can retrieve spaces by id', () => {
      const space = world.create.space({ id: 'SpaceName' });

      expect(world.getSpace('SpaceName')).toBe(space);
    });
  });

  describe('Events', () => {
    it('should be able to register event handlers and emit events', () => {
      const mockFn = jest.fn();

      world.init();

      const subscription = world.on('event-name', () => mockFn());

      expect(mockFn).toBeCalledTimes(0);

      world.emit({
        topic: 'event-name',
      });

      expect(mockFn).toBeCalledTimes(1);

      subscription.unsubscribe();

      world.emit({
        topic: 'event-name',
      });

      expect(mockFn).toBeCalledTimes(1);
    });
  });
});
