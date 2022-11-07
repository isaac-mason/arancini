import * as R from '@recs/core';
import React, {
  createContext,
  memo,
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { mergeRefs, useIsomorphicLayoutEffect, useRerender } from './hooks';

type SpaceProviderContext = {
  space: R.Space;
};

type EntityProviderContext = {
  entity: R.Entity;
};

export type WorldProps = {
  children?: React.ReactNode;
};

export type SpaceProps = {
  id?: string;
  children?: React.ReactNode;
};

export type SystemProps<T extends R.System> = {
  type: R.SystemClass<T>;
  priority?: number;
};

export type EntityProps = {
  name?: string;
  entity?: R.Entity;
  children?: React.ReactNode;
};

export type EntitiesProps = {
  entities: R.Entity[];
  children: ReactNode | ((entity: R.Entity) => ReactNode);
};

export type QueryEntitiesProps = {
  query: R.QueryDescription;
  children: ReactNode | ((entity: R.Entity) => ReactNode);
};

export type ComponentProps<T extends R.Component> = {
  type: R.ComponentClass<T>;
  args?: Parameters<T['construct']>;
  children?: ReactNode;
};

export const createECS = (existing?: R.World) => {
  const spaceContext = createContext(null! as SpaceProviderContext);
  const entityContext = createContext(null! as EntityProviderContext);

  const world = existing ?? new R.World();

  if (!existing) {
    world.init();
  }

  const step = (delta: number) => {
    world.update(delta);
  };

  const useCurrentEntity = () => useContext(entityContext);

  const useCurrentSpace = () => {
    const context = useContext(spaceContext);
    return !context ? world.defaultSpace : context.space;
  };

  const Space = ({ id, children }: SpaceProps) => {
    const [space, setSpace] = useState<R.Space>(null!);

    useIsomorphicLayoutEffect(() => {
      const newSpace = world.create.space({ id });
      setSpace(newSpace);

      return () => {
        setSpace(null!);
        newSpace.destroy();
      };
    }, [id]);

    return (
      <spaceContext.Provider value={{ space }}>
        {children}
      </spaceContext.Provider>
    );
  };

  const EntityImpl = ({ children, entity: existingEntity }: EntityProps) => {
    const space = useCurrentSpace();
    const [entity, setEntity] = useState<R.Entity>(null!);

    useIsomorphicLayoutEffect(() => {
      if (existingEntity) {
        setEntity(existingEntity);
        return;
      }

      if (!space) {
        return;
      }

      const newEntity = space.create.entity();
      setEntity(newEntity);

      return () => {
        setEntity(null!);
        if (newEntity.alive) {
          newEntity.destroy();
        }
      };
    }, [space]);

    return (
      <entityContext.Provider value={{ entity }}>
        {children}
      </entityContext.Provider>
    );
  };

  const Entity = memo(EntityImpl) as typeof EntityImpl;

  const Entities = ({ entities, children }: EntitiesProps) => (
    <>
      {entities.map((entity) => (
        <Entity key={entity.id} entity={entity}>
          {typeof children === 'function' ? children(entity) : children}
        </Entity>
      ))}
    </>
  );

  const useQuery = (queryDescription: R.QueryDescription) => {
    const query = useMemo(() => {
      return world.create.query(queryDescription);
    }, [queryDescription]);

    const rerender = useRerender();

    useIsomorphicLayoutEffect(() => {
      query.onEntityAdded.add(rerender);
      query.onEntityRemoved.add(rerender);

      return () => {
        query.onEntityAdded.remove(rerender);
        query.onEntityRemoved.remove(rerender);
      };
    }, [rerender]);

    useIsomorphicLayoutEffect(rerender, []);

    return query;
  };

  const QueryEntities = ({
    query: queryDescription,
    children,
  }: QueryEntitiesProps) => {
    const query = useQuery(queryDescription);

    return <Entities entities={query.entities} children={children} />;
  };

  const Component = <T extends R.Component>({
    args,
    children,
    type,
  }: ComponentProps<T>) => {
    const ref = useRef<Parameters<T['construct']>>(null);

    const { entity } = useContext(entityContext);

    useIsomorphicLayoutEffect(() => {
      if (!entity || !entity.alive) {
        return;
      }

      let newComponent: R.Component;

      if (children) {
        // if a child is passed in, use them as the component's args
        newComponent = entity.add(type, ...([ref.current] as never));
      } else {
        // otherwise, use the args prop
        newComponent = entity.add(type, ...(args ?? ([] as never)));
      }

      return () => {
        // check if the entity has the component before removing it
        if (entity.has(newComponent.__recs.class)) {
          entity.remove(newComponent);
        }
      };
    }, [entity, args, children, type]);

    // capture ref of child
    if (children) {
      const child = React.Children.only(children) as React.ReactElement;

      return React.cloneElement(child, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref: mergeRefs([(child as any).ref, ref]),
      });
    }

    return null;
  };

  const System = <T extends R.System>({ type, priority }: SystemProps<T>) => {
    useIsomorphicLayoutEffect(() => {
      world.registerSystem(type, { priority });

      return () => {
        world.unregisterSystem(type);
      };
    }, [type, priority]);

    return null;
  };

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
    step,
    world,
    spaceContext,
    entityContext,
  };
};
