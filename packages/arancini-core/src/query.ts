import { EntityContainer } from './entity-container'
import type { World } from './world'

export type With<E, P extends keyof E> = E & Required<Pick<E, P>>

export type Without<E, P extends keyof E> = Pick<E, Exclude<keyof E, P>> &
  Partial<Pick<E, P>>

export type Strict<E> = WithoutOptionalProperties<E>

type OptionalProperties<T> = {
  [P in keyof T]-?: undefined extends T[P] ? P : never
}

type WithoutOptionalProperties<T> = Pick<
  T,
  Exclude<keyof T, OptionalProperties<T>[keyof T]>
>

export type QueryConditionType = 'all' | 'any' | 'not'

export type QueryCondition<E> = {
  type: QueryConditionType
  components: (keyof E)[]
}

export type QueryConditions<E> = QueryCondition<E>[]

export type QueryDescription<E, R> = (q: QueryBuilder<E>) => QueryBuilder<R>

export class Query<E> extends EntityContainer<E> {
  constructor(
    public world: World,
    public key: string,
    public conditions: QueryConditions<E>
  ) {
    super()
  }

  destroy() {
    this.world.destroyQuery(this)
  }
}

export const getQueryResults = <E>(
  queryConditions: QueryConditions<E>,
  entities: Iterable<E>
): E[] => {
  const matches: E[] = []

  for (const entity of entities) {
    if (evaluateQueryConditions(queryConditions, entity)) {
      matches.push(entity)
    }
  }

  return matches
}

export const getFirstQueryResult = <E>(
  queryConditions: QueryConditions<E>,
  entities: Iterable<E>
): E | undefined => {
  for (const entity of entities) {
    if (evaluateQueryConditions(queryConditions, entity)) {
      return entity
    }
  }

  return undefined
}
// export const getFirstQueryResult = <E>(
//   queryBitSets: QueryBitSets,
//   entities: Iterable<E>
// ): E | undefined => {
//   for (const entity of entities) {
//     if (evaluateQueryBitSets(queryBitSets, entity)) {
//       return entity
//     }
//   }

//   return undefined
// }

export const evaluateQueryConditions = <E>(
  conditions: QueryConditions<E>,
  entity: E
): boolean => {
  for (const condition of conditions) {
    if (
      condition.type === 'all' &&
      !condition.components.every((c) => entity[c])
    ) {
      return false
    } else if (
      condition.type === 'any' &&
      !condition.components.some((c) => entity[c])
    ) {
      return false
    } else if (
      condition.type === 'not' &&
      condition.components.some((c) => entity[c])
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
  // componentRegistry: ComponentRegistry,
  queryConditions: QueryConditions<unknown>
): string => {
  return queryConditions
    .map(({ type, components }) => {
      if (type === 'all') {
        return components.sort().join(',')
      }

      return [`${type}:${components.sort().join(',')}`]
    })
    .sort()
    .join('&')
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
