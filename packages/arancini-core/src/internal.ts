import { BitSet } from './bit-set'
import { ObjectPool } from './object-pool'

type InternalEntityProperties = {
  bitset: BitSet
  id?: number
}

export type EntityWithInternalProperties<E> = E & {
  [ARANCINI_SYMBOL]: InternalEntityProperties
}

export const internalEntityPropertiesPool =
  new ObjectPool<InternalEntityProperties>(() => ({
    bitset: new BitSet(),
    id: undefined,
  }))

export const ARANCINI_SYMBOL = Symbol('__arancini')
