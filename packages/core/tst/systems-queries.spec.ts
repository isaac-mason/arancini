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
    it('can create queries for components', () => {
      // system with query for both TestComponentOne and TestComponentTwo
      class TestSystem extends System {
        testQueryName!: Query;

        onInit(): void {
          this.testQueryName = this.query({
            all: [TestComponentOne, TestComponentTwo],
          });
        }
      }
      const system = world.addSystem(new TestSystem());

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
      world.addSystem(new TestSystem());

      expect(world.initialised).toBe(true);

      const timeElapsedUpdateOne = 1;
      const timeElapsedUpdateTwo = 2;
      world.update(timeElapsedUpdateOne);
      world.update(timeElapsedUpdateTwo);

      world.destroy();

      expect(systemInitJestFn).toHaveBeenCalledTimes(1);

      expect(systemUpdateJestFn).toHaveBeenCalledTimes(2);
      expect(systemUpdateJestFn.mock.calls[0][0]).toBe(timeElapsedUpdateOne);
      expect(systemUpdateJestFn.mock.calls[1][0]).toBe(timeElapsedUpdateTwo);

      expect(systemDestroyJestFn).toHaveBeenCalledTimes(1);
    });

    describe('System removal', () => {
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
        const systemOne = new TestSystemOne();
        world.addSystem(systemOne);

        const systemTwo = new TestSystemTwo();
        world.addSystem(systemTwo);

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

        const systemOne = new TestSystemOne();
        world.addSystem(systemOne);

        const systemTwo = new TestSystemTwo();
        world.addSystem(systemTwo);

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

      const system = world.addSystem(new TestSystem());

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

      const system = world.addSystem(new TestSystem());

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

      const system = world.addSystem(new TestSystem());

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

      const system = world.addSystem(new TestSystem());

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
