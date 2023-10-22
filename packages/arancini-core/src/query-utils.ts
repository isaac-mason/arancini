import { ComponentDefinition } from './component'
import { Entity } from './entity'
import { BitSet } from './bit-set'

export type QueryConditionType = 'all' | 'any' | 'not'

export type QueryConditions = {
  all?: ComponentDefinition[]
  not?: ComponentDefinition[]
  any?: ComponentDefinition[]
}[]

export type QueryConditionsBuilderFn = (
  q: InstanceType<typeof QueryBuilder>
) => unknown

export type QueryBitSets = {
  all?: BitSet
  any?: BitSet
  not?: BitSet
}[]

export type QueryDescription =
  | ComponentDefinition[]
  | QueryConditions
  | QueryConditionsBuilderFn

export const getQueryDedupeString = (
  queryConditions: QueryConditions
): string => {
  return queryConditions
    .map((queryPart) => {
      const type = Object.keys(queryPart)[0] as QueryConditionType
      const components = queryPart[type]!

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

  if (typeof queryDescription === 'function') {
    queryConditions = [] as QueryConditions
    queryDescription(new QueryBuilder(queryConditions))
  } else if (
    (queryDescription as ComponentDefinition[]).every(
      (v) => 'componentIndex' in v
    )
  ) {
    queryConditions = [{ all: queryDescription as ComponentDefinition[] }]
  } else {
    queryConditions = queryDescription as QueryConditions
  }

  if (queryDescription.length <= 0) {
    throw new Error('Query must have at least one condition')
  }

  return queryConditions
}

export const getQueryBitSets = (
  queryDescription: QueryConditions
): QueryBitSets => {
  const queryBitSets: QueryBitSets = []

  for (const queryPart of queryDescription) {
    const type = Object.keys(queryPart)[0] as QueryConditionType
    const components = queryPart[type]!

    if (type === 'all') {
      queryBitSets.push({
        all: new BitSet(components.map((c) => c.componentIndex)),
      })
    } else if (type === 'any') {
      queryBitSets.push({
        any: new BitSet(components.map((c) => c.componentIndex)),
      })
    } else if (type === 'not') {
      queryBitSets.push({
        not: new BitSet(components.map((c) => c.componentIndex)),
      })
    }
  }

  return queryBitSets
}

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
  constructor(private conditions: QueryConditions) {}

  all = (...components: ComponentDefinition[]) => {
    this.conditions.push({ all: components })
    return this
  }

  with = this.all
  
  have = this.all

  every = this.all

  any = (...components: ComponentDefinition[]) => {
    this.conditions.push({ any: components })
    return this
  }

  some = this.any

  not = (...components: ComponentDefinition[]) => {
    this.conditions.push({ not: components })
    return this
  }

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
