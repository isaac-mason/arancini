import { EntityCollection } from './entity-collection'

export type With<T, P extends keyof T> = T & Required<Pick<T, P>>

export type Without<T, P extends keyof T> = Pick<T, Exclude<keyof T, P>> &
  Partial<Pick<T, P>>

export type Strict<T> = WithoutOptionalProperties<T>

type OptionalProperties<T> = {
  [P in keyof T]-?: undefined extends T[P] ? P : never
}

type WithoutOptionalProperties<T> = Pick<
  T,
  Exclude<keyof T, OptionalProperties<T>[keyof T]>
>

export type QueryConditionType = 'all' | 'any' | 'not'

export type QueryCondition<Entity> = {
  type: QueryConditionType
  components: (keyof Entity)[]
}

export type QueryConditions<Entity> = QueryCondition<Entity>[]

export type QueryFn<Entity, ResultEntity> = (
  q: QueryBuilder<Entity>
) => QueryBuilder<ResultEntity>

export class Query<Entity> extends EntityCollection<Entity> {
  references = new Set<unknown>()

  constructor(
    public dedupe: string,
    public conditions: QueryConditions<Entity>,
  ) {
    super()
  }
}

export const prepareQuery = (
  queryFn: QueryFn<any, any>
): { conditions: QueryConditions<any>; dedupe: string } => {
  /* evaluate queryFn */
  const queryBuilder = new QueryBuilder()
  queryFn(queryBuilder)
  const queryBuilderConditions = queryBuilder.conditions

  /* validate conditions */
  if (queryBuilderConditions.length <= 0) {
    throw new Error('Query must have at least one condition')
  }

  if (queryBuilderConditions.some((condition) => condition.components.length <= 0)) {
    throw new Error('Query conditions must have at least one component')
  }

  /* normalize conditions */
  const normalisedConditions: QueryConditions<any> = []

  const combinedAllCondition: QueryCondition<any> = { type: 'all', components: [] }
  const combinedNotCondition: QueryCondition<any> = { type: 'not', components: [] }

  for (const condition of queryBuilderConditions) {
    if (condition.type === 'all') {
      combinedAllCondition.components.push(...condition.components)
    } else if (condition.type === 'not') {
      combinedNotCondition.components.push(...condition.components)
    } else {
      normalisedConditions.push(condition)
    }
  }

  if (combinedAllCondition.components.length > 0) {
    normalisedConditions.push(combinedAllCondition)
  }
  if (combinedNotCondition.components.length > 0) {
    normalisedConditions.push(combinedNotCondition)
  }

  /* create query dedupe string */
  const dedupe = normalisedConditions
    .map(({ type, components }) => {
      return `${type}(${components.sort().join(', ')})`
    })
    .sort()
    .join(' && ')

  return {
    conditions: normalisedConditions,
    dedupe,
  }
}

export const evaluateQueryConditions = <Entity>(
  conditions: QueryConditions<Entity>,
  entity: Entity
): boolean => {
  for (let c = 0; c < conditions.length; c++) {
    const condition = conditions[c]

    if (
      (condition.type === 'all' &&
        !condition.components.every((c) => entity[c] !== undefined)) ||
      (condition.type === 'any' &&
        !condition.components.some((c) => entity[c] !== undefined)) ||
      (condition.type === 'not' &&
        condition.components.some((c) => entity[c] !== undefined))
    ) {
      return false
    }
  }

  return true
}

export class QueryBuilder<Entity> {
  T!: Entity

  conditions: QueryConditions<Entity> = []

  /* conditions */
  all = <C extends keyof Entity>(...components: C[]) => {
    this.conditions.push({ type: 'all', components })
    return this as unknown as QueryBuilder<With<Entity, C>>
  }

  any = <C extends keyof Entity>(...components: C[]): QueryBuilder<Entity> => {
    this.conditions.push({ type: 'any', components })
    return this
  }

  not = <C extends keyof Entity>(...components: C[]) => {
    this.conditions.push({ type: 'not', components })
    return this as unknown as QueryBuilder<Without<Entity, C>>
  }

  /* condition aliases */
  with = this.all
  have = this.all
  has = this.all
  every = this.all
  is = this.all

  some = this.any
  one = this.any

  none = this.not
  without = this.not

  /* no-op grammar */
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
