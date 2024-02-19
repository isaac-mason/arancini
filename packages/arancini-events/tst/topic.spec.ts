import { describe, expect, test, vi } from 'vitest'
import { Topic } from '../src'

describe('Topic', () => {
  test('should emit events to listeners', () => {
    const topic = new Topic()
    const listenerOne = vi.fn()
    const listenerTwo = vi.fn()

    topic.add(listenerOne)
    topic.add(listenerTwo)

    topic.emit('1')

    expect(listenerOne).toHaveBeenCalledWith('1')
    expect(listenerTwo).toHaveBeenCalledWith('1')

    topic.remove(listenerTwo)

    topic.emit('2')

    expect(listenerOne).toHaveBeenCalledWith('2')
    expect(listenerTwo).not.toHaveBeenCalledWith('2')

    topic.clear()

    topic.emit('3')

    expect(listenerOne).not.toHaveBeenCalledWith('3')
    expect(listenerTwo).not.toHaveBeenCalledWith('3')
  })
})
