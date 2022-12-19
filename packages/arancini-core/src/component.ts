import { Entity } from './entity'
import { Space } from './space'
import { uniqueId } from './utils'
import { World } from './world'

export type ComponentDetails = {
  type: ComponentClass
  args?: unknown[]
}

export type ComponentClass<T extends Component | Component = Component> = {
  new (...args: never[]): T
  componentIndex: number
}

/**
 * Arancini Components implement the abstract class `Component`, and can have any properties and methods. A component, belongs to a single Entity.
 *
 * Component objects are reused. See the documentation for the `construct` method for initializing properties.
 *
 * ```ts
 * import { Component, World } from '@arancini/core'
 *
 * class ExampleComponent extends Component {
 *   // When using typescript, the `!:` not null assertion can be used as a "late-init" syntax.
 *   // You must take care to set all class properties in the `construct` method.
 *   x!: number
 *   y!: number
 *
 *   // Think of the `construct` method as a constructor.
 *   // Component objects are re-used, and this `construct` method is run on reuse.
 *   // If properties should be set from "constructor" arguments, or have default values,
 *   // those properties should be set here.
 *   construct(x: number, y: number) {
 *     this.x = x
 *     this.y = y
 *   }
 *
 *   onInit() {
 *     // called on component init
 *   }
 *
 *   onDestroy() {
 *     // called on destroying the component
 *   }
 * }
 *
 * // create a world and register the component
 * const world = new World()
 * world.registerComponent(ExampleComponent)
 *
 * // create a space
 * const space = world.create.space()
 *
 * // create an entity in the space
 * const entity = space.create.entity()
 *
 * // add the example component to the entity
 * const x = 1
 * const y = 2
 * entity.add(ExampleComponent, x, y)
 * ```
 */
export abstract class Component {
  /**
   * This component instances unique id
   */
  id: string = uniqueId()

  /**
   * The entity this component belongs to.
   */
  entity!: Entity

  /**
   * The Space the components entity is in
   */
  get space(): Space {
    return this.entity.space
  }

  /**
   * The World the components entity is in
   */
  get world(): World {
    return this.entity.world
  }

  /**
   * The class the component was constructed from
   * @private
   */
  _class!: ComponentClass

  static componentIndex: number

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
   * This is safe as the `construct` method will always be run before `onInit` and `onDestroy`, and the component will not be accessible by system queries until `construct` has run.
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
   *   onInit(): void {
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
}
