import { Entity } from './entity';
import { Space } from './space';
import { uniqueId } from './utils';

export type ComponentClass<T extends Component | Component = Component> = {
  new (...args: never[]): T;
};

/**
 * Components can have both data and behavior, and belong to a single Entity.
 *
 * If you are looking to use recs as more of a traditional ECS, Components should only contain data. If the `onUpdate` method is not overridden, the method will not be executed in world updates.
 *
 * The `onUpdate` method is only recommended for use on Components that will not have many instances, for example, player controller Components.
 *
 * A constructor should not be added to classes extending `Component`, as Component objects are reused. See the documentation for the `construct` method for initializing properties.
 *
 * ```ts
 * import { Component, World } from "@rapidajs/recs";
 *
 * class ExampleComponent extends Component {
 *   // When using typescript, the `!:` not null assertion can be used as a "late-init" syntax.
 *   // You must take care to set all class properties in the `construct` method.
 *   x!: number;
 *   y!: number;
 *
 *   // Think of the `construct` method as a constructor.
 *   // Component objects are re-used, and this `construct` method is run on reuse.
 *   // If properties should be set from "constructor" arguments, or have default values,
 *   // those properties should be set here.
 *   construct(x: number, y: number) {
 *     this.x = x;
 *     this.y = y;
 *   }
 *
 *   onInit() {
 *     // called on component init
 *   }
 *
 *   onUpdate(timeElapsed: number, currentTime: number) {
 *     // called on component updates
 *     // if this method is not overridden, it will not be executed
 *   }
 *
 *   onDestroy() {
 *     // called on destroying the component
 *   }
 * }
 *
 * // create a world
 * const world = new World();
 *
 * // create a space
 * const space = world.create.space();
 *
 * // create an entity in the space
 * const entity = space.create.entity();
 *
 * // add the example component to the entity
 * const x = 1;
 * const y = 2;
 * entity.addComponent(ExampleComponent, x, y);
 * ```
 */
export abstract class Component {
  /**
   * This component instances unique id
   */
  id: string = uniqueId();

  /**
   * The entity this component belongs to.
   */
  entity!: Entity;

  /**
   * The Space the components entity is in
   */
  get space(): Space {
    return this.entity.space;
  }

  /**
   * @private used internally, do not use directly
   */
  __recs!: {
    /**
     * The class the component was constructed from
     */
    class: ComponentClass;

    /**
     * The unique index for the component class
     */
    classIndex: number;
  };

  /**
   * Method for "constructing" a component instance.
   *
   * If a component has properties, this method should be implemented to set initial values for all of them.
   *
   * If a component is a tag with no properties, this method does not need to be implemented.
   *
   * Non-static component properties should not have values defined in the constructor, but should be initialised in this `construct` method.
   * The reason for this is component object instances will be reused, so in order to prevent unexpected behavior, they should be initialised in the `construct` method,
   * which will be executed as part of component reuse to return it to the starting state.
   *
   * The recommended way to handle this in TypeScript is to use the not-null operator for added properties, acting as a 'late-init' syntax for properties.
   * This is safe as the `construct` method will always be run before `onUpdate` and `onDestroy`, and the component will not be accessible by system queries until `construct` has run.
   * For example:
   *
   * ```ts
   * class MyComponent extends Component {
   *   exampleProperty!: number;
   *
   *   construct(): void {
   *     this.exampleProperty = 1; // here we initialise the value of exampleProperty
   *   }
   *
   *   onUpdate(): void {
   *     // because we used the not-null operator `!:` the type of `this.exampleProperty` here will be `number`, as opposed to `number | undefined`
   *     this.exampleProperty += 1;
   *   }
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, class-methods-use-this
  construct(..._args: any[] | []) {}

  /**
   * Destruction logic
   */
  onDestroy(): void {}

  /**
   * Initialisation logic
   */
  onInit(): void {}

  /**
   * Update logic for the component
   * If this method is not implemented in a component it will not be added to the update job pool
   * @param timeElapsed the time since the last update for this component in seconds
   * @param time the current time in seconds
   */
  onUpdate(_timeElapsed: number, _time: number) {}
}
