/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { ObjectPool } from './object-pool';

describe('ObjectPool', () => {
  it('should construct with and without an initial size argument', () => {
    class ExampleClass {}

    const factory = () => new ExampleClass();

    const poolWithoutSize = new ObjectPool(factory);
    expect(poolWithoutSize.totalSize).toBe(0);
    expect(poolWithoutSize.totalFree).toBe(0);
    expect(poolWithoutSize.totalUsed).toBe(0);

    const poolWithSize = new ObjectPool(factory, 1);
    expect(poolWithSize.totalSize).toBe(1);
    expect(poolWithSize.totalFree).toBe(1);
    expect(poolWithSize.totalUsed).toBe(0);
  });

  it('should provide an object on request', () => {
    class ExampleClass {}

    const factory = () => new ExampleClass();

    const pool = new ObjectPool(factory, 1);

    const object = pool.request();

    expect(object instanceof ExampleClass).toBeTruthy();
    expect(pool.totalSize).toBe(1);
    expect(pool.totalFree).toBe(0);
    expect(pool.totalUsed).toBe(1);
  });

  it('should reuse released objects', () => {
    class ExampleClass {}

    const factory = () => new ExampleClass();

    const pool = new ObjectPool(factory, 1);

    const objectOne = pool.request();

    expect(pool.totalSize).toBe(1);
    expect(pool.totalFree).toBe(0);
    expect(pool.totalUsed).toBe(1);

    pool.release(objectOne);

    expect(pool.totalSize).toBe(1);
    expect(pool.totalFree).toBe(1);
    expect(pool.totalUsed).toBe(0);

    const objectTwo = pool.request();

    expect(pool.totalSize).toBe(1);
    expect(pool.totalFree).toBe(0);
    expect(pool.totalUsed).toBe(1);

    pool.release(objectTwo);

    expect(pool.totalSize).toBe(1);
    expect(pool.totalFree).toBe(1);
    expect(pool.totalUsed).toBe(0);
  });

  it('should grow the pool on request if there are no objects available', () => {
    class ExampleClass {}

    const factory = () => new ExampleClass();

    const pool = new ObjectPool(factory, 10);

    for (let i = 0; i < 10; i++) {
      pool.request();
    }

    expect(pool.totalSize).toBe(10);
    expect(pool.totalFree).toBe(0);
    expect(pool.totalUsed).toBe(10);

    pool.request();

    expect(pool.totalSize).toBe(13); // grow by 20% - ((10 * 0.2) + 1) = 13
    expect(pool.totalFree).toBe(2);
    expect(pool.totalUsed).toBe(11);
  });
});
