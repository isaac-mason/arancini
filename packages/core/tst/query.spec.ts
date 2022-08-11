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

describe('Query', () => {
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

  it('should throw an error when attempting to create a query with no conditions', () => {
    expect(() => {
      world.create.query({});
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
    const query = world.create.query(description);

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

    const queryOne = world.create.query(descriptionOne);
    const queryTwo = world.create.query(descriptionTwo);

    expect(queryOne).toBeTruthy();
    expect(queryTwo).toBeTruthy();

    expect(queryOne).toEqual(queryTwo);
  });

  it('can be removed from a world', () => {
    // query for TestComponentOne
    const description: QueryDescription = {
      all: [TestComponentOne],
    };
    const query = world.create.query(description);

    // create entity matching the query
    const entityOne = space.create.entity();
    entityOne.addComponent(TestComponentOne);

    // entity should be updated
    expect(query).toBeTruthy();
    expect(query.all.length).toBe(1);
    expect(query.all.includes(entityOne)).toBeTruthy();

    // remove the query
    query.destroy();

    // creating an entity matching the removed query should not update the query
    const entityTwo = space.build
      .entity()
      .addComponent(TestComponentOne)
      .build();
    expect(query).toBeTruthy();
    expect(query.all.length).toBe(1);
    expect(query.all.includes(entityOne)).toBeTruthy();
    expect(query.all.includes(entityTwo)).toBeFalsy();

    // removing a query that isn't in the world is swallowed silently
    world.queryManager.removeQuery(
      new Query({} as World, 'some key not in the query manager')
    );

    // removing an already removed query is swallowed silently
    world.queryManager.removeQuery(query);
  });

  describe('getKey', () => {
    it('should contain class names', () => {
      const queryOne: QueryDescription = {
        all: [TestComponentOne, TestComponentTwo],
      };

      expect(Query.getDescriptionDedupeString(queryOne)).toEqual(
        'TestComponentOne&TestComponentTwo'
      );
    });

    it('should return the same key for two matching query descriptions', () => {
      const queryOne: QueryDescription = {
        any: [TestComponentOne, TestComponentTwo],
        all: [TestComponentThree, TestComponentFour],
        not: [TestComponentFive, TestComponentSix],
      };

      const queryTwo: QueryDescription = {
        not: [TestComponentSix, TestComponentFive],
        all: [TestComponentFour, TestComponentThree],
        any: [TestComponentTwo, TestComponentOne],
      };

      expect(Query.getDescriptionDedupeString(queryOne)).toEqual(
        Query.getDescriptionDedupeString(queryTwo)
      );
    });

    it('should return a different key for two different query descriptions', () => {
      const differentComponentsOne: QueryDescription = {
        all: [TestComponentOne, TestComponentTwo],
      };

      const differentComponentsTwo: QueryDescription = {
        all: [TestComponentOne],
      };

      expect(
        Query.getDescriptionDedupeString(differentComponentsOne)
      ).not.toEqual(Query.getDescriptionDedupeString(differentComponentsTwo));

      const differentConditionOne: QueryDescription = {
        all: [TestComponentOne],
      };

      const differentConditionTwo: QueryDescription = {
        not: [TestComponentOne],
      };

      expect(
        Query.getDescriptionDedupeString(differentConditionOne)
      ).not.toEqual(Query.getDescriptionDedupeString(differentConditionTwo));

      const partiallyDifferentOne: QueryDescription = {
        all: [TestComponentOne],
      };

      const partiallyDifferentTwo: QueryDescription = {
        all: [TestComponentOne],
        not: [TestComponentTwo],
      };

      expect(
        Query.getDescriptionDedupeString(partiallyDifferentOne)
      ).not.toEqual(Query.getDescriptionDedupeString(partiallyDifferentTwo));
    });
  });

  describe('first', () => {
    it('should retrieve the first Entity in the Query, or null if no Entities match the query', () => {
      const description: QueryDescription = {
        all: [TestComponentOne],
      };

      const entityOne = space.build
        .entity()
        .addComponent(TestComponentOne)
        .build();

      const entityTwo = space.build
        .entity()
        .addComponent(TestComponentOne)
        .build();

      const query = world.create.query(description);

      expect(query.first).toBe(entityOne);

      entityOne.destroy();
      entityTwo.destroy();

      expect(query.first).toBe(undefined);
    });
  });

  describe('query', () => {
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
      const queryResults = world.query(description);
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

      const activeQuery = world.create.query(description);

      world.update();

      const entityTwo = space.create.entity();
      entityTwo.addComponent(TestComponentOne);

      const onceOffQueryResults = world.query(description);

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

      expect(
        world.queryManager.dedupedQueries
          .get(system.test.key)
          ?.entitySet.has(entity)
      ).toBe(true);

      world.update();

      entity.removeComponent(TestComponentOne);

      expect(
        world.queryManager.dedupedQueries
          .get(system.test.key)
          ?.entitySet.has(entity)
      ).toBe(false);

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

      expect(
        world.queryManager.dedupedQueries
          .get(system.test.key)
          ?.entitySet.has(entity)
      ).toBe(true);

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();

      world.update();

      entity.addComponent(TestComponentOne);

      expect(
        world.queryManager.dedupedQueries
          .get(system.test.key)
          ?.entitySet.has(entity)
      ).toBe(false);

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

      expect(
        world.queryManager.dedupedQueries
          .get(system.test.key)
          ?.entitySet.has(entity)
      ).toBe(true);

      expect(system.test.added.length).toBe(1);
      expect(system.test.all.length).toBe(1);
      expect(system.test.removed.length).toBe(0);

      expect(system.test.all.includes(entity)).toBeTruthy();
      expect(system.test.added.includes(entity)).toBeTruthy();
      expect(system.test.removed.includes(entity)).toBeFalsy();

      world.update();

      entity.removeComponent(TestComponentThree);

      expect(
        world.queryManager.dedupedQueries
          .get(system.test.key)
          ?.entitySet.has(entity)
      ).toBe(false);

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

      expect(
        world.queryManager.dedupedQueries
          .get(system.test.key)
          ?.entitySet.has(entity)
      ).toBe(true);

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
      const query = world.create.query(description);

      expect(query.all.length).toBe(0);

      // create entity that matches query
      const entityOne = space.create.entity();
      entityOne.addComponent(TestComponentOne);

      // create another entity that matches query
      const entityTwo = space.create.entity();
      entityTwo.addComponent(TestComponentOne);
      entityTwo.addComponent(TestComponentTwo);

      expect(
        world.queryManager.dedupedQueries
          .get(query.key)
          ?.entitySet.has(entityOne)
      ).toBe(true);

      expect(
        world.queryManager.dedupedQueries
          .get(query.key)
          ?.entitySet.has(entityTwo)
      ).toBe(true);

      expect(query.all.length).toBe(2);
      expect(query.all.includes(entityOne)).toBeTruthy();
      expect(query.all.includes(entityTwo)).toBeTruthy();

      // update, flushing added and removed
      world.update();

      // destroy entityOne, removing it from the query
      entityOne.destroy();

      expect(
        world.queryManager.dedupedQueries
          .get(query.key)
          ?.entitySet.has(entityOne)
      ).toBe(false);

      expect(
        world.queryManager.dedupedQueries
          .get(query.key)
          ?.entitySet.has(entityTwo)
      ).toBe(true);

      expect(query.all.length).toBe(1);
      expect(query.all.includes(entityOne)).toBeFalsy();
      expect(query.all.includes(entityTwo)).toBeTruthy();
    });
  });
});
