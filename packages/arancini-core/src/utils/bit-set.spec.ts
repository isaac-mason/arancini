import { BitSet } from './bit-set'

describe('BitSet', () => {
  describe('add, remove, has', () => {
    it('should support adding and removing indices', () => {
      const bitSet = new BitSet()

      const N = 1024

      for (let i = 0; i < N; i++) {
        expect(bitSet.has(i)).toBe(false)

        bitSet.add(i)

        expect(bitSet.has(i)).toBe(true)

        for (let j = 0; j <= i; j++) {
          if (!bitSet.has(j)) fail()
        }
        for (let j = i + 1; j < N; j++) {
          if (bitSet.has(j)) fail()
        }
      }

      for (let i = N - 1; i >= 0; i--) {
        expect(bitSet.has(i)).toBe(true)

        bitSet.remove(i)

        expect(bitSet.has(i)).toBe(false)

        for (let j = 0; j < i; j++) {
          if (!bitSet.has(j)) fail()
        }
        for (let j = i; j < N; j++) {
          if (bitSet.has(j)) fail()
        }
      }
    })
  })

  describe('clone', () => {
    it('should create a clone of the bitset with the same words', () => {
      const bitset = new BitSet([1, 3])
      expect(bitset.has(1)).toBeTruthy()
      expect(bitset.has(2)).toBeFalsy()
      expect(bitset.has(3)).toBeTruthy()
      expect(bitset.has(4)).toBeFalsy()

      const clone = bitset.clone()
      expect(clone.has(1)).toBeTruthy()
      expect(clone.has(2)).toBeFalsy()
      expect(clone.has(3)).toBeTruthy()
      expect(clone.has(4)).toBeFalsy()
    })
  })

  describe('copy', () => {
    it('should set the bitset to be a copy of another bitsets words', () => {
      const bitSet = new BitSet([1, 3])

      expect(bitSet.has(1)).toBeTruthy()
      expect(bitSet.has(2)).toBeFalsy()
      expect(bitSet.has(3)).toBeTruthy()
      expect(bitSet.has(4)).toBeFalsy()

      bitSet.copy(new BitSet([2, 4]))

      expect(bitSet.has(1)).toBeFalsy()
      expect(bitSet.has(2)).toBeTruthy()
      expect(bitSet.has(3)).toBeFalsy()
      expect(bitSet.has(4)).toBeTruthy()
    })
  })

  describe('containsAll', () => {
    it('returns true when the bitset does contain all items in the other given bitset', () => {
      const bitSetOne = new BitSet([1, 3, 5, 20])
      const bitSetTwo = new BitSet([1, 3, 5, 20])

      expect(bitSetOne.containsAll(bitSetTwo)).toBe(true)
    })

    it('returns false when the bitset does not contain all items in the other given bitset', () => {
      const bitSetOne = new BitSet([1, 3])
      const bitSetTwo = new BitSet([2, 3])

      expect(bitSetOne.containsAll(bitSetTwo)).toBe(false)
    })
  })

  describe('containsAny', () => {
    it('returns true when the bitset does contain any item in the other given bitset', () => {
      const bitSetOne = new BitSet([0, 3])
      const bitSetTwo = new BitSet([0, 2])

      expect(bitSetOne.containsAny(bitSetTwo)).toBe(true)
    })

    it('returns false when the bitset does not contain any item in the other given bitset', () => {
      const bitSetOne = new BitSet([1, 3])
      const bitSetTwo = new BitSet([2, 4])

      expect(bitSetOne.containsAny(bitSetTwo)).toBe(false)
    })
  })
})
