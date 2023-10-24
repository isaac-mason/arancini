import { ComponentDefinition } from './component'
import { Entity } from './entity'
import { BitSet } from './bit-set'

export type QueryConditionType = 'all' | 'any' | 'not'

export type QueryCondition = {
  type: QueryConditionType
  components: ComponentDefinition[]
}

export type QueryConditions = QueryCondition[]

export type QueryBuilderFn = (q: InstanceType<typeof QueryBuilder>) => unknown

export type QueryBitSets = {
  all?: BitSet
  any?: BitSet
  not?: BitSet
}[]

export type QueryDescription =
  | ComponentDefinition[]
  | QueryBuilderFn
  | QueryConditions

export const getQueryDedupeString = (
  queryConditions: QueryConditions
): string => {
  return queryConditions
    .map(({ type, components }) => {
      if (type === 'all') {
        return components
          .map((c) => `${c.componentIndex}`)
          .sort()
          .join(',')
      }

      return [
        `${type}:${components
          .map((c) => c.componentIndex)
          .sort()
          .join(',')}`,
      ]
    })
    .sort()
    .join('&')
}

export const getQueryConditions = (
  queryDescription: QueryDescription
): QueryConditions => {
  let queryConditions: QueryConditions

  /* get conditions */
  if (typeof queryDescription === 'function') {
    const queryBuilder = new QueryBuilder()
    queryDescription(queryBuilder)
    queryConditions = queryBuilder.conditions
  } else if (
    (queryDescription as ComponentDefinition[]).every(
      (v) => 'componentIndex' in v
    )
  ) {
    queryConditions = [
      { type: 'all', components: queryDescription as ComponentDefinition[] },
    ]
  } else {
    queryConditions = queryDescription as QueryConditions
  }

  /* validate */
  if (queryConditions.length <= 0) {
    throw new Error('Query must have at least one condition')
  }

  if (queryConditions.some((condition) => condition.components.length <= 0)) {
    throw new Error('Query conditions must have at least one component')
  }

  /* combine the 'all' conditions */
  const allCondition: QueryCondition = { type: 'all', components: [] }
  const others: QueryConditions = []

  for (const condition of queryConditions) {
    if (condition.type === 'all') {
      allCondition.components.push(...condition.components)
    } else {
      others.push(condition)
    }
  }

  return [allCondition, ...others]
}

export const getQueryBitSets = (
  queryDescription: QueryConditions
): QueryBitSets =>
  queryDescription.map((condition) => ({
    [condition.type]: new BitSet(
      condition.components.map((c) => c.componentIndex)
    ),
  }))

export const evaluateQueryBitSets = (
  queryBitSets: QueryBitSets,
  entity: Entity
): boolean => {
  for (const queryPart of queryBitSets) {
    if (queryPart.all && !entity._componentsBitSet.containsAll(queryPart.all)) {
      return false
    }

    if (queryPart.any && !entity._componentsBitSet.containsAny(queryPart.any)) {
      return false
    }

    if (queryPart.not && entity._componentsBitSet.containsAny(queryPart.not)) {
      return false
    }
  }

  return true
}

export const getFirstQueryResult = (
  queryBitSets: QueryBitSets,
  entities: Iterable<Entity>
): Entity | undefined => {
  for (const entity of entities) {
    if (evaluateQueryBitSets(queryBitSets, entity)) {
      return entity
    }
  }

  return undefined
}

export const getQueryResults = (
  queryBitSets: QueryBitSets,
  entities: Iterable<Entity>
): Entity[] => {
  const matches: Entity[] = []

  for (const entity of entities) {
    if (evaluateQueryBitSets(queryBitSets, entity)) {
      matches.push(entity)
    }
  }

  return matches
}

export class QueryBuilder {
  conditions: QueryConditions = []

  constructor() {}

  all = (...components: ComponentDefinition[]) => {
    this.conditions.push({ type: 'all', components })
    return this
  }

  any = (...components: ComponentDefinition[]) => {
    this.conditions.push({ type: 'any', components })
    return this
  }

  not = (...components: ComponentDefinition[]) => {
    this.conditions.push({ type: 'not', components })
    return this
  }

  /* 'all' aliases */
  with = this.all
  have = this.all
  has = this.all
  every = this.all

  /* 'any' aliases */
  some = this.any
  one = this.any
  withAny = this.any

  /* 'not' aliases */
  none = this.not
  without = this.not

  /* grammar */
  get and() {
    return this
  }

  get but() {
    return this
  }

  get where() {
    return this
  }

  get that() {
    return this
  }

  get are() {
    return this
  }

  get also() {
    return this
  }
}
