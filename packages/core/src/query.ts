import { ComponentClass } from './component';
import { Entity } from './entity';
import { BitSet } from './utils/bit-set';

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
 * Queries can contain a minimum of one and a maximum of three conditions, the `all`, `one`, and `not` QueryConditionType conditions.
 *
 * Queries can either be created as part of Systems, or they can be created standalone.
 *
 * Changes to Entity Components are queued, and Query results are updated as part of the World update loop.
 *
 * Query results can also be retrieved once-off without creating a persistent query with `world.queryOnce(...)`.
 *
 * ```ts
 * import { Component, System, World, QueryDescription } from "@rapidajs/recs";
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
 * // get once-off query results
 * world.queryOnce(simpleQueryDescription);
 *
 * // get once-off query results, re-using existing query results if available
 * world.queryOnce(queryDescription, { useExisting: true });
 *
 * // get a query that will update every world update
 * const query = world.query({
 *   all: [ExampleComponentOne]
 * });
 *
 * // create a system with a query
 * class ExampleSystem extends System {
 *   exampleQueryName!: Query;
 *
 *   onInit() {
 *     this.exampleQueryName = this.query({
 *       all: [ExampleComponentOne],
 *     });
 *   }
 *
 *   onUpdate() {
 *     this.exampleQueryName.all.forEach((entity) => console.log(entity));
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
  all: Entity[] = [];

  /**
   * Entities added to the query since the latest update.  Cleared at the end of every world update.
   */
  added: Entity[] = [];

  /**
   * Entities removed from the query since the latest update. Cleared at the end of every world update.
   */
  removed: Entity[] = [];

  /**
   * Constructor for a new query instance
   * @param queryKey the key for the query
   */
  constructor(queryKey: string) {
    this.key = queryKey;
  }

  clearEvents(): void {
    this.added = [];
    this.removed = [];
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
