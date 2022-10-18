import { uniqueId } from '../utils';

export type EventSubscription = {
  id: string;
  unsubscribe: () => void;
};

export class EventDispatcher<E> {
  listeners: Map<string, (event: E) => void> = new Map();

  /**
   * Subscribe to events
   * @param handler the handler for the event
   * @returns a function to unsubscribe from the event
   */
  subscribe(handler: (event: E) => void): EventSubscription {
    const id = uniqueId();
    this.listeners.set(id, handler);

    return {
      id,
      unsubscribe: () => {
        this.unsubscribe(id);
      },
    };
  }

  /**
   * Unsubscribe to events
   * @param handlerId the id of the handler to unsubscribe
   */
  unsubscribe(handlerId: string): void {
    this.listeners.delete(handlerId);
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
