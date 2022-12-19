import * as A from '@arancini/core'
import React, {
  createContext,
  memo,
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { mergeRefs, useIsomorphicLayoutEffect, useRerender } from './hooks'

type SpaceProviderContext = {
  space: A.Space
}

type EntityProviderContext = {
  entity: A.Entity
}

export type WorldProps = {
  children?: React.ReactNode
}

export type SpaceProps = {
  id?: string
  children?: React.ReactNode
}

export type SystemProps<T extends A.System> = {
  type: A.SystemClass<T>
  priority?: number
}

export type EntityProps = {
  name?: string
  entity?: A.Entity
  children?: React.ReactNode
}

export type EntitiesProps = {
  entities: A.Entity[]
  children: ReactNode | ((entity: A.Entity) => ReactNode)
}

export type QueryEntitiesProps = {
  query: A.Query | A.QueryDescription
  children: ReactNode | ((entity: A.Entity) => ReactNode)
}

export type ComponentProps<T extends A.Component> = {
  type: A.ComponentClass<T>
  args?: Parameters<T['construct']>
  children?: ReactNode
}

export const createECS = (existing?: A.World) => {
  const spaceContext = createContext(null! as SpaceProviderContext)
  const entityContext = createContext(null! as EntityProviderContext)

  const world = existing ?? new A.World()

  if (!world.initialised) {
    world.init()
  }

  const update = (delta: number) => {
    world.update(delta)
  }

  const useCurrentEntity = () => useContext(entityContext)

  const useCurrentSpace = () => {
    const context = useContext(spaceContext)
    return !context ? world.defaultSpace : context.space
  }

  const Space = ({ id, children }: SpaceProps) => {
    const [context, setContext] = useState<SpaceProviderContext>(null!)

    useIsomorphicLayoutEffect(() => {
      const newSpace = world.create.space({ id })
      setContext({ space: newSpace })

      return () => {
        setContext(null!)
        newSpace.destroy()
      }
    }, [id])

    return (
      <spaceContext.Provider value={context}>{children}</spaceContext.Provider>
    )
  }

  const EntityImpl = ({ children, entity: existingEntity }: EntityProps) => {
    const space = useCurrentSpace()
    const [context, setContext] = useState<{ entity: A.Entity }>(null!)

    useIsomorphicLayoutEffect(() => {
      if (!space) {
        return
      }

      if (existingEntity) {
        setContext({ entity: existingEntity })
        return
      }

      const newEntity = space.create.entity()
      setContext({ entity: newEntity })

      const { id } = newEntity

      return () => {
        setContext(null!)

        // if the entity hasn't already been recycled
        if (id === newEntity.id) {
          newEntity.destroy()
        }
      }
    }, [space])

    return (
      <entityContext.Provider value={context}>
        {children}
      </entityContext.Provider>
    )
  }

  const Entity = memo(EntityImpl) as typeof EntityImpl

  const Entities = ({ entities, children }: EntitiesProps) => (
    <>
      {entities.map((entity) => (
        <Entity key={entity.id} entity={entity}>
          {typeof children === 'function' ? children(entity) : children}
        </Entity>
      ))}
    </>
  )

  const useQuery = (q: A.Query | A.QueryDescription) => {
    const query = useMemo(() => {
      if (q instanceof A.Query) {
        return q
      }

      return world.create.query(q)
    }, [q])

    const rerender = useRerender()

    useIsomorphicLayoutEffect(() => {
      query.onEntityAdded.add(rerender)
      query.onEntityRemoved.add(rerender)

      return () => {
        query.onEntityAdded.remove(rerender)
        query.onEntityRemoved.remove(rerender)
      }
    }, [rerender])

    useIsomorphicLayoutEffect(rerender, [])

    return query
  }

  const QueryEntities = ({ query, children }: QueryEntitiesProps) => {
    const { entities } = useQuery(query)

    return <Entities entities={entities} children={children} />
  }

  const Component = <T extends A.Component>({
    args,
    children,
    type,
  }: ComponentProps<T>) => {
    const ref = useRef<Parameters<T['construct']>>(null)

    const entityCtx = useContext(entityContext)

    useIsomorphicLayoutEffect(() => {
      if (!entityCtx || !entityCtx.entity.space) {
        return
      }

      const { entity } = entityCtx

      let newComponent: A.Component

      if (children) {
        // if a child is passed in, use them as the component's args
        newComponent = entity.add(type, ...([ref.current] as never))
      } else {
        // otherwise, use the args prop
        newComponent = entity.add(type, ...(args ?? ([] as never)))
      }

      return () => {
        // check if the entity has the component before removing it
        if (entity.find(newComponent._class) === newComponent) {
          entity.remove(newComponent)
        }
      }
    }, [entityCtx, args, children, type])

    // capture ref of child
    if (children) {
      const child = React.Children.only(children) as React.ReactElement

      return React.cloneElement(child, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref: mergeRefs([(child as any).ref, ref]),
      })
    }

    return null
  }

  const System = <T extends A.System>({ type, priority }: SystemProps<T>) => {
    useIsomorphicLayoutEffect(() => {
      world.registerSystem(type, { priority })

      return () => {
        world.unregisterSystem(type)
      }
    }, [type, priority])

    return null
  }

  return {
    Space,
    Entity,
    Entities,
    QueryEntities,
    Component,
    System,
    useQuery,
    useCurrentEntity,
    useCurrentSpace,
    update,
    world,
    spaceContext,
    entityContext,
  }
}
