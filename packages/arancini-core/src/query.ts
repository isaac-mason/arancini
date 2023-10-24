import { BitSet } from './bit-set'
import { EntityContainer } from './entity-container'
import { ARANCINI_SYMBOL, EntityWithInternalProperties } from './internal'
import type { ComponentRegistry, World } from './world'

export type With<E, P extends keyof E> = E & Required<Pick<E, P>>

export type Without<E, P extends keyof E> = Pick<E, Exclude<keyof E, P>> &
  Partial<Pick<E, P>>

export type QueryConditionType = 'all' | 'any' | 'not'

export type QueryCondition<E> = {
  type: QueryConditionType
  components: (keyof E)[]
}

export type QueryConditions<E> = QueryCondition<E>[]

export type QueryBitSets = {
  type: QueryConditionType
  bitset: BitSet
}[]

export type QueryDescription<E, R> = (q: QueryBuilder<E>) => QueryBuilder<R>

export class Query<E> extends EntityContainer<E> {
  constructor(
    public world: World,
    public key: string,
    public conditions: QueryConditions<E>,
    public bitSets: QueryBitSets
  ) {
    super()
  }

  destroy() {
    this.world.destroyQuery(this)
  }
}

export const getQueryResults = <E>(
  queryBitSets: QueryBitSets,
  entities: Iterable<E>
): E[] => {
  const matches: E[] = []

  for (const entity of entities) {
    if (evaluateQueryBitSets(queryBitSets, entity)) {
      matches.push(entity)
    }
  }

  return matches
}

export const getFirstQueryResult = <E>(
  queryBitSets: QueryBitSets,
  entities: Iterable<E>
): E | undefined => {
  for (const entity of entities) {
    if (evaluateQueryBitSets(queryBitSets, entity)) {
      return entity
    }
  }

  return undefined
}

export const evaluateQueryBitSets = <E>(
  queryBitSets: QueryBitSets,
  entity: E
): boolean => {
  const internal = entity as EntityWithInternalProperties<E>

  for (const queryPart of queryBitSets) {
    if (
      queryPart.type === 'all' &&
      !internal[ARANCINI_SYMBOL].bitset.containsAll(queryPart.bitset)
    ) {
      return false
    } else if (
      queryPart.type === 'any' &&
      !internal[ARANCINI_SYMBOL].bitset.containsAny(queryPart.bitset)
    ) {
      return false
    } else if (
      queryPart.type === 'not' &&
      internal[ARANCINI_SYMBOL].bitset.containsAny(queryPart.bitset)
    ) {
      return false
    }
  }

  return true
}

export const getQueryConditions = (
  queryDescription: QueryDescription<any, any>
): QueryConditions<any> => {
  /* get conditions */
  const queryBuilder = new QueryBuilder()
  queryDescription(queryBuilder)
  const queryConditions = queryBuilder.conditions

  /* validate */
  if (queryConditions.length <= 0) {
    throw new Error('Query must have at least one condition')
  }

  if (queryConditions.some((condition) => condition.components.length <= 0)) {
    throw new Error('Query conditions must have at least one component')
  }

  /* combine the 'all' conditions */
  const allCondition: QueryCondition<any> = { type: 'all', components: [] }
  const others: QueryConditions<any> = []

  for (const condition of queryConditions) {
    if (condition.type === 'all') {
      allCondition.components.push(...condition.components)
    } else {
      others.push(condition)
    }
  }

  return [allCondition, ...others]
}

export const getQueryDedupeString = (
  componentRegistry: ComponentRegistry,
  queryConditions: QueryConditions<unknown>
): string => {
  return queryConditions
    .map(({ type, components }) => {
      if (type === 'all') {
        return components
          .map((c) => componentRegistry[c])
          .sort()
          .join(',')
      }

      return [
        `${type}:${components
          .map((c) => componentRegistry[c])
          .sort()
          .join(',')}`,
      ]
    })
    .sort()
    .join('&')
}

export const getQueryBitSets = (
  componentRegistry: ComponentRegistry,
  conditions: QueryConditions<any>
) => {
  return conditions.map((condition) => ({
    type: condition.type,
    bitset: new BitSet(
      condition.components.map((c) => componentRegistry[c as string])
    ),
  }))
}

export class QueryBuilder<E> {
  T!: E

  conditions: QueryConditions<E> = []

  all = <C extends keyof E>(...components: C[]) => {
    this.conditions.push({ type: 'all', components })
    return this as unknown as QueryBuilder<With<E, C>>
  }

  any = <C extends keyof E>(...components: C[]): QueryBuilder<E> => {
    this.conditions.push({ type: 'any', components })
    return this
  }

  not = <C extends keyof E>(...components: C[]) => {
    this.conditions.push({ type: 'not', components })
    return this as unknown as QueryBuilder<Without<E, C>>
  }

  with = this.all
  have = this.all
  has = this.all
  every = this.all
  is = this.all

  some = this.any
  one = this.any

  none = this.not
  without = this.not

  get and() {
    return this
  }

  get but() {
    return this
  }

  get where() {
    return this
  }

  get are() {
    return this
  }
}
