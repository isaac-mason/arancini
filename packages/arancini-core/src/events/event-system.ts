import { EventDispatcher } from './event-dispatcher'

/**
 * An event that can be broadcast and consumed by entities and components
 */
export interface Event {
  topic: string
}

/**
 * An event handler that takes an event or a type that extends the event type
 */
export type EventHandler<E extends Event = Event> = (event: E) => void

/**
 * A subscription to an event
 */
export type Unsubscribe = () => void

/**
 * Params for creating an EventSystem
 */
export type EventSystemParams = {
  /**
   * If true, events will be queued and processed on calling `.tick()`. If false, events will be processed immediately on emit
   * @see EventSystem.queued
   */
  queued: boolean
}

/**
 * EventSystem that can register event handlers and process events, either immediately or by queuing events
 */
export class EventSystem {
  /**
   * The events that will be processed on the next update, if the event system is queued
   */
  private queue: Event[] = []

  /**
   * The event dispatchers
   */
  private dispatchers: Map<string, EventDispatcher<never>> = new Map()

  /**
   * If true, events will be queued and processed on calling `.tick()`. If false, events will be processed immediately on emit.
   * By default, this will be `false`; events will be processed immediately.
   * @see EventSystemParams.queued
   */
  private queued: boolean

  /**
   * Constructor for an EventSystem
   * @param params params for creating the event system
   */
  constructor(params?: EventSystemParams) {
    this.queued = params?.queued || false
  }

  /**
   * Processes all events currently in the queue
   */
  tick(): void {
    this.queue
      .splice(0, this.queue.length)
      .forEach((e: Event) => this.process(e))
  }

  /**
   * Adds a handler to the event system
   * @param topic the event topic
   * @param handler the handler function
   * @returns the id of the new handler
   */
  on<E extends Event | Event>(
    topic: string,
    handler: EventHandler<E>
  ): Unsubscribe {
    let eventDispatcher = this.dispatchers.get(topic)

    if (eventDispatcher === undefined) {
      eventDispatcher = new EventDispatcher()
      this.dispatchers.set(topic, eventDispatcher)
    }

    eventDispatcher.add(handler)

    return () => this.unsubscribe(topic, handler)
  }

  /**
   * Removes an event handler by handler id
   * @param topic the name of the event
   * @param handler the event handler
   */
  unsubscribe(topic: string, handler: EventHandler<never>): void {
    const eventHandlers = this.dispatchers.get(topic)
    if (eventHandlers !== undefined) {
      eventHandlers.remove(handler)
    }
  }

  /**
   * Emits an event for handling by the event system
   * The event will not be handled immediately, but will be put in the buffer for processing on the next tick
   * @param event the event to broadcast
   */
  emit(event: Event): void {
    if (this.queued) {
      this.queue.push(event)
    } else {
      this.process(event)
    }
  }

  /**
   * Resets the event system
   */
  reset(): void {
    this.dispatchers.clear()
    this.queue = []
  }

  /**
   * Processes an event with the given handler
   * @param event the event to process
   */
  private process(event: Event): void {
    const dispatcher = this.dispatchers.get(event.topic)
    if (dispatcher !== undefined) {
      dispatcher.emit(event as never)
    }
  }
}
