import { Entity } from './entity'
import { uniqueId } from './utils'

export type ComponentDetails = {
  type: ComponentClass
  args?: unknown[]
}

export type ComponentClass<T extends Component | Component = Component> = {
  new (...args: unknown[]): T
  componentIndex: number
}

/**
 * Arancini Components implement the abstract class `Component`, and can have any properties and methods. A component, belongs to a single Entity.
 *
 * Component objects are reused. See the documentation for the `construct` method for initializing properties.
 *
 * @example creating a basic data component
 * ```ts
 * import { Component } from '@arancini/core'
 *
 * const PositionComponent = Component.data<{ x: number, y: number }>('Position')
 * ```
 *
 * @example creating a tag component
 * ```ts
 * import { Component } from '@arancini/core'
 *
 * const PoweredUpComponent = Component.tag('PoweredUp')
 * ```
 *
 * @example creating a component by extending the `Component` class
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
 * // create an entity
 * const entity = world.create()
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
   * @private internal
   */
  _id: string = uniqueId()

  /**
   * The entity this component belongs to.
   * @private internal
   */
  _entity!: Entity

  /**
   * The class the component was constructed from
   * @private internal
   */
  _class!: ComponentClass

  static componentIndex: number

  /**
   * Properties can be be initialised with arguments with the `construct` method.
   *
   * Component instances are object pooled. To prevent unexpected behavior properties should be initialised or reset in the `construct` method.
   *
   * @example
   * ```ts
   * class MyComponent extends Component {
   *   exampleNumber!: number;
   *
   *   exampleMap = new Map();
   *
   *   construct(): void {
   *     this.exampleNumber = 0;
   *
   *     this.exampleMap.clear();
   *   }
   *
   *   onInit(): void {
   *     // because we used the not-null operator `!:` the type of `this.exampleProperty` here will be `number`, as opposed to `number | undefined`
   *     this.exampleProperty += 1;
   *   }
   * }
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
   * Creates a simple data component with the given type.
   *
   * The following object keys are reserved:
   * - `_id`
   * - `_entity`
   * - `_class`
   * - `construct`
   *
   * @param name an optional name for the component
   * @return data component
   *
   * @example
   * ```ts
   * import { Component } from '@arancini/core'
   *
   * const PositionComponent = Component.data<{ x: number, y: number }>('Position')
   * ```
   */
  static data<T extends Record<string, unknown>>(name?: string) {
    const DataComponent = class extends Component {
      construct(value: unknown): void {
        Object.assign(this, value)
      }
    }

    if (name) {
      Object.defineProperty(DataComponent, 'name', { value: name })
    }

    return DataComponent as typeof DataComponent & {
      new (...args: unknown[]): InstanceType<typeof DataComponent> &
        T & {
          construct(value: T): void
        }
    }
  }

  /**
   * Creates a tag component
   * @param name an optional name for the component
   * @returns tag component
   *
   * @example
   * ```ts
   * import { Component } from '@arancini/core'
   *
   * const PoweredUpComponent = Component.tag('PoweredUp')
   * ```
   */
  static tag(name?: string) {
    const TagComponent = class extends Component {}

    if (name) {
      Object.defineProperty(TagComponent, 'name', { value: name })
    }

    return TagComponent
  }
}
