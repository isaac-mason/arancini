import { ComponentClass } from './component';
import { Entity } from './entity';

/**
 * Enum for query condition types
 */
export enum QueryConditionType {
  ALL = 'all',
  ONE = 'one',
  NOT = 'not',
}

/**
 * Type for query conditions
 */
export type QueryDescription =
  | ComponentClass[]
  | {
      [QueryConditionType.ALL]?: ComponentClass[];
      [QueryConditionType.NOT]?: ComponentClass[];
      [QueryConditionType.ONE]?: ComponentClass[];
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
 *   one: [ExampleComponentOne, ExampleComponentTwo],
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
 * world.addSystem(new ExampleSystem());
 * ```
 */
export class Query {
  /**
   * Entities added to the query on the latest update
   */
  added: Entity[] = [];

  /**
   * The current entities matched by the query
   */
  all: Entity[] = [];

  /**
   * A list of all component classes that are involved in the conditions for this query
   */
  components: ComponentClass[];

  /**
   * The query description for this query
   */
  description: QueryDescription;

  /**
   * The query dedupe string
   */
  key: string;

  /**
   * Entities removed from the query on the latest update
   */
  removed: Entity[] = [];

  /**
   * Whether the query is used outside of a system
   *
   * If true, the query will not be removed from the world when all systems using it are removed.
   */
  standalone = false;

  /**
   * Constructor for a new query instance
   * @param queryDescription the query description
   */
  constructor(queryDescription: QueryDescription) {
    const isArray = Array.isArray(queryDescription);

    // check if the query is valid
    // must have at least one query type, and must not have an empty array of components
    if (
      (isArray && queryDescription.length === 0) ||
      (!isArray &&
        ((!queryDescription.all &&
          !queryDescription.one &&
          !queryDescription.not) ||
          (queryDescription.all && queryDescription.all.length === 0) ||
          (queryDescription.one && queryDescription.one.length === 0) ||
          (queryDescription.not && queryDescription.not.length === 0)))
    ) {
      throw new Error('Query must have at least one condition');
    }

    this.key = Query.getDescriptionDedupeString(queryDescription);
    this.description = queryDescription;
    this.components = isArray
      ? queryDescription
      : Array.from(
          new Set<ComponentClass>([
            ...(queryDescription.all ? queryDescription.all : []),
            ...(queryDescription.one ? queryDescription.one : []),
            ...(queryDescription.not ? queryDescription.not : []),
          ])
        );
  }

  /**
   * Returns a string that identifies a query description
   * @param query the query description
   * @returns a string that identifies a query description
   * @private called internally, do not call directly
   */
  public static getDescriptionDedupeString(query: QueryDescription): string {
    if (Array.isArray(query)) {
      return query.map((c) => `${c.name}`).join('&');
    }

    return Object.entries(query)
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
