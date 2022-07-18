/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { World } from '../src';

describe('World Integration Tests', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

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
