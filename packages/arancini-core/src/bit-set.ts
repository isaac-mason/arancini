/**
 * Minimal implementation of a bitset / bit array
 *
 * @see https://en.wikipedia.org/wiki/Bit_array
 */
export class BitSet {
  words: Uint32Array

  constructor(indices: Iterable<number> = []) {
    this.words = new Uint32Array(8)
    for (const word of indices) {
      this.add(word)
    }
  }

  add(...indices: number[]): void {
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i]
      this.resize(index)
      this.words[index >>> 5] |= 1 << index
    }
  }

  remove(...indices: number[]): void {
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i]
      this.resize(index)
      this.words[index >>> 5] &= ~(1 << index)
    }
  }

  has(index: number): boolean {
    return (this.words[index >>> 5] & (1 << index)) !== 0
  }

  resize(index: number): void {
    if (this.words.length << 5 > index) {
      return
    }

    const count = (index + 32) >>> 5
    const newWords = new Uint32Array(count << 1)
    newWords.set(this.words)
    this.words = newWords
  }

  reset(): void {
    for (let i = 0; i < this.words.length; i++) {
      this.words[i] = 0
    }
  }

  copy(bitset: BitSet): void {
    const array = new Uint32Array(bitset.words.length)
    array.set(bitset.words)
    this.words = array
  }

  clone(): BitSet {
    const array = new Uint32Array(this.words.length)
    array.set(this.words)

    const bs = new BitSet()
    bs.words = array
    return bs
  }

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
