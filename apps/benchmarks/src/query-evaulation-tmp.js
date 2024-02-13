import { BitSet } from '@arancini/core'
import { ObjectPool } from '@arancini/pool'

const withBitSets = (n) => {
  const componentRegistry = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
    g: 6,
    h: 7,
    i: 8,
    j: 9,
    k: 10,
  }

  const queryBitSet = new BitSet()
  queryBitSet.add(componentRegistry.foo, componentRegistry.bar)

  const pool = new ObjectPool(() => new BitSet())
  
  for (let i = 0; i < n; i++) {
    const entityBitSet = pool.request()
    entityBitSet.reset()
    // const entityBitSet = new BitSet()
    entityBitSet.add(componentRegistry.foo, componentRegistry.bar)

    entityBitSet.containsAll(queryBitSet)
    
    pool.recycle(entityBitSet)
  }
}

const withObjects = (n) => {
  const query = [
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    ]

  for (let i = 0; i < n; i++) {
    const entity = {
        a: true,
        b: true,
        c: true,
        d: true,
        e: true,
        f: true,
        g: true,
    }

    query.every((key) => entity[key])
  }
}

const bench = () => {
  const n = 10000000

  console.time('withBitSets')
  withBitSets(n)
  console.timeEnd('withBitSets')

  console.time('withObjects')
  withObjects(n)
  console.timeEnd('withObjects')
}

bench()
