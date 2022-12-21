import type { ComponentDetails } from './component'
import type { Entity } from './entity'
import type { Event, EventHandler, EventSubscription } from './events'
import { EventSystem } from './events'
import { uniqueId } from './utils'
import type { World } from './world'

/**
 * Params for creating a new Space
 */
export type SpaceParams = {
  /**
   * An id for the space, must be unique
   */
  id?: string
}

/**
 * Spaces are containers for Entities that can be added and removed from a world.
 *
 * They are useful for grouping Entities together that work together to do something.
 * For example, separate spaces could be used in a game to represent different rooms.
 * On entering a room, a Space could be created to house all Entities for that room,
 * then the Space could be removed on leaving that room.
 *
 * Aside from containing Entities, Spaces also have an event system.
 *
 * ```ts
 * import { World } from '@arancini/core'
 *
 * // create a new world
 * const world = new World()
 *
 * // create a space in the world
 * const space = world.create.space()
 *
 * // create an entity in the space
 * const entity = space.create.entity()
 *
 * // subscribe to a space event
 * space.on('event-name', (event) => {
 *   console.log(event);
 * })
 *
 * // emit a space event
 * space.emit({
 *   topic: 'event-name',
 *   data: { x: 0, y: 0 },
 * })
 *
 * // destroy the space and all entities in it
 * space.destroy()
 * ```
 */
export class Space {
  /**
   * A unique ID for the space
   */
  id: string

  /**
   * Entities in the space
   */
  entities: Map<string, Entity> = new Map()

  /**
   * The spaces event system
   */
  events = new EventSystem()

  /**
   * Whether the space has been initialised
   */
  initialised = false

  /**
   * The world the space is in
   */
  world: World

  /**
   * Constructor for the Space
   * @param world the world the space is in
   * @param params the parameters for the space
   */
  constructor(world: World, params?: SpaceParams) {
    this.world = world
    this.id = params?.id || uniqueId()
  }

  /**
   * Retrieves space factories
   */
  get create(): {
    /**
     * Creates a new entity in the space
     * @returns a new entity
     */
    entity: (components?: ComponentDetails[]) => Entity
  } {
    return {
      entity: (components) => {
        return this.world.spaceManager.createEntity(this, components)
      },
    }
  }

  /**
   * Broadcasts an event to the Space
   * @param event the event to broadcast in the Space
   */
  emit<E extends Event | Event>(event: E): void {
    this.events.emit(event)
  }

  /**
   * Adds a handler for Space events
   * @param topic the topic name
   * @param handler the handler function
   * @returns the id of the new handler
   */
  on<E extends Event | Event>(
    topic: E['topic'],
    handler: EventHandler<E>
  ): EventSubscription {
    return this.events.on(topic, handler)
  }

  /**
   * Destroys the space and removes it from the World
   */
  destroy(): void {
    this.world.spaceManager.destroySpace(this)
  }
}
