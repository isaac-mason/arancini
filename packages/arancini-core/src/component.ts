import { Entity } from './entity'

export const ComponentDefinitionType = {
  CLASS: 1,
  OBJECT: 2,
  TAG: 3,
} as const

/**
 * @private internal
 */
export type InternalComponentInstanceProperties = {
  _arancini_component_definition?: ComponentDefinition<unknown>
  _arancini_id?: string
  _arancini_entity?: Entity
}

export type ClassComponentDefinition<T = unknown> = {
  name?: string
  componentIndex: number
  objectPooled: boolean

  T?: T
} & { type: typeof ComponentDefinitionType.CLASS; new (): T }

export type ObjectComponentDefinition<T = unknown> = {
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

export type ComponentDefinition<T = unknown> =
  | ClassComponentDefinition<T>
  | ObjectComponentDefinition<T>
  | TagComponentDefinition

export type ComponentInstance<T extends ComponentDefinition<unknown>> =
  // class
  T['type'] extends typeof ComponentDefinitionType.CLASS
    ? T extends {
        new (...args: any[]): infer U
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
        new (args: any[]): infer U
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

export type ComponentType = {
  construct: (...args: any[]) => void
  onInit: () => void
  onDestroy: () => void
}

/**
 * Decorator for opting ia class component into being object objectPooled.
 *
 * @example defining an object pooled component using the @objectPool decorator
 * ```ts
 * import { Component, objectPooled, World } from '@arancini/core'
 *
 * @objectPooled()
 * class ExampleComponent extends Component {
 * }
 * ```
 *
 * This can also be achieved by setting the `objectPooled` property on a component class
 * @example vanilla js
 * ```js
 * import { Component } from '@arancini/core'
 *
 * class ExampleComponent extends Component {}
 * ExampleComponent.objectPooled = true
 * ```
 */
export const objectPooled =
  () => (target: { new (): Component; objectPooled: boolean }, _value: any) => {
    target.objectPooled = true
  }

/**
 * The base class for class components.
 *
 *  * @example defining and creating a class component that extends the `Component` class and uses the `@objectPooled` decorator
 * ```ts
 * import { Component, objectPooled, World } from '@arancini/core'
 *
 * @objectPooled()
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
export class Component implements ComponentType {
  construct(..._args: any[]): void {}
  onInit() {}
  onDestroy() {}

  static componentIndex: number
  static type = ComponentDefinitionType.CLASS
  static objectPooled = false as const

  /**
   * @ignore
   */
  _arancini_id!: string

  /**
   * @ignore
   */
  _arancini_entity!: Entity

  /**
   * @ignore
   */
  _arancini_component_definition!: ComponentDefinition<unknown>
}

/**
 * Creates an object component definition with the given type.
 *
 * @param name a name for the component
 * @return object component definition
 *
 *  * @example defining an object component
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
 */
export const defineObjectComponent = <T>(name: string) => {
  const componentDefinition: ObjectComponentDefinition<T> = {
    name,
    type: ComponentDefinitionType.OBJECT,
    componentIndex: -1,
    T: undefined as unknown as T,
  }

  return componentDefinition
}

/**
 * Creates a tag component definition.
 * @param name an name for the component
 * @returns tag component definition
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
 */
export const defineTagComponent = (name: string) => {
  const componentDefinition: TagComponentDefinition = {
    name,
    type: ComponentDefinitionType.TAG,
    componentIndex: -1,
    T: undefined,
  }

  return componentDefinition
}

export const cloneComponentDefinition = <
  T extends ComponentDefinition<unknown>,
>(
  componentDefinition: T
): T => {
  if (componentDefinition.type === ComponentDefinitionType.CLASS) {
    const clone = class extends (componentDefinition as any) {} as T
    clone.componentIndex = -1
    return clone
  }

  const clone = { ...componentDefinition }
  clone.componentIndex = -1
  return clone
}
