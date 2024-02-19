import { EntityCollection } from './entity-collection'
import type { World } from './world'

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

export type QueryFn<Entity, ResultEntity> = (q: QueryBuilder<Entity>) => QueryBuilder<ResultEntity>

export class Query<Entity> extends EntityCollection<Entity> {
  constructor(
    public world: World,
    public key: string,
    public conditions: QueryConditions<Entity>
  ) {
    super()
  }

  destroy() {
    this.world.destroyQuery(this)
  }
}

export const getQueryResults = <Entity>(
  queryConditions: QueryConditions<Entity>,
  entities: Iterable<Entity>
): Entity[] => {
  const matches: Entity[] = []

  for (const entity of entities) {
    if (evaluateQueryConditions(queryConditions, entity)) {
      matches.push(entity)
    }
  }

  return matches
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

export const getQueryConditions = (
  queryFn: QueryFn<any, any>
): QueryConditions<any> => {
  /* get conditions */
  const queryBuilder = new QueryBuilder()
  queryFn(queryBuilder)
  const queryConditions = queryBuilder.conditions

  /* validate conditions */
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

export class QueryBuilder<Entity> {
  T!: Entity

  conditions: QueryConditions<Entity> = []

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
