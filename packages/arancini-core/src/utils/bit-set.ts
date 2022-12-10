/* eslint-disable no-bitwise */

/**
 * Minimal implementation of a bitset / bit array
 *
 * @see https://en.wikipedia.org/wiki/Bit_array
 */
export class BitSet {
  words: Uint32Array

  /**
   * Constructor for a new BitSet
   * @param indices initial indices for the BitSet
   */
  constructor(indices: Iterable<number> = []) {
    this.words = new Uint32Array(8)
    for (const word of indices) {
      this.add(word)
    }
  }

  /**
   * Adds a given index to the BitSet
   * @param index the index to add
   */
  add(index: number): void {
    this.resize(index)
    this.words[index >>> 5] |= 1 << index
  }

  /**
   * Removes a given index from the BitSet
   * @param index the index to remove
   */
  remove(index: number): void {
    this.resize(index)
    this.words[index >>> 5] &= ~(1 << index)
  }

  /**
   * Returns whether the given index is set
   * @param index the index
   * @returns whether the given index is set
   */
  has(index: number): boolean {
    return (this.words[index >>> 5] & (1 << index)) !== 0
  }

  /**
   * Resizes the bitset
   * @param index the max index
   */
  resize(index: number): void {
    if (this.words.length << 5 > index) {
      return
    }

    const count = (index + 32) >>> 5
    const newWords = new Uint32Array(count << 1)
    newWords.set(this.words)
    this.words = newWords
  }

  /**
   * Clears all words in the BitSet
   */
  reset(): void {
    for (let i = 0; i < this.words.length; i++) {
      this.words[i] = 0
    }
  }

  /**
   * Copies the contents of another BitSet into this BitSet
   * @param bitset the other BitSet
   */
  copy(bitset: BitSet): void {
    const array = new Uint32Array(bitset.words.length)
    array.set(bitset.words)
    this.words = array
  }

  /**
   * Creates a clone of this BitSet
   * @returns a clone of this BitSet
   */
  clone(): BitSet {
    const array = new Uint32Array(this.words.length)
    array.set(this.words)

    const bs = new BitSet()
    bs.words = array
    return bs
  }

  /**
   * Returns whether this BitSet contains all indices in another BitSet
   * @param other the other BitSet
   * @returns whether this BitSet contains all indices in another BitSet
   */
  containsAll(other: BitSet): boolean {
    for (let i = 0; i < this.words.length; i++) {
      // Check whether this word has any bits set that are not set in the other word
      // '&' -> Sets each bit to 1 if both bits are 1
      // '~' -> Inverts all bits
      if ((~this.words[i] & other.words[i]) !== 0) {
        return false
      }
    }

    return true
  }

  /**
   * Returns whether this BitSet contains any indices in another BitSet
   * @param other the other BitSet
   * @returns whether this BitSet contains any indices in another BitSet
   */
  containsAny(other: BitSet): boolean {
    for (let i = 0; i < this.words.length; i++) {
      // Check whether this word and the other word have any common bits
      if ((this.words[i] & other.words[i]) !== 0) {
        return true
      }
    }

    return false
  }
}
