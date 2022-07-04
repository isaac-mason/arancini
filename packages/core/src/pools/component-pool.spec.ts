/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { Component } from '../component';
import { ComponentPool } from './component-pool';

describe('ComponentPool', () => {
  class ExampleComponentOne extends Component {}
  class ExampleComponentTwo extends Component {}

  let pool: ComponentPool;

  beforeEach(() => {
    pool = new ComponentPool();
  });

  it('should create a new pool on retrieving a component for the first time', () => {
    expect(pool.totalPools).toBe(0);
    expect(pool.totalSize).toBe(0);
    expect(pool.totalFree).toBe(0);
    expect(pool.totalUsed).toBe(0);

    const componentOne = pool.request(ExampleComponentOne);

    expect(pool.totalPools).toBe(1);
    expect(pool.totalSize).toBe(1);
    expect(pool.totalFree).toBe(0);
    expect(pool.totalUsed).toBe(1);
    expect(componentOne).toBeTruthy();
    expect(componentOne instanceof ExampleComponentOne).toBeTruthy();

    const componentTwo = pool.request(ExampleComponentOne);
    expect(pool.totalPools).toBe(1);
    expect(pool.totalSize).toBe(2);
    expect(pool.totalFree).toBe(0);
    expect(pool.totalUsed).toBe(2);

    expect(componentTwo).toBeTruthy();
    expect(componentTwo instanceof ExampleComponentOne).toBeTruthy();

    const componentThree = pool.request(ExampleComponentTwo);
    expect(componentThree).toBeTruthy();
    expect(componentThree instanceof ExampleComponentTwo).toBeTruthy();
    expect(pool.totalPools).toBe(2);
    expect(pool.totalSize).toBe(3);
    expect(pool.totalFree).toBe(0);
    expect(pool.totalUsed).toBe(3);
  });

  it('should release components', () => {
    expect(pool.totalPools).toBe(0);
    expect(pool.totalSize).toBe(0);
    expect(pool.totalFree).toBe(0);
    expect(pool.totalUsed).toBe(0);

    const component = pool.request(ExampleComponentOne);

    expect(pool.totalPools).toBe(1);
    expect(pool.totalSize).toBe(1);
    expect(pool.totalFree).toBe(0);
    expect(pool.totalUsed).toBe(1);

    expect(component).toBeTruthy();
    expect(component instanceof ExampleComponentOne).toBeTruthy();

    pool.release(component);

    expect(pool.totalPools).toBe(1);
    expect(pool.totalSize).toBe(1);
    expect(pool.totalFree).toBe(1);
    expect(pool.totalUsed).toBe(0);
  });
});
