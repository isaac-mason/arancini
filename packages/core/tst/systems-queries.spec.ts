/* eslint-disable max-classes-per-file */
import { describe, it, expect } from '@jest/globals';
import { Component, World, System, QueryDescription, Query } from '../src';

class TestComponentOne extends Component {}
class TestComponentTwo extends Component {}
class TestComponentThree extends Component {}
class TestComponentFour extends Component {}
class TestComponentFive extends Component {}
class TestComponentSix extends Component {}

describe('Systems and Queries Integration Tests', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
    world.init();
  });

  describe('Systems', () => {
    it('systems can contain queries for components', () => {
      class TestSystem extends System {
        testQueryName!: Query;

        onInit(): void {
          this.testQueryName = this.query({
            all: [TestComponentOne, TestComponentTwo],
          });
        }
      }

      const system = world.addSystem(new TestSystem());

      const space = world.create.space();

      const entity = space.create.entity();

      entity.addComponent(TestComponentOne);
      entity.addComponent(TestComponentTwo);

      expect(system.testQueryName.all.length).toBe(0);
      expect(system.testQueryName.added.length).toBe(0);
      expect(system.testQueryName.removed.length).toBe(0);

      world.update(1);

      expect(system.testQueryName.added.length).toBe(1);
      expect(system.testQueryName.removed.length).toBe(0);
      expect(system.testQueryName.all.length).toBe(1);

      entity.removeComponent(TestComponentOne);

      expect(system.testQueryName.all.length).toBe(1);
      expect(system.testQueryName.removed.length).toBe(0);
      expect(system.testQueryName.all.length).toBe(1);

      world.update(1);

      expect(system.testQueryName.all.length).toBe(0);
      expect(system.testQueryName.removed.length).toBe(1);
      expect(system.testQueryName.all.length).toBe(0);
    });

    it('recs will call system onInit, onUpdate, and onDestroy methods', () => {
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

    it('systems can be removed, and queries will be removed if they are no longer used by any systems', () => {
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

  describe('Query Creation', () => {
    it('on creating a new query, it should be populated with existing entities', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      };

      const space = world.create.space();
      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);

      const query = world.query(description);

      expect(query).toBeTruthy();
      expect(query.all.length).toBe(1);
      expect(query.all.includes(entity)).toBeTruthy();
    });

    it('should reuse existing queries', () => {
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

    it('should be able to remove a query from a world and stop updating it', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      };

      const space = world.create.space();

      const query = world.query(description);

      const entityOne = space.create.entity();
      entityOne.addComponent(TestComponentOne);

      world.update(1);

      expect(query).toBeTruthy();
      expect(query.all.length).toBe(1);
      expect(query.all.includes(entityOne)).toBeTruthy();

      world.remove(query);

      const entityTwo = space.create.entity();
      entityTwo.addComponent(TestComponentOne);

      world.update(1);

      expect(query).toBeTruthy();
      expect(query.all.length).toBe(1);
      expect(query.all.includes(entityOne)).toBeTruthy();
      expect(query.all.includes(entityTwo)).toBeFalsy();
    });
  });

  describe('Once-off Queries', () => {
    class TestComponent extends Component {}

    it('should by default generate new query results, even if the same query already exists', () => {
      const description: QueryDescription = {
        all: [TestComponent],
      };

      const space = world.create.space();

      const entityOne = space.create.entity();
      entityOne.addComponent(TestComponent);

      const query = world.query(description);

      world.update();

      const entityTwo = space.create.entity();
      entityTwo.addComponent(TestComponent);

      const onceOffQueryResults = world.queryOnce(description);

      // persisted query should not have updated yet
      expect(query).toBeTruthy();
      expect(query.all.length).toBe(1);
      expect(onceOffQueryResults.includes(entityOne)).toBeTruthy();

      // once of query results should have done a fresh query and have both entities
      expect(onceOffQueryResults).toBeTruthy();
      expect(onceOffQueryResults.length).toBe(2);
      expect(onceOffQueryResults.includes(entityOne)).toBeTruthy();
      expect(onceOffQueryResults.includes(entityTwo)).toBeTruthy();
    });

    it('should reuse query results if "useExisting" option is true', () => {
      const description: QueryDescription = {
        all: [TestComponent],
      };

      const space = world.create.space();

      const entityOne = space.create.entity();
      entityOne.addComponent(TestComponent);

      const query = world.query(description);

      world.update();

      const entityTwo = space.create.entity();
      entityTwo.addComponent(TestComponent);

      const onceOffQueryResults = world.queryOnce(description, {
        useExisting: true,
      });

      // persisted query should not have updated yet
      expect(query).toBeTruthy();
      expect(query.all.length).toBe(1);
      expect(onceOffQueryResults.includes(entityOne)).toBeTruthy();

      // reused query results should not have updated yet
      expect(onceOffQueryResults).toBeTruthy();
      expect(onceOffQueryResults.length).toBe(1);
      expect(onceOffQueryResults.includes(entityOne)).toBeTruthy();
    });
  });

  describe('On Entity Component Changes', () => {
    it('should add entities to a query if the entity matches the query', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      };

      let query = world.queryManager.getQuery(description);

      expect(world.queryManager.queries.size).toBe(1);

      const space = world.create.space();

      const entityOne = space.create.entity();

      entityOne.addComponent(TestComponentOne);

      const entityTwo = space.create.entity();

      entityTwo.addComponent(TestComponentTwo);

      query = world.queryManager.getQuery(description);

      world.update(1);

      expect(query.all.length).toBe(1);
      expect(query.all.includes(entityOne)).toBeTruthy();
      expect(query.all.includes(entityTwo)).toBeFalsy();
    });

    it('should remove entities from a query if an entity no longer matches the query', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      };

      let query = world.queryManager.getQuery(description);
      expect(world.queryManager.queries.size).toBe(1);
      expect(query.all.length).toBe(0);

      const space = world.create.space();

      const entityOne = space.create.entity();

      entityOne.addComponent(TestComponentOne);

      const entityTwo = space.create.entity();

      entityTwo.addComponent(TestComponentOne);
      entityTwo.addComponent(TestComponentTwo);

      world.update(1);

      expect(query.all.length).toBe(2);
      expect(query.all.includes(entityOne)).toBeTruthy();
      expect(query.all.includes(entityTwo)).toBeTruthy();

      const entityOneComponentOne = entityOne.get(TestComponentOne);
      entityOne.removeComponent(entityOneComponentOne);

      const entityTwoComponentTwo = entityTwo.get(TestComponentTwo);
      entityTwo.removeComponent(entityTwoComponentTwo);

      world.update(1);

      query = world.queryManager.getQuery(description);

      expect(query.all.length).toBe(1);
      expect(query.all.includes(entityOne)).toBeFalsy();
      expect(query.all.includes(entityTwo)).toBeTruthy();
    });

    it('should not put entities in added or removed if the query un-matches then matches again between updates', () => {
      const description: QueryDescription = {
        one: [TestComponentOne, TestComponentTwo],
      };

      const query = world.queryManager.getQuery(description);
      expect(world.queryManager.queries.size).toBe(1);
      expect(query.all.length).toBe(0);

      const space = world.create.space();

      const entity = space.create.entity();

      entity.addComponent(TestComponentOne);

      world.update(1);

      expect(query.all.length).toBe(1);
      expect(query.all.includes(entity)).toBeTruthy();
      expect(query.added.length).toBe(1);
      expect(query.added.includes(entity)).toBeTruthy();
      expect(query.removed.length).toBe(0);

      entity.removeComponent(TestComponentOne);
      entity.addComponent(TestComponentTwo);

      world.update(1);

      expect(query.all.length).toBe(1);
      expect(query.all.includes(entity)).toBeTruthy();
      expect(query.added.length).toBe(0);
      expect(query.removed.length).toBe(0);
    });

    it('should keep track of multiple separate queries', () => {
      const query = world.query([TestComponentOne, TestComponentTwo]);

      let updates = 0;
      const exampleFunctionSystem = () => {
        query.all.forEach(() => {
          updates++;
        });
      };

      const space = world.create.space();

      const entity1 = space.create.entity();
      const entity2 = space.create.entity();

      entity1.addComponent(TestComponentOne);
      entity1.addComponent(TestComponentTwo);

      entity2.addComponent(TestComponentOne);
      entity2.addComponent(TestComponentTwo);

      world.update();
      exampleFunctionSystem();
      expect(query.all.length).toBe(2);
      expect(updates).toBe(2);

      entity1.removeComponent(TestComponentOne);

      world.update();
      exampleFunctionSystem();
      expect(query.all.length).toBe(1);
      expect(updates).toBe(3);

      entity1.destroy();

      const entity3 = space.create.entity();
      const entity4 = space.create.entity();

      entity3.addComponent(TestComponentOne);
      entity3.addComponent(TestComponentTwo);

      entity4.addComponent(TestComponentOne);
      entity4.addComponent(TestComponentTwo);

      world.update();
      exampleFunctionSystem();
      expect(query.all.length).toBe(3);
      expect(updates).toBe(6);

      entity4.removeComponent(TestComponentOne);

      world.update();
      exampleFunctionSystem();
      expect(query.all.length).toBe(2);
      expect(updates).toBe(8);

      entity4.destroy();

      expect(query.all.length).toBe(2);
      expect(updates).toBe(8);

      const entity5 = space.create.entity();
      const entity6 = space.create.entity();

      entity5.addComponent(TestComponentOne);
      entity5.addComponent(TestComponentTwo);

      entity6.addComponent(TestComponentOne);
      entity6.addComponent(TestComponentTwo);

      world.update();
      exampleFunctionSystem();
      expect(query.all.length).toBe(4);
      expect(updates).toBe(12);

      entity6.removeComponent(TestComponentOne);

      world.update();
      exampleFunctionSystem();
      expect(query.all.length).toBe(3);
      expect(updates).toBe(15);
    });
  });

  describe('Entity Removal', () => {
    it('should remove the entity from all queries', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      };

      const query = world.queryManager.getQuery(description);

      expect(world.queryManager.queries.size).toBe(1);

      expect(query.all.length).toBe(0);

      const space = world.create.space();

      const entityOne = space.create.entity();

      entityOne.addComponent(TestComponentOne);

      const entityTwo = space.create.entity();

      entityTwo.addComponent(TestComponentOne);
      entityTwo.addComponent(TestComponentTwo);

      world.update(1);

      expect(query.all.length).toBe(2);
      expect(query.all.includes(entityOne)).toBeTruthy();
      expect(query.all.includes(entityTwo)).toBeTruthy();

      entityOne.destroy();

      expect(query.all.length).toBe(2);
      expect(query.all.includes(entityOne)).toBeTruthy();
      expect(query.all.includes(entityTwo)).toBeTruthy();

      world.update(1);

      expect(query.all.length).toBe(1);
      expect(query.all.includes(entityOne)).toBeFalsy();
      expect(query.all.includes(entityTwo)).toBeTruthy();
    });
  });

  describe('Query Matching', () => {
    it('updates system query results if an entity matches a query with the ONE condition', () => {
      class TestSystem extends System {
        test!: Query;

        onInit(): void {
          this.test = this.query({ one: [TestComponentOne, TestComponentTwo] });
        }
      }

      const system = world.addSystem(new TestSystem());

      const space = world.create.space();

      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);

      world.update(1);

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();
    });

    it('does not update system query results an entity does not match a query with the ONE condition', () => {
      class TestSystem extends System {
        test!: Query;

        onInit(): void {
          this.test = this.query({ one: [TestComponentOne, TestComponentTwo] });
        }
      }

      const system = world.addSystem(new TestSystem());

      const space = world.create.space();

      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);

      world.update();

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();

      entity.removeComponent(TestComponentOne);

      world.update();

      expect(system.test.added.length).toBe(0);
      expect(system.test.all.length).toBe(0);
      expect(system.test.removed.length).toBe(1);

      expect(system.test.all.includes(entity)).toBeFalsy();
      expect(system.test.added.includes(entity)).toBeFalsy();
      expect(system.test.removed.includes(entity)).toBeTruthy();
    });

    it('updates system query results if an entity matches a query with the NOT condition', () => {
      class TestSystem extends System {
        test!: Query;

        onInit(): void {
          this.test = this.query({ not: [TestComponentOne] });
        }
      }

      const system = world.addSystem(new TestSystem());

      const space = world.create.space();

      const entity = space.create.entity();
      entity.addComponent(TestComponentTwo);

      world.update(1);

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();

      entity.addComponent(TestComponentOne);

      world.update(1);

      expect(system.test.added.length).toBe(0);
      expect(system.test.all.length).toBe(0);
      expect(system.test.removed.length).toBe(1);

      expect(system.test.all.includes(entity)).toBeFalsy();
      expect(system.test.added.includes(entity)).toBeFalsy();
      expect(system.test.removed.includes(entity)).toBeTruthy();
    });

    it('does not update system query results if an entity does not match a query with the NOT condition', () => {
      class TestSystem extends System {
        test!: Query;

        onInit(): void {
          this.test = this.query({ not: [TestComponentOne] });
        }
      }

      const system = world.addSystem(new TestSystem());

      const space = world.create.space();

      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);

      world.update(1);

      expect(system.test.added.length).toBe(0);
      expect(system.test.all.length).toBe(0);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeFalsy();
      expect(system.test.added.includes(entity)).toBeFalsy();
      expect(system.test.removed.includes(entity)).toBeFalsy();
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

      const space = world.create.space();

      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);
      entity.addComponent(TestComponentTwo);
      entity.addComponent(TestComponentThree);

      world.update(1);

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();
    });

    it('does not update system query results if an entity does not match a query with the ALL condition', () => {
      class TestSystem extends System {
        test!: Query;

        onInit(): void {
          this.test = this.query({
            all: [TestComponentOne, TestComponentTwo, TestComponentThree],
          });
        }
      }

      const system = world.addSystem(new TestSystem());

      const space = world.create.space();

      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);
      entity.addComponent(TestComponentTwo);
      entity.addComponent(TestComponentFour);

      world.update(1);

      expect(system.test.added.length).toBe(0);
      expect(system.test.all.length).toBe(0);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeFalsy();
      expect(system.test.added.includes(entity)).toBeFalsy();
      expect(system.test.removed.includes(entity)).toBeFalsy();
    });

    it('updates system query results if an entity matches a query with multiple condition', () => {
      class TestSystem extends System {
        test!: Query;

        onInit(): void {
          this.test = this.query({
            all: [TestComponentOne, TestComponentTwo],
            one: [TestComponentThree, TestComponentFour],
            not: [TestComponentFive, TestComponentSix],
          });
        }
      }

      const system = world.addSystem(new TestSystem());

      const space = world.create.space();

      const entity = space.create.entity();
      entity.addComponent(TestComponentOne);
      entity.addComponent(TestComponentTwo);
      entity.addComponent(TestComponentFour);

      world.update(1);

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();
    });
  });
});
