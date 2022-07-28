import { uniqueId } from '../utils/uniqueId';

/**
 * An event that can be broadcast and consumed by entities and components
 */
export interface Event {
  topic: string;
}

/**
 * An event subscription
 */
export type EventSubscription = {
  id: string;
  unsubscribe: () => void;
};

/**
 * An event handler that takes an event or a type that extends the event type
 */
export type EventHandler<E extends Event | Event> = (event: E) => void;

/**
 * Params for creating an EventSystem
 */
export type EventSystemParams = {
  /**
   * If true, events will be queued and processed on calling `.tick()`. If false, events will be processed immediately on emit
   * @see EventSystem.queued
   */
  queued: boolean;
};

/**
 * EventSystem that can register event handlers and process events, either immediately or by queuing events
 */
export class EventSystem {
  /**
   * The events that will be processed on the next update
   */
  private buffer: Event[] = [];

  /**
   * The event handlers
   */
  private handlers: Map<string, Map<string, EventHandler<Event>>> = new Map();

  /**
   * If true, events will be queued and processed on calling `.tick()`. If false, events will be processed immediately on emit.
   * By default, this will be `false`; events will be processed immediately.
   * @see EventSystemParams.queued
   */
  private queued: boolean;

  /**
   * Constructor for an EventSystem
   * @param params params for creating the event system
   */
  constructor(params?: EventSystemParams) {
    this.queued = params?.queued || false;
  }

  /**
   * Processes all events currently in the buffer
   */
  tick(): void {
    this.buffer
      .splice(0, this.buffer.length)
      .forEach((e: Event) => this.process(e));
  }

  /**
   * Adds a handler to the event system
   * @param eventName the event name
   * @param handlerName the name of the handler
   * @param handler the handler function
   * @returns the id of the new handler
   */
  on<E extends Event | Event>(
    eventName: string,
    handler: EventHandler<E>
  ): EventSubscription {
    const id = uniqueId();
    let eventHandlers = this.handlers.get(eventName);

    if (eventHandlers === undefined) {
      eventHandlers = new Map<string, EventHandler<Event>>();
      this.handlers.set(eventName, eventHandlers);
    }

    eventHandlers.set(id, handler as EventHandler<Event>);

    return {
      id,
      unsubscribe: () => this.removeHandler(eventName, id),
    };
  }

  /**
   * Removes an event handler by handler id
   * @param eventName the name of the event
   * @param handlerId the id of the event handler
   */
  removeHandler(eventName: string, handlerId: string): void {
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers !== undefined) {
      eventHandlers.delete(handlerId);
    }
  }

  /**
   * Emits an event for handling by the event system
   * The event will not be handled immediately, but will be put in the buffer for processing on the next tick
   * @param event the event to broadcast
   */
  emit(event: Event): void {
    if (this.queued) {
      this.buffer.push(event);
    } else {
      this.process(event);
    }
  }

  /**
   * Resets the event system
   */
  reset(): void {
    this.handlers.clear();
    this.buffer = [];
  }

  /**
   * Processes an event with the given handler
   * @param event the event to process
   */
  private process(event: Event): void {
    const eventHandlers = this.handlers.get(event.topic);
    if (eventHandlers !== undefined) {
      eventHandlers.forEach((handler: EventHandler<Event>) => handler(event));
    }
  }
}
