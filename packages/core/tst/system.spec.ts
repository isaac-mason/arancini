/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { Component, World, System, Query, Space } from '../src';

class TestComponentOne extends Component {}
class TestComponentTwo extends Component {}
class TestComponentThree extends Component {}
class TestComponentFour extends Component {}
class TestComponentFive extends Component {}
class TestComponentSix extends Component {}

describe('System', () => {
  let world: World;
  let space: Space;

  beforeEach(() => {
    world = new World();
    world.init();

    space = world.create.space();

    world.registerComponent(TestComponentOne);
    world.registerComponent(TestComponentTwo);
    world.registerComponent(TestComponentThree);
    world.registerComponent(TestComponentFour);
    world.registerComponent(TestComponentFive);
    world.registerComponent(TestComponentSix);
  });

  test('Systems are initialised on initialising the world', () => {
    world = new World();
    space = world.create.space();

    const systemInitFn = jest.fn();

    class TestSystem extends System {
      onInit(): void {
        systemInitFn();
      }
    }

    world.registerSystem(TestSystem);

    expect(systemInitFn).not.toHaveBeenCalled();

    world.init();

    expect(systemInitFn).toHaveBeenCalled();
  });

  test('Systems can create Queries for Entities based on Components', () => {
    // system with query for both TestComponentOne and TestComponentTwo
    class TestSystem extends System {
      testQueryName!: Query;

      onInit(): void {
        this.testQueryName = this.query({
          all: [TestComponentOne, TestComponentTwo],
        });
      }
    }

    world.registerSystem(TestSystem);
    const system = world.getSystem(TestSystem) as TestSystem;

    // create entity that matches query
    const entity = space.create.entity();
    entity.addComponent(TestComponentOne);
    entity.addComponent(TestComponentTwo);

    expect(system.testQueryName.added.length).toBe(1);
    expect(system.testQueryName.removed.length).toBe(0);
    expect(system.testQueryName.all.length).toBe(1);

    // update, clearing added and removed arrays
    world.update();

    // remove component, assert removal is reflected in the query
    entity.removeComponent(TestComponentOne);

    expect(system.testQueryName.all.length).toBe(0);
    expect(system.testQueryName.removed.length).toBe(1);
    expect(system.testQueryName.all.length).toBe(0);
  });

  test('System Queries mainain seperate Query "added" and "removed" event arrays when multiple Systems have the same queries', () => {
    class TestSystemOne extends System {
      testQueryName!: Query;

      onInit(): void {
        this.testQueryName = this.query({
          all: [TestComponentOne, TestComponentTwo],
        });
      }

      onUpdate() {
        /* noop, but defined */
      }
    }

    class TestSystemTwo extends System {
      testQueryName!: Query;

      onInit(): void {
        this.testQueryName = this.query({
          all: [TestComponentOne, TestComponentTwo],
        });
      }
    }

    // register TestSystemOne
    world.registerSystem(TestSystemOne);

    const testSystemOne = world.getSystem(TestSystemOne) as TestSystemOne;

    // create entity that matches the query in both systems
    const entity = space.create.entity();
    entity.addComponent(TestComponentOne);
    entity.addComponent(TestComponentTwo);

    // entity should be in TestSystemOne query
    expect(testSystemOne.testQueryName.added.length).toBe(1);
    expect(testSystemOne.testQueryName.removed.length).toBe(0);
    expect(testSystemOne.testQueryName.all.length).toBe(1);

    // update, should clear added and removed for TestSystemOne
    world.update();
    expect(testSystemOne.testQueryName.added.length).toBe(0);
    expect(testSystemOne.testQueryName.removed.length).toBe(0);
    expect(testSystemOne.testQueryName.all.length).toBe(1);

    // register TestSystemTwo
    world.registerSystem(TestSystemTwo);
    const testSystemTwo = world.getSystem(TestSystemTwo) as TestSystemTwo;

    // TestSystemTwo should have 1 entity in added
    expect(testSystemTwo.testQueryName.added.length).toBe(1);
    expect(testSystemTwo.testQueryName.removed.length).toBe(0);
    expect(testSystemTwo.testQueryName.all.length).toBe(1);
  });

  test('Systems will have onInit, onUpdate, and onDestroy lifecycle methods called', () => {
    const systemInitJestFn = jest.fn();
    const systemUpdateJestFn = jest.fn();
    const systemDestroyJestFn = jest.fn();
    class TestSystem extends System {
      onDestroy(): void {
        systemDestroyJestFn();
      }

      onInit(): void {
        systemInitJestFn();
      }

      onUpdate(delta: number): void {
        systemUpdateJestFn(delta);
      }
    }

    world.registerSystem(TestSystem);
    const testSystem = world.getSystem(TestSystem) as TestSystem;

    expect(world.initialised).toBe(true);

    const deltaUpdateOne = 1;
    const deltaUpdateTwo = 2;

    world.update(deltaUpdateOne);
    world.update(deltaUpdateTwo);

    testSystem.enabled = false;
    world.update();

    world.destroy();

    expect(systemInitJestFn).toHaveBeenCalledTimes(1);

    expect(systemUpdateJestFn).toHaveBeenCalledTimes(2);
    expect(systemUpdateJestFn.mock.calls[0][0]).toBe(deltaUpdateOne);
    expect(systemUpdateJestFn.mock.calls[1][0]).toBe(deltaUpdateTwo);

    expect(systemDestroyJestFn).toHaveBeenCalledTimes(1);
  });

  describe('System registration', () => {
    const systemUpdateFn = jest.fn();

    class SystemOne extends System {
      onUpdate(): void {
        systemUpdateFn(SystemOne);
      }
    }

    class SystemTwo extends System {
      onUpdate(): void {
        systemUpdateFn(SystemTwo);
      }
    }

    class SystemThree extends System {
      onUpdate(): void {
        systemUpdateFn(SystemThree);
      }
    }

    class SystemFour extends System {
      onUpdate(): void {
        systemUpdateFn(SystemFour);
      }
    }

    beforeEach(() => {
      systemUpdateFn.mockReset();
    });

    it('silently swallows attempting to unregister a system that is not registered or has already been unregistered', () => {
      expect(() => {
        world
          .unregisterSystem(SystemOne)
          .registerSystem(SystemOne)
          .unregisterSystem(SystemOne)
          .unregisterSystem(SystemOne);
      }).not.toThrowError();
    });

    it('throws an error on attempting to re-register a system', () => {
      expect(() => {
        world.registerSystem(SystemOne).registerSystem(SystemOne);
      }).toThrowError();
    });

    it('defaults to sorting systems by insertion order', () => {
      world
        .registerSystem(SystemOne)
        .registerSystem(SystemTwo)
        .registerSystem(SystemThree)
        .registerSystem(SystemFour);

      expect(world.getSystems().map((s) => s.__recs.class)).toEqual([
        SystemOne,
        SystemTwo,
        SystemThree,
        SystemFour,
      ]);

      world.update();

      expect(systemUpdateFn).toHaveBeenCalledTimes(4);
      expect(systemUpdateFn).nthCalledWith(1, SystemOne);
      expect(systemUpdateFn).nthCalledWith(2, SystemTwo);
      expect(systemUpdateFn).nthCalledWith(3, SystemThree);
      expect(systemUpdateFn).nthCalledWith(4, SystemFour);
    });

    it('supports sorting with an optional system priority', () => {
      world
        .registerSystem(SystemOne, { priority: -100 })
        .registerSystem(SystemTwo)
        .registerSystem(SystemThree, { priority: -50 })
        .registerSystem(SystemFour);

      expect(world.getSystems().map((s) => s.__recs.class)).toEqual([
        SystemOne,
        SystemTwo,
        SystemThree,
        SystemFour,
      ]);

      world.update();

      expect(systemUpdateFn).toHaveBeenCalledTimes(4);
      expect(systemUpdateFn).nthCalledWith(1, SystemTwo);
      expect(systemUpdateFn).nthCalledWith(2, SystemFour);
      expect(systemUpdateFn).nthCalledWith(3, SystemThree);
      expect(systemUpdateFn).nthCalledWith(4, SystemOne);
    });
  });

  describe('System unregistration', () => {
    const description = {
      all: [TestComponentOne],
    };

    class TestSystemOne extends System {
      example!: Query;

      onInit(): void {
        this.example = this.query(description);
      }
    }
    class TestSystemTwo extends System {
      example!: Query;

      onInit(): void {
        this.example = this.query(description);
      }
    }

    test('Systems can be removed, and queries will be removed if they are no longer used by any systems', () => {
      world.registerSystem(TestSystemOne);
      const systemOne = world.getSystem(TestSystemOne) as TestSystemOne;

      world.registerSystem(TestSystemTwo);
      const systemTwo = world.getSystem(TestSystemTwo) as TestSystemTwo;

      expect(
        world.queryManager.hasQuery({
          all: [TestComponentOne],
        })
      ).toBe(true);

      systemOne.destroy();

      expect(
        world.queryManager.hasQuery({
          all: [TestComponentOne],
        })
      ).toBe(true);

      systemTwo.destroy();

      expect(
        world.queryManager.hasQuery({
          all: [TestComponentOne],
        })
      ).toBe(false);
    });

    test('Systems can be removed, and queries will not be removed if they are used standalone outside of systems', () => {
      // use the query outside of a system
      const query = world.create.query(description);

      world.registerSystem(TestSystemOne);
      const systemOne = world.getSystem(TestSystemOne) as TestSystemOne;

      world.registerSystem(TestSystemTwo);
      const systemTwo = world.getSystem(TestSystemTwo) as TestSystemTwo;

      // assert the query exists
      expect(
        world.queryManager.hasQuery({
          all: [TestComponentOne],
        })
      ).toBe(true);

      // destroy both systems using the query
      systemOne.destroy();
      systemTwo.destroy();

      expect(
        world.queryManager.hasQuery({
          all: [TestComponentOne],
        })
      ).toBe(true);

      // remove the query manually
      query.destroy();

      expect(
        world.queryManager.hasQuery({
          all: [TestComponentOne],
        })
      ).toBe(false);
    });
  });
});
