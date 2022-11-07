import type { ComponentClass } from './component';
import type { Entity } from './entity';
import { EventDispatcher } from './events/event-dispatcher';
import type { BitSet } from './utils/bit-set';
import type { World } from './world';

/**
 * Enum for query condition types
 */
export const QueryConditionType = {
  ALL: 'all',
  ANY: 'any',
  NOT: 'not',
} as const;

/**
 * Type for query conditions
 */
export type QueryDescription =
  | ComponentClass[]
  | {
      [QueryConditionType.ALL]?: ComponentClass[];
      [QueryConditionType.NOT]?: ComponentClass[];
      [QueryConditionType.ANY]?: ComponentClass[];
    };

export type QueryBitSets = {
  all?: BitSet;
  any?: BitSet;
  not?: BitSet;
};

/**
 * A Query for Entities with specified Components.
 *
 * Queries can contain a minimum of one and a maximum of three conditions, the `entities`, `one`, and `not` QueryConditionType conditions.
 *
 * Queries can either be created as part of Systems, or they can be created standalone.
 *
 * Changes to Entity Components are queued, and Query results are updated as part of the World update loop.
 *
 * Query results can also be retrieved once-off without creating a persistent query with `world.query(...)`.
 *
 * ```ts
 * import { Component, System, World, QueryDescription } from "@recs/core";
 *
 * // create a world
 * const world = new World();
 *
 * // create some example components
 * class ExampleComponentOne extends Component {}
 * class ExampleComponentTwo extends Component {}
 * class ExampleComponentThree extends Component {}
 * class ExampleComponentFour extends Component {}
 *
 * // create a simple query description
 * const simpleQueryDescription: QueryDescription = [ExampleComponentOne, ExampleComponentTwo];
 *
 * // create a complex query description
 * const queryDescription: QueryDescription = {
 *   all: [ExampleComponentOne],
 *   any: [ExampleComponentOne, ExampleComponentTwo],
 *   not: [ExampleComponentFour],
 * };
 *
 * // get once-off query results, re-using existing query results if available
 * world.query(simpleQueryDescription);
 *
 * // get a query that will update every world update
 * const query = world.create.query({
 *   all: [ExampleComponentOne]
 * });
 *
 * // create a system with a query
 * class ExampleSystem extends System {
 *   exampleQueryName = this.query({
 *     all: [ExampleComponentOne],
 *   });
 *
 *   onUpdate() {
 *     this.exampleQueryName.entities.forEach((entity) => console.log(entity));
 *   }
 * }
 *
 * world.registerSystem(ExampleSystem);
 * ```
 */
export class Query {
  /**
   * The query dedupe string
   */
  key: string;

  /**
   * The current entities matched by the query
   */
  entities: Entity[] = [];

  /**
   * Returns the first entity within this archetype.
   * */
  get first(): Entity | undefined {
    return this.entities[0] || undefined;
  }

  /**
   * Event dispatcher for when an Entity is added to the query
   */
  onEntityAdded = new EventDispatcher<Entity>();

  /**
   * Event dispatcher for when an Entity is removed from the query
   */
  onEntityRemoved = new EventDispatcher<Entity>();

  /**
   * Iterator for all entities matched by the query
   */
  [Symbol.iterator]() {
    return this.entities[Symbol.iterator]();
  }

  /**
   * The World the Query is in
   */
  private world: World;

  /**
   * Constructor for a new query instance
   * @param world the world the query is in
   * @param queryKey the key for the query
   */
  constructor(world: World, queryKey: string) {
    this.world = world;
    this.key = queryKey;
  }

  /**
   * Destroys the Query
   */
  destroy(): void {
    this.world.queryManager.removeQuery(this);
  }

  /**
   * Returns a string that identifies a query description
   * @param queryDescription the query description
   * @returns a string that identifies a query description
   * @private called internally, do not call directly
   */
  static getDescriptionDedupeString(
    queryDescription: QueryDescription
  ): string {
    if (Array.isArray(queryDescription)) {
      return queryDescription.map((c) => `${c.name}`).join('&');
    }

    return Object.entries(queryDescription)
      .flatMap(([type, components]) => {
        if (type === QueryConditionType.ALL) {
          return components.map((c) => `${c.name}`).sort();
        }

        return [`${type}:${components.sort().map((c) => c.name)}`];
      })
      .sort()
      .join('&');
  }
}
