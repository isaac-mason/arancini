/**
 * Function to unsubscribe from an event
 */
export type Unsubscribe = () => void

export class EventDispatcher<E> {
  listeners: Set<(event: E) => void> = new Set()

  /**
   * Subscribe to events
   * @param handler the handler for the event
   * @returns a function to unsubscribe from the event
   */
  add(handler: (event: E) => void): Unsubscribe {
    this.listeners.add(handler)

    return () => this.remove(handler)
  }

  /**
   * Unsubscribe to events
   * @param handler the handler to unsubscribe
   */
  remove(handler: (event: E) => void): void {
    this.listeners.delete(handler)
  }

  /**
   * Emits an event for handling by listeners
   * @param event the event
   */
  emit(event: E): void {
    for (const handler of this.listeners.values()) {
      handler(event)
    }
  }

  /**
   * Clears all event listeners
   */
  clear(): void {
    this.listeners.clear()
  }
}
