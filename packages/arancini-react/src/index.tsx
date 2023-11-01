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

type EntityProviderContext<Entity extends A.AnyEntity> = Entity | undefined

export type WorldProps = {
  children?: React.ReactNode
}

export type EntityProps<Entity extends A.AnyEntity> = {
  entity?: Entity
  children?: React.ReactNode
} & (
  | {
      [C in keyof Entity]?: Entity[C]
    }
  | {}
)

export type EntitiesProps<Entity extends A.AnyEntity> = {
  entities: Entity[]
  children: ReactNode | ((entity: Entity) => ReactNode)
}

export type QueryEntitiesProps<E extends A.AnyEntity, QueryResult> = {
  query: A.QueryDescription<E, QueryResult>
  children: ReactNode | ((entity: QueryResult) => ReactNode)
}

export type ComponentProps<E, C extends keyof E> = {
  name: C
  data?: E[C]
  children?: ReactNode
}

export type ECS<E extends A.AnyEntity> = ReturnType<typeof createECS<E>>

export const createECS = <E extends A.AnyEntity>(world: A.World<E>) => {
  const entityContext = createContext(null! as EntityProviderContext<E>)

  const step = (delta: number) => {
    world.step(delta)
  }

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
    ref: React.ForwardedRef<E>
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

  const Entity = memo(forwardRef(RawEntity)) as <D extends E>(
    props: PropsWithRef<EntityProps<D> & { ref?: ForwardedRef<D> }>
  ) => ReactElement

  const Entities = <T extends E>({ entities, children }: EntitiesProps<T>) => (
    <>
      {entities.map((entity) => (
        <Entity key={world.id(entity)} entity={entity}>
          {typeof children === 'function' ? children(entity) : children}
        </Entity>
      ))}
    </>
  )

  const useQuery = <R extends E>(q: A.QueryDescription<E, R>) => {
    const queryDescription = useMemo(() => q, [])

    const query = useMemo(() => {
      if (q instanceof A.Query) {
        return q
      }

      return world.query<R>(queryDescription)
    }, [queryDescription])

    const [, setVersion] = useState(-1)

    const rerender = () => {
      setVersion((v) => v + 1)
    }

    useIsomorphicLayoutEffect(() => {
      query.onEntityAdded.add(rerender)
      query.onEntityRemoved.add(rerender)

      return () => {
        query.onEntityAdded.remove(rerender)
        query.onEntityRemoved.remove(rerender)
      }
    }, [])

    useIsomorphicLayoutEffect(rerender, [])

    return query as A.Query<R>
  }

  const QueryEntities = <QueryResult extends E>({
    query: q,
    children,
  }: QueryEntitiesProps<E, QueryResult>) => {
    const query = useQuery(q)

    return <Entities entities={[...query.entities]} children={children} />
  }

  const Component = <C extends keyof E>({
    name,
    data,
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
        componentData = data!
      }

      world.add(entity, name, componentData!)

      return () => {
        if (entity[name]) {
          world.remove(entity, name)
        }
      }
    }, [entity, childRef, name, data])

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
    QueryEntities,
    Component,
    useQuery,
    useCurrentEntity,
    step,
    world,
    entityContext,
  }
}
