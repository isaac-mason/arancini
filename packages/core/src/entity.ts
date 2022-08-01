import type { ComponentClass } from './component';
import { Component } from './component';
import { Event, EventHandler, EventSubscription, EventSystem } from './events';
import { Space } from './space';
import { uniqueId } from './utils';
import { BitSet } from './utils/bit-set';
import { World } from './world';

/**
 * An Entity is a collection of Components with a unique id.
 *
 * Entities can have components dynamically added and removed from them.
 *
 * Aside from containing Components, Entities in recs also have an event system that can be used to share data.
 *
 * ```ts
 * import { Component, World } from '@rapidajs/recs';
 *
 * // example tag component without any data or behavior
 * class ExampleComponent extends Component {}
 *
 * // create a world, space, and an entity
 * const world = new World();
 * const space = world.create.space();
 * const entity = world.create.entity();
 *
 * // try retrieving a component that isn't in the entity
 * entity.find(ExampleComponent) // returns `undefined`
 * entity.get(ExampleComponent) // throws Error
 *
 * // add ExampleComponent to the entity
 * const exampleComponent = entity.addComponent(ExampleComponent);
 *
 * entity.has(ExampleComponent); // returns `true`
 * entity.get(ExampleComponent) // returns `exampleComponent`
 * entity.get(ExampleComponent) // returns `exampleComponent`
 *
 * // subscribe to an entity event
 * space.on("event-name", (event) => {
 *   console.log(event);
 * });
 *
 * // emit an entity event
 * space.emit({
 *   topic: "event-name",
 *   data: { x: 0, y: 0 },
 * });
 *
 * // remove the component
 * entity.removeComponent(ExampleComponent);
 *
 * // destroy the entity
 * entity.destroy();
 * ```
 */
export class Entity {
  /**
   * The unique ID of the entity
   */
  id = uniqueId();

  /**
   * Whether the entity is alive. If false, the entity will be destroyed on the next update
   */
  alive = true;

  /**
   * Map of component classes to components
   */
  components: Map<{ new (...args: never[]): Component }, Component> = new Map();

  /**
   * BitSet containing component indices for Components in this Entitiy
   */
  componentsBitSet = new BitSet();

  /**
   * Components queued for removal on the next update
   */
  componentsToRemove: Component[] = [];

  /**
   * The event system for the entity
   */
  events = new EventSystem();

  /**
   * Whether the entity has been initialised
   */
  initialised = false;

  /**
   * The space the entity is in
   */
  space!: Space;

  /**
   * The World the entity is in
   */
  get world(): World {
    return this.space.world;
  }

  /**
   * Adds a component to the entity
   * @param clazz the component to add
   */
  addComponent<T extends Component>(
    clazz: ComponentClass<T>,
    ...args: Parameters<T['construct']>
  ): T {
    // add the component to this entity
    const component = this.world.spaceManager.addComponentToEntity(
      this,
      clazz,
      args
    );

    // inform the query manager that the component has been initialised
    this.world.queryManager.onEntityComponentChange(this);

    return component;
  }

  /**
   * Destroy the entities components and set the entity as dead immediately
   * @param options options for destroying the entity
   */
  destroy(
    options: {
      /**
       * Whether the entity should be destroyed immediately, or in the next update. Defaults to false
       */
      immediately?: boolean;
    } = { immediately: false }
  ): void {
    if (options.immediately) {
      this.space.remove(this);
    } else {
      this.alive = false;
    }
  }

  /**
   * Broadcasts an event to the Entity EventSystem
   * @param event the event to broadcast
   */
  emit<E extends Event | Event>(event: E): void {
    this.events.emit(event);
  }

  /**
   * Retrieves a component on an entity by type, returns undefined if the component is not in the entity
   * @param value a constructor for the component type to retrieve
   * @returns the component if it is found, or undefined
   */
  find<T extends Component | Component>(
    value: ComponentClass<T>
  ): T | undefined {
    const component: Component | undefined = this.components.get(value);

    if (component) {
      return component as T;
    }

    return undefined;
  }

  /**
   * Retrieves a component on an entity by type, throws an error if the component is not in the entity
   * @param value a constructor for the component type to retrieve
   * @returns the component
   */
  get<T extends Component | Component>(value: ComponentClass<T>): T {
    const component: Component | undefined = this.components.get(value);

    if (component !== undefined) {
      return component as T;
    }

    throw new Error(`Component ${value}} not in entity ${this.id}`);
  }

  /**
   * Returns whether the entity contains the given component
   * @param value the component constructor, a component instance, or the string name of the component
   * @returns whether the entity contains the given component
   */
  has(value: ComponentClass): boolean {
    return this.components.has(value);
  }

  /**
   * Adds a handler for entity events
   * @param eventName the event name
   * @param handler the handler function
   * @returns the subscription
   */
  on<E extends Event | Event>(
    eventName: string,
    handler: EventHandler<E>
  ): EventSubscription {
    return this.events.on(eventName, handler);
  }

  /**
   * Removes a component from the entity and destroys it
   * The value can either be a Component constructor, or the component instance itself
   * @param value the component to remove and destroy
   * @param options options for destroying the entity
   * @param options.immediately whether the component should be removed immediately
   */
  removeComponent(
    value: Component | ComponentClass,
    options?: { immediately?: boolean }
  ): Entity {
    let component: Component | undefined;

    if (value instanceof Component) {
      if (!this.components.has(value.__recs.class)) {
        throw new Error('Component instance does not exist in Entity');
      }
      component = value;
    } else {
      component = this.find(value);
      if (component === undefined) {
        throw new Error('Component does not exist in Entity');
      }
    }

    if (options?.immediately) {
      this.world.spaceManager.removeComponentFromEntity(this, component, true);
    } else {
      this.componentsToRemove.push(component);
    }

    return this;
  }
}
