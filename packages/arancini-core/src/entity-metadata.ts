import type { BitSet } from './bit-set'

export type EntityMetadata = {
  bitset: BitSet
  id?: number
}

export type EntityWithMetadata<E> = E & {
  [ARANCINI_SYMBOL]: EntityMetadata
}

export const ARANCINI_SYMBOL = Symbol('__arancini')
