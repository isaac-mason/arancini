export class EventDispatcher<E> {
  listeners: Set<(event: E) => void> = new Set();

  /**
   * Subscribe to events
   * @param handler the handler for the event
   * @returns a function to unsubscribe from the event
   */
  add(handler: (event: E) => void): this {
    this.listeners.add(handler);

    return this;
  }

  /**
   * Unsubscribe to events
   * @param handler the handler to unsubscribe
   */
  remove(handler: (event: E) => void): this {
    this.listeners.delete(handler);

    return this;
  }

  /**
   * Emits an event for handling by listeners
   * @param event the event
   */
  emit(event: E): void {
    for (const handler of this.listeners.values()) {
      handler(event);
    }
  }

  /**
   * Clears all event listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}
