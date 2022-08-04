/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import {
  Component,
  World,
  System,
  QueryDescription,
  Query,
  Space,
} from '../src';

class TestComponentOne extends Component {}
class TestComponentTwo extends Component {}
class TestComponentThree extends Component {}
class TestComponentFour extends Component {}
class TestComponentFive extends Component {}
class TestComponentSix extends Component {}

describe('Systems and Queries Integration Tests', () => {
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

  describe('Systems', () => {
    it('initialises systems on initialising the world', () => {
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

    it('can create queries for Entities based on Components', () => {
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

      // remove component immediately so it is reflected in the query
      entity.removeComponent(TestComponentOne, { immediately: true });

      expect(system.testQueryName.all.length).toBe(0);
      expect(system.testQueryName.removed.length).toBe(1);
      expect(system.testQueryName.all.length).toBe(0);
    });

    it('mainains seperate Query "added" and "removed" event arrays when multiple Systems have the same queries', () => {
      class TestSystemOne extends System {
        testQueryName!: Query;

        onInit(): void {
          this.testQueryName = this.query({
            all: [TestComponentOne, TestComponentTwo],
          });
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

    it('will have onInit, onUpdate, and onDestroy lifecycle methods called', () => {
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

        onUpdate(timeElapsed: number): void {
          systemUpdateJestFn(timeElapsed);
        }
      }

      world.registerSystem(TestSystem);
      const testSystem = world.getSystem(TestSystem) as TestSystem;

      expect(world.initialised).toBe(true);

      const timeElapsedUpdateOne = 1;
      const timeElapsedUpdateTwo = 2;

      world.update(timeElapsedUpdateOne);
      world.update(timeElapsedUpdateTwo);

      testSystem.enabled = false;
      world.update();

      world.destroy();

      expect(systemInitJestFn).toHaveBeenCalledTimes(1);

      expect(systemUpdateJestFn).toHaveBeenCalledTimes(2);
      expect(systemUpdateJestFn.mock.calls[0][0]).toBe(timeElapsedUpdateOne);
      expect(systemUpdateJestFn.mock.calls[1][0]).toBe(timeElapsedUpdateTwo);

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
          .registerSystem(SystemThree);

        expect(world.getSystems().map((s) => s.__recs.clazz)).toEqual([
          SystemOne,
          SystemTwo,
          SystemThree,
        ]);

        world.update();

        expect(systemUpdateFn).toHaveBeenCalledTimes(3);
        expect(systemUpdateFn).nthCalledWith(1, SystemOne);
        expect(systemUpdateFn).nthCalledWith(2, SystemTwo);
        expect(systemUpdateFn).nthCalledWith(3, SystemThree);
      });

      it('supports sorting with an optional system priority', () => {
        world
          .registerSystem(SystemOne, { priority: -100 })
          .registerSystem(SystemTwo)
          .registerSystem(SystemThree);

        expect(world.getSystems().map((s) => s.__recs.clazz)).toEqual([
          SystemOne,
          SystemTwo,
          SystemThree,
        ]);

        world.update();

        expect(systemUpdateFn).toHaveBeenCalledTimes(3);
        expect(systemUpdateFn).nthCalledWith(2, SystemTwo);
        expect(systemUpdateFn).nthCalledWith(3, SystemThree);
        expect(systemUpdateFn).nthCalledWith(1, SystemOne);
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

      it('systems can be removed, and queries will be removed if they are no longer used by any systems', () => {
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

      it('systems can be removed, and queries will not be removed if they are used standalone outside of systems', () => {
        // use the query outside of a system
        const query = world.query(description);

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
        world.remove(query);

        expect(
          world.queryManager.hasQuery({
            all: [TestComponentOne],
          })
        ).toBe(false);
      });
    });
  });

  describe('Query', () => {
    it('should throw an error when attempting to create a query with no conditions', () => {
      expect(() => {
        world.query({});
      }).toThrow();
    });

    it('should be populated with existing entities on creation', () => {
      // query for TestComponentOne
      const description: QueryDescription = {
        all: [TestComponentOne],
      };

      // create entity matching query
      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);

      // create query
      const query = world.query(description);

      // query is populated with existing entity
      expect(query).toBeTruthy();
      expect(query.all.length).toBe(1);
      expect(query.all.includes(entity)).toBeTruthy();
    });

    it('should reuse existing equivalent queries', () => {
      const descriptionOne: QueryDescription = {
        all: [TestComponentOne],
      };

      const descriptionTwo: QueryDescription = [TestComponentOne];

      const queryOne = world.query(descriptionOne);
      const queryTwo = world.query(descriptionTwo);

      expect(queryOne).toBeTruthy();
      expect(queryTwo).toBeTruthy();

      expect(queryOne).toEqual(queryTwo);
    });

    it('can be removed from a world', () => {
      // query for TestComponentOne
      const description: QueryDescription = {
        all: [TestComponentOne],
      };
      const query = world.query(description);

      // create entity matching the query
      const entityOne = space.create.entity();
      entityOne.addComponent(TestComponentOne);

      world.update();

      expect(query).toBeTruthy();
      expect(query.all.length).toBe(1);
      expect(query.all.includes(entityOne)).toBeTruthy();

      // remove the query
      world.remove(query);

      // create entity matching the query
      const entityTwo = space.create.entity();
      entityTwo.addComponent(TestComponentOne);

      world.update();

      // no change to query
      expect(query).toBeTruthy();
      expect(query.all.length).toBe(1);
      expect(query.all.includes(entityOne)).toBeTruthy();
      expect(query.all.includes(entityTwo)).toBeFalsy();
    });
  });

  describe('queryOnce', () => {
    it('should generate new query results if the same query does not already exists', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      };

      // create an entity matching the query
      const entityOne = space.create.entity();
      entityOne.addComponent(TestComponentOne);

      // create another entity that matches the query
      const entityTwo = space.create.entity();
      entityTwo.addComponent(TestComponentOne);

      // get query results
      const queryResults = world.queryOnce(description);
      expect(queryResults).toBeTruthy();
      expect(queryResults.length).toBe(2);
      expect(queryResults.includes(entityOne)).toBeTruthy();
      expect(queryResults.includes(entityTwo)).toBeTruthy();
    });

    it('should reuse query results if the same query already exists', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      };

      const entityOne = space.create.entity();
      entityOne.addComponent(TestComponentOne);

      const activeQuery = world.query(description);

      world.update();

      const entityTwo = space.create.entity();
      entityTwo.addComponent(TestComponentOne);

      const onceOffQueryResults = world.queryOnce(description);

      // once-off query results should be the same as the active query results
      expect(onceOffQueryResults).toBeTruthy();
      expect(onceOffQueryResults.includes(entityOne)).toBeTruthy();
      expect(onceOffQueryResults.length).toBe(activeQuery.all.length);
    });
  });

  describe('Query Evaluation', () => {
    it('updates system query results if an entity matches a query with the ONE condition', () => {
      class TestSystem extends System {
        test!: Query;

        onInit(): void {
          this.test = this.query({ any: [TestComponentOne, TestComponentTwo] });
        }
      }

      world.registerSystem(TestSystem);
      const system = world.getSystem(TestSystem) as TestSystem;

      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();

      world.update();

      entity.removeComponent(TestComponentOne, { immediately: true });

      expect(system.test.added.length).toBe(0);
      expect(system.test.all.length).toBe(0);
      expect(system.test.removed.length).toBe(1);

      expect(system.test.all.includes(entity)).toBeFalsy();
      expect(system.test.added.includes(entity)).toBeFalsy();
      expect(system.test.removed.includes(entity)).toBeTruthy();

      world.update();
    });

    it('updates system query results if an entity matches a query with the NOT condition', () => {
      class TestSystem extends System {
        test!: Query;

        onInit(): void {
          this.test = this.query({ not: [TestComponentOne] });
        }
      }

      world.registerSystem(TestSystem);
      const system = world.getSystem(TestSystem) as TestSystem;

      const entity = space.create.entity();
      entity.addComponent(TestComponentTwo);

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();

      world.update();

      entity.addComponent(TestComponentOne);

      expect(system.test.added.length).toBe(0);
      expect(system.test.all.length).toBe(0);
      expect(system.test.removed.length).toBe(1);

      expect(system.test.all.includes(entity)).toBeFalsy();
      expect(system.test.added.includes(entity)).toBeFalsy();
      expect(system.test.removed.includes(entity)).toBeTruthy();
    });

    it('updates system query results if an entity matches a query with the ALL condition', () => {
      class TestSystem extends System {
        test!: Query;

        onInit(): void {
          this.test = this.query([
            TestComponentOne,
            TestComponentTwo,
            TestComponentThree,
          ]);
        }
      }

      world.registerSystem(TestSystem);
      const system = world.getSystem(TestSystem) as TestSystem;

      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);
      entity.addComponent(TestComponentTwo);
      entity.addComponent(TestComponentThree);

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();

      world.update();

      entity.removeComponent(TestComponentThree, { immediately: true });

      expect(system.test.added.length).toBe(0);
      expect(system.test.all.length).toBe(0);
      expect(system.test.removed.length).toBe(1);

      expect(system.test.all.includes(entity)).toBeFalsy();
      expect(system.test.added.includes(entity)).toBeFalsy();
      expect(system.test.removed.includes(entity)).toBeTruthy();
    });

    it('updates system query results if an entity matches a query with multiple conditions', () => {
      class TestSystem extends System {
        test!: Query;

        onInit(): void {
          this.test = this.query({
            all: [TestComponentOne, TestComponentTwo],
            any: [TestComponentThree, TestComponentFour],
            not: [TestComponentFive, TestComponentSix],
          });
        }
      }

      world.registerSystem(TestSystem);
      const system = world.getSystem(TestSystem) as TestSystem;

      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);
      entity.addComponent(TestComponentTwo);
      entity.addComponent(TestComponentFour);

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();
    });

    it('should remove destroyed entities from all queries', () => {
      // query for TestComponentOne
      const description: QueryDescription = {
        all: [TestComponentOne],
      };
      const query = world.query(description);

      expect(query.all.length).toBe(0);

      // create entity that matches query
      const entityOne = space.create.entity();
      entityOne.addComponent(TestComponentOne);

      // create another entity that matches query
      const entityTwo = space.create.entity();
      entityTwo.addComponent(TestComponentOne);
      entityTwo.addComponent(TestComponentTwo);

      expect(query.all.length).toBe(2);
      expect(query.all.includes(entityOne)).toBeTruthy();
      expect(query.all.includes(entityTwo)).toBeTruthy();

      // update, flushing added and removed
      world.update();

      // destroy entityOne immediately, removing it from the query
      entityOne.destroy({ immediately: true });

      expect(query.all.length).toBe(1);
      expect(query.all.includes(entityOne)).toBeFalsy();
      expect(query.all.includes(entityTwo)).toBeTruthy();
    });
  });
});
