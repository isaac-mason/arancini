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
import { useIsomorphicLayoutEffect } from './hooks'

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
    const context = useContext(entityContext)
    return context ? context : undefined
  }

  const RawEntity = <T extends E>(
    {
      children,
      entity: existingEntity,
      ...propComponents
    }: EntityProps<T> & { ref?: ForwardedRef<T> },
    ref: ForwardedRef<E>
  ) => {
    const [newEntity] = useState(() => ({}) as E)
    const entity = existingEntity ?? newEntity

    const [init, setInit] = useState(false)

    useEffect(() => {
      if (world.has(entity)) {
        setInit(true)
        return
      }

      world.create(entity)

      setInit(true)

      return () => {
        setInit(false)

        if (world.has(entity)) {
          world.destroy(entity)
        }
      }
    }, [entity])

    const lastComponents = useRef<E>({} as E)

    useEffect(() => {
      const components = propComponents as E

      const removed = (
        Object.keys(lastComponents.current) as Array<keyof E>
      ).filter((name) => components[name] === undefined)

      world.update(entity, (e) => {
        for (const name in components) {
          e[name] = components[name]
        }

        for (const name of removed) {
          delete e[name]
        }

        return entity
      })

      return () => {
        lastComponents.current = components
      }
    }, [propComponents])

    useImperativeHandle(ref, () => entity)

    return (
      <entityContext.Provider value={init ? entity : undefined}>
        {children}
      </entityContext.Provider>
    )
  }

  const Entity = memo(forwardRef(RawEntity)) as <T extends E>(
    props: PropsWithRef<EntityProps<T> & { ref?: ForwardedRef<T> }>
  ) => ReactElement

  const useContainer = <T extends E>(container: A.EntityContainer<T>) => {
    const [, setVersion] = useState(-1)

    const rerender = () => {
      setVersion((v) => v + 1)
    }

    useIsomorphicLayoutEffect(() => {
      container.onEntityAdded.add(rerender)
      container.onEntityRemoved.add(rerender)

      return () => {
        container.onEntityAdded.remove(rerender)
        container.onEntityRemoved.remove(rerender)
      }
    }, [])

    useIsomorphicLayoutEffect(rerender, [])

    return container
  }

  const useQuery = <T extends E>(
    query: A.QueryDescription<E, T> | A.Query<T>
  ) => {
    const queryInstance = useMemo(() => {
      if (query instanceof A.Query) {
        return query
      }

      return world.query<T>(query)
    }, [])

    return useContainer(queryInstance)
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

  type EntitiesInQueryProps<T extends E, QueryResult> = {
    queryDescription: A.QueryDescription<T, QueryResult>
    children: Children | ((entity: QueryResult) => Children)
  }

  const EntitiesInQuery = <T extends E>({
    queryDescription,
    children,
  }: EntitiesInQueryProps<E, T>) => {
    const queryInstance = useQuery(queryDescription)

    return (
      <EntitiesInList
        entities={[...queryInstance.entities]}
        children={children}
      />
    )
  }

  function Entities<T extends E>(props: {
    in: T[] | A.EntityContainer<T> | A.Query<T>
    children: Children | ((entity: T) => Children)
  }): ReactElement

  function Entities<T extends E, QueryType>(props: {
    where: A.QueryDescription<T, QueryType>
    children: Children | ((entity: QueryType) => Children)
  }): ReactElement

  function Entities(props: any) {
    if (props.in) {
      if ('entities' in props.in) {
        return (
          <EntitiesInContainer container={props.in} children={props.children} />
        )
      } else {
        return <EntitiesInList entities={props.in} children={props.children} />
      }
    } else if (props.where) {
      return (
        <EntitiesInQuery
          queryDescription={props.where}
          children={props.children}
        />
      )
    }

    return null
  }

  const Component = <C extends keyof E>({
    name,
    value,
    children,
  }: ComponentProps<E, C>) => {
    const [childRef, setChildRef] = useState<never>(null!)

    const entity = useContext(entityContext)

    useIsomorphicLayoutEffect(() => {
      if (!entity) {
        return
      }

      let componentData: E[C]
      if (children !== undefined) {
        // if children are passed in, use them as the component's args
        componentData = childRef as never
      } else {
        // otherwise, use the args prop
        componentData = value!
      }

      world.add(entity, name, componentData!)

      return () => {
        if (entity[name]) {
          world.remove(entity, name)
        }
      }
    }, [entity, childRef, name, value])

    // capture ref of child
    if (children) {
      const child = React.Children.only(children) as ReactElement

      return React.cloneElement(child, {
        ref: setChildRef,
      })
    }

    return null
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
