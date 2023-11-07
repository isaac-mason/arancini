import { BitSet } from './bit-set'
import { ObjectPool } from './object-pool'

type EntityMetadata = {
  bitset: BitSet
  id?: number
}

export type EntityWithMetadata<E> = E & {
  [ARANCINI_SYMBOL]: EntityMetadata
}

export const entityMetadataPool = new ObjectPool<EntityMetadata>(() => ({
  bitset: new BitSet(),
  id: undefined,
}))

export const ARANCINI_SYMBOL = Symbol('__arancini')
