import { Entity } from './entity'

export type ComponentClass<T extends Component | Component = Component> = {
  new (...args: unknown[]): T
  componentIndex: number
  type: typeof ComponentDefinitionType.CLASS
}

export const ComponentDefinitionType = {
  CLASS: 0,
  OBJECT: 1,
  TAG: 2,
} as const

/**
 * @private internal
 */
export type InternalComponentInstanceProperties = {
  _arancini_component_definition?: ComponentDefinition<unknown>
  _arancini_id?: string
  _arancini_entity?: Entity
}

export type ComponentValue = Component | unknown

export type ClassComponentDefinition<T extends ComponentValue = unknown> = {
  type: typeof ComponentDefinitionType.CLASS

  name?: string
  componentIndex: number
  new (...args: unknown[]): T

  T?: T
}

export type ObjectComponentDefinition<T extends ComponentValue = unknown> = {
  type: typeof ComponentDefinitionType.OBJECT

  name?: string
  componentIndex: number

  T: T
}

export type TagComponentDefinition = {
  type: typeof ComponentDefinitionType.TAG

  name?: string
  componentIndex: number

  T: undefined
}

export type ComponentDefinition<T extends ComponentValue = unknown> =
  | ClassComponentDefinition<T>
  | ObjectComponentDefinition<T>
  | TagComponentDefinition

export type ComponentDefinitionInstance<
  T extends ComponentDefinition<unknown>
> =
  // class
  T['type'] extends typeof ComponentDefinitionType.CLASS
    ? T extends {
        new (...args: unknown[]): infer U
      }
      ? U
      : never
    : // object
    T['type'] extends typeof ComponentDefinitionType.OBJECT
    ? T['T']
    : // tag
    T['type'] extends typeof ComponentDefinitionType.TAG
    ? unknown
    : never

export type ComponentDefinitionArgs<T extends ComponentDefinition<unknown>> =
  // class
  T['type'] extends typeof ComponentDefinitionType.CLASS
    ? T extends {
        new (...args: unknown[]): infer U
      }
      ? U extends { construct(...args: infer Args): void }
        ? Args
        : never
      : never
    : // object
    T['type'] extends typeof ComponentDefinitionType.OBJECT
    ? [T['T']]
    : // tag
    T['type'] extends typeof ComponentDefinitionType.TAG
    ? []
    : never

/**
 * There are multiple ways to define a component in Arancini.
 *
 * You can define:
 * - an object component with the `Component.object` method
 * - a tag component with the `Component.tag` method
 * - a class component by extending the `Component` class
 *
 * To get the most out of arancini, you should use class components where possible.
 * Class components let you utilise arancini's object pooling and lifecycle features.
 *
 * @example defining an object component
 * ```ts
 * import { Component, World } from '@arancini/core'
 *
 * const PositionComponent = Component.object<{ x: number, y: number }>('Position')
 *
 * const world = new World()
 * world.registerComponent(PositionComponent)
 *
 * const entity = world.create()
 *
 * entity.add(PositionComponent, { x: 1, y: 2 })
 * ```
 *
 * @example defining a tag component
 * ```ts
 * import { Component, World } from '@arancini/core'
 *
 * const PoweredUpComponent = Component.tag('PoweredUp')
 *
 * const world = new World()
 * world.registerComponent(PoweredUpComponent)
 *
 * const entity = world.create()
 *
 * entity.add(PoweredUpComponent)
 * ```
 *
 * @example defining and creating a class component that extends the `Component` class
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
  _arancini_id!: string

  /**
   * The entity this component belongs to.
   * @private internal
   */
  _arancini_entity!: Entity

  /**
   * The class the component was constructed from
   * @private internal
   */
  _arancini_component_definition!: ComponentDefinition<unknown>

  static componentIndex: number

  static type = ComponentDefinitionType.CLASS

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
   * Creates an object component definition with the given type.
   *
   * @param name an optional name for the component, useful for debugging
   * @return object component definition
   *
   * @example
   * ```ts
   * import { object } from '@arancini/core'
   *
   * const PositionComponent = object<{ x: number, y: number }>('Position')
   * ```
   */
  static object<T extends object>(name?: string) {
    const componentDefinition: ComponentDefinition<T> = {
      name,
      type: ComponentDefinitionType.OBJECT,
      componentIndex: -1,
      T: undefined as unknown as T,
    }

    return componentDefinition
  }

  /**
   * Creates a tag component definition.
   * @param name an optional name for the component, useful for debugging
   * @returns tag component definition
   *
   * @example
   * ```ts
   * import { tag } from '@arancini/core'
   *
   * const PoweredUpComponent = tag('PoweredUp')
   * ```
   */
  static tag(name?: string) {
    const componentDefinition: ComponentDefinition<unknown> = {
      name,
      type: ComponentDefinitionType.TAG,
      componentIndex: -1,
      T: undefined,
    }

    return componentDefinition
  }
}
