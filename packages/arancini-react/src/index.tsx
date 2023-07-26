import * as A from '@arancini/core'
import React, {
  createContext,
  forwardRef,
  memo,
  ReactElement,
  ReactNode,
  useContext,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { useIsomorphicLayoutEffect, useRerender } from './hooks'

type EntityProviderContext = {
  entity: A.Entity
}

export type WorldProps = {
  children?: React.ReactNode
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

export const createECS = (world: A.World) => {
  const entityContext = createContext(null! as EntityProviderContext)

  if (!world.initialised) {
    world.init()
  }

  const update = (delta: number) => {
    world.update(delta)
  }

  const useCurrentEntity = (): A.Entity | undefined => {
    const context = useContext(entityContext)
    return context ? context.entity : undefined
  }

  const Entity = memo(
    forwardRef<A.Entity, EntityProps>(
      ({ children, entity: existingEntity }, ref) => {
        const [context, setContext] = useState<{ entity: A.Entity }>(null!)

        useImperativeHandle(ref, () => context?.entity, [context])

        useIsomorphicLayoutEffect(() => {
          if (existingEntity) {
            setContext({ entity: existingEntity })
            return
          }

          const newEntity = world.create()
          setContext({ entity: newEntity })

          const { id } = newEntity

          return () => {
            setContext(null!)

            // if the entity hasn't already been recycled
            if (id === newEntity.id) {
              newEntity.destroy()
            }
          }
        }, [])

        return (
          <entityContext.Provider value={context}>
            {children}
          </entityContext.Provider>
        )
      }
    )
  )

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

      return world.query(q)
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
    args: argsProp,
    children,
    type,
  }: ComponentProps<T>) => {
    const [childRef, setChildRef] = useState<never>(null!)

    const entityCtx = useContext(entityContext)

    useIsomorphicLayoutEffect(() => {
      if (!entityCtx || !entityCtx.entity) {
        return
      }

      if (children && !childRef) {
        return
      }

      const { entity } = entityCtx

      let args: Parameters<T['construct']>
      if (children) {
        // if children are passed in, use them as the component's args
        args = [childRef] as never
      } else {
        // otherwise, use the args prop
        args = argsProp ?? ([] as never)
      }

      const newComponent = entity.add(type, ...args)

      return () => {
        // check if the entity has the component before removing it
        if (entity.find(newComponent._class) === newComponent) {
          entity.remove(newComponent)
        }
      }
    }, [entityCtx, childRef, type, ...(argsProp ?? [])])

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
    update,
    world,
    entityContext,
  }
}
