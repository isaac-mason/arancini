import * as A from '@arancini/core'
import React, {
  createContext,
  ForwardedRef,
  forwardRef,
  memo,
  PropsWithRef,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useIsomorphicLayoutEffect, useRerender } from './hooks'

type Children = ReactNode | JSX.Element

type EntityProviderContext<Entity extends A.AnyEntity> = Entity | undefined

export type EntityProps<Entity extends A.AnyEntity> = {
  entity?: Entity
  children?: Children
} & (
  | {
      [C in keyof Entity]?: Entity[C]
    }
  | {}
)

export type ComponentProps<E, C extends keyof E> = {
  name: C
  value?: E[C]
  children?: Children
}

export type ReactAPI<E extends A.AnyEntity> = ReturnType<
  typeof createReactAPI<E>
>

export const createReactAPI = <E extends A.AnyEntity>(world: A.World<E>) => {
  const entityContext = createContext(null! as EntityProviderContext<E>)

  const useCurrentEntity = (): E | undefined => {
    const entity = useContext(entityContext)

    return entity
  }

  const RawEntity = <T extends E>(
    {
      children,
      entity: existingEntity,
      ...propComponents
    }: EntityProps<T> & { ref?: ForwardedRef<T> },
    ref: ForwardedRef<E>
  ) => {
    const newEntity = useRef({})

    const [entity, setEntity] = useState<E>()

    useEffect(() => {
      const e = existingEntity || world.create(newEntity.current as T)

      setEntity(e)

      return () => {
        if (existingEntity) return

        world.destroy(e)
      }
    }, [])

    useImperativeHandle(ref, () => entity!, [entity])

    const lastComponents = useRef<E>({} as E)

    useEffect(() => {
      if (!entity) return

      if (!world.has(entity)) return

      const components = propComponents as E

      world.update(entity, (e) => {
        for (const name in components) {
          e[name] = components[name]
        }

        for (const name in lastComponents.current) {
          if (components[name] === undefined) {
            delete e[name]
          }
        }
      })

      return () => {
        lastComponents.current = components
      }
    }, [entity, propComponents])

    return (
      <entityContext.Provider value={entity}>{children}</entityContext.Provider>
    )
  }

  const Entity = memo(forwardRef(RawEntity)) as <T extends E>(
    props: PropsWithRef<EntityProps<T> & { ref?: ForwardedRef<T> }>
  ) => ReactElement

  const Component = <C extends keyof E>({
    name,
    value,
    children,
  }: ComponentProps<E, C>) => {
    const [childRef, setChildRef] = useState<E[C]>()

    const entity = useContext(entityContext)

    useIsomorphicLayoutEffect(() => {
      if (!entity) return

      let componentData: E[C]

      if (children !== undefined) {
        // if a child is present, use their ref as the component's value
        componentData = childRef as never
      } else {
        // otherwise, use the value prop
        componentData = value!
      }

      // only add the component if it doesn't exist, otherwise change its value
      if (entity[name] === undefined) {
        world.add(entity, name, componentData!)
      } else {
        entity[name] = componentData
      }

      return () => {
        if (entity[name] === undefined) return

        world.remove(entity, name)
      }
    }, [entity, name, value, childRef])

    // capture ref of child
    if (children) {
      const child = React.Children.only(children) as ReactElement

      return React.cloneElement(child, {
        ref: setChildRef,
      })
    }

    return null
  }

  const useContainer = <T extends E>(container: A.EntityContainer<T>) => {
    const rerender = useRerender()

    const originalVersion = useMemo(() => container.version, [container])

    useIsomorphicLayoutEffect(() => {
      if (container.version !== originalVersion) rerender()
    }, [container])

    useIsomorphicLayoutEffect(
      () => container.onEntityAdded.add(rerender),
      [container, rerender]
    )

    useIsomorphicLayoutEffect(
      () => container.onEntityRemoved.add(rerender),
      [container, rerender]
    )

    return container
  }

  const useQuery = <T extends E>(query: A.Query<T>) => {
    return useContainer(query)
  }

  type EntitiesInListProps<T extends E> = {
    entities: T[]
    children: Children | ((entity: T) => Children)
  }

  const EntitiesInList = <T extends E>({
    entities,
    children,
  }: EntitiesInListProps<T>) => {
    return (
      <>
        {entities.map((entity) => (
          <Entity key={world.id(entity)} entity={entity}>
            {typeof children === 'function' ? children(entity) : children}
          </Entity>
        ))}
      </>
    )
  }

  type EntitiesInContainerProps<T extends E> = {
    container: A.EntityContainer<T>
    children: Children | ((entity: T) => Children)
  }

  const EntitiesInContainer = <T extends E>({
    container: entities,
    children,
  }: EntitiesInContainerProps<T>) => {
    const container = useContainer(entities)

    return (
      <EntitiesInList entities={[...container.entities]} children={children} />
    )
  }

  const Entities = <T extends E>(props: {
    in: T[] | A.EntityContainer<T>
    children: Children | ((entity: T) => Children)
  }): ReactElement => {
    if (props.in instanceof A.EntityContainer) {
      return (
        <EntitiesInContainer container={props.in} children={props.children} />
      )
    }

    return (
      <EntitiesInList entities={props.in as T[]} children={props.children} />
    )
  }

  return {
    Entity,
    Entities,
    Component,
    useCurrentEntity,
    useQuery,
    world,
  }
}
