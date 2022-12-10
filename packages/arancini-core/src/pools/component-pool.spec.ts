/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { Component } from '../component';
import { World } from '../world';
import { ComponentPool } from './component-pool';

describe('ComponentPool', () => {
  class ExampleComponentOne extends Component {}
  class ExampleComponentTwo extends Component {}

  let world: World;
  let pool: ComponentPool;

  beforeEach(() => {
    world = new World();
    world.registerComponent(ExampleComponentOne);
    world.registerComponent(ExampleComponentTwo);
    pool = world.spaceManager.componentPool;
  });

  it('should retrieve component indexes on creating new components in the object pool', () => {
    const exampleComponentOneIndex =
      world.componentRegistry.getComponentIndex(ExampleComponentOne);
    const exampleComponentTwoIndex =
      world.componentRegistry.getComponentIndex(ExampleComponentTwo);

    const exampleComponentOne = pool.request(ExampleComponentOne);
    const exampleComponentTwo = pool.request(ExampleComponentTwo);

    expect(exampleComponentOne.__internal.classIndex).toBe(
      exampleComponentOneIndex
    );
    expect(exampleComponentTwo.__internal.classIndex).toBe(
      exampleComponentTwoIndex
    );
  });

  it('should create a new pool on retrieving a component for the first time', () => {
    expect(pool.totalPools).toBe(0);
    expect(pool.size).toBe(0);
    expect(pool.free).toBe(0);
    expect(pool.used).toBe(0);

    const componentOne = pool.request(ExampleComponentOne);

    expect(pool.totalPools).toBe(1);
    expect(pool.size).toBe(1);
    expect(pool.free).toBe(0);
    expect(pool.used).toBe(1);
    expect(componentOne).toBeTruthy();
    expect(componentOne instanceof ExampleComponentOne).toBeTruthy();

    const componentTwo = pool.request(ExampleComponentOne);
    expect(pool.totalPools).toBe(1);
    expect(pool.size).toBe(2);
    expect(pool.free).toBe(0);
    expect(pool.used).toBe(2);

    expect(componentTwo).toBeTruthy();
    expect(componentTwo instanceof ExampleComponentOne).toBeTruthy();

    const componentThree = pool.request(ExampleComponentTwo);
    expect(componentThree).toBeTruthy();
    expect(componentThree instanceof ExampleComponentTwo).toBeTruthy();
    expect(pool.totalPools).toBe(2);
    expect(pool.size).toBe(3);
    expect(pool.free).toBe(0);
    expect(pool.used).toBe(3);
  });

  it('should release components', () => {
    expect(pool.totalPools).toBe(0);
    expect(pool.size).toBe(0);
    expect(pool.free).toBe(0);
    expect(pool.used).toBe(0);

    const component = pool.request(ExampleComponentOne);

    expect(pool.totalPools).toBe(1);
    expect(pool.size).toBe(1);
    expect(pool.free).toBe(0);
    expect(pool.used).toBe(1);

    expect(component).toBeTruthy();
    expect(component instanceof ExampleComponentOne).toBeTruthy();

    pool.release(component);

    expect(pool.totalPools).toBe(1);
    expect(pool.size).toBe(1);
    expect(pool.free).toBe(1);
    expect(pool.used).toBe(0);
  });
});
