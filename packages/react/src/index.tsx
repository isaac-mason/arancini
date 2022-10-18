import * as R from '@recs/core';
import React, {
  createContext,
  ForwardedRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { useData } from './hooks/use-data';
import { useRerender } from './hooks/use-rerender';

type WorldProviderContext = {
  world: R.World;
};

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
  children?: React.ReactNode;
};

export type ComponentProps<T extends R.Component> = {
  type: R.ComponentClass<T>;
  args?: Parameters<T['construct']>;
  children?: Parameters<T['construct']> extends [unknown]
    ? Parameters<T['construct']>[0]
    : Parameters<T['construct']>;
};

export const createECS = (existing?: R.World) => {
  const worldContext = createContext(null! as WorldProviderContext);
  const spaceContext = createContext(null! as SpaceProviderContext);
  const entityContext = createContext(null! as EntityProviderContext);

  const world = existing ?? new R.World();

  if (!existing) {
    world.init();
  }

  const step = (delta: number) => {
    world.update(delta);
  };

  const World = ({ children }: WorldProps) => {
    return (
      <worldContext.Provider value={{ world }}>
        <spaceContext.Provider value={{ space: world.defaultSpace }}>
          {children}
        </spaceContext.Provider>
      </worldContext.Provider>
    );
  };

  const SystemImpl = <T extends R.System>(
    { type: system, priority }: SystemProps<T>,
    ref: ForwardedRef<T>
  ) => {
    const [sys, setSystem] = useState<T>();

    useImperativeHandle(ref, () => sys as T);

    useEffect(() => {
      world.registerSystem(system, { priority });
      const newSystem = world.getSystem(system);
      setSystem(newSystem);

      return () => {
        world.unregisterSystem(system);
      };
    }, [system, priority]);

    return null;
  };

  const System = React.forwardRef(SystemImpl) as <T extends R.System>(
    props: SystemProps<T>,
    ref: ForwardedRef<T>
  ) => null;

  const Space = React.forwardRef<R.Space, SpaceProps>(
    ({ id, children }, ref) => {
      const [space, setSpace] = useState<R.Space>(null!);

      useImperativeHandle(ref, () => space);

      useEffect(() => {
        const newSpace = world.create.space({ id });
        setSpace(newSpace);

        return () => {
          newSpace.destroy();
        };
      }, []);

      return (
        space && (
          <spaceContext.Provider value={{ space }}>
            {children}
          </spaceContext.Provider>
        )
      );
    }
  );

  const Entity = React.forwardRef<R.Entity, EntityProps>(
    ({ children }, ref) => {
      const { space } = useContext(spaceContext);
      const [entity, setEntity] = useState<R.Entity>(null!);

      useImperativeHandle(ref, () => entity);

      useEffect(() => {
        const newEntity = space.create.entity();
        setEntity(newEntity);

        return () => {
          newEntity.destroy();
          setEntity(null!);
        };
      }, []);

      return (
        entity && (
          <entityContext.Provider value={{ entity }}>
            {children}
          </entityContext.Provider>
        )
      );
    }
  );

  const ComponentImpl = <T extends R.Component>(
    { args, children, type }: ComponentProps<T>,
    ref: ForwardedRef<T>
  ) => {
    const { entity } = useContext(entityContext);
    const [component, setComponent] = useState<T>();

    useImperativeHandle(ref, () => component as T);

    useEffect(() => {
      let comp: R.Component;

      if (children) {
        const childrenArray = (
          !Array.isArray(children) ? [children] : children
        ) as Parameters<T['construct']>;
        comp = entity.add(type, ...childrenArray);
      } else {
        comp = entity.add(type, ...(args ?? ([] as never)));
      }

      setComponent(comp as T);

      return () => {
        if (entity.alive && entity.has(comp.__recs.class)) {
          entity.remove(comp);
          setComponent(null!);
        }
      };
    }, [args, children, type]);

    return null;
  };

  const Component = React.forwardRef(ComponentImpl) as <T extends R.Component>(
    props: ComponentProps<T>,
    ref: ForwardedRef<T>
  ) => null;

  const useQuery = (queryDescription: R.QueryDescription) => {
    const query = useData(
      () => world.create.query(queryDescription),
      [queryDescription]
    );

    const rerender = useRerender();

    useEffect(() => {
      query.onEntityAdded.subscribe(() => {
        rerender();
      });

      query.onEntityRemoved.subscribe(() => {
        rerender();
      });

      return () => {
        query.destroy();
      };
    }, []);

    return query;
  };

  const useWorld = () => {
    const { world: worldInstance } = useContext(worldContext);
    return worldInstance;
  };

  return {
    World,
    Space,
    System,
    Entity,
    Component,
    useQuery,
    useWorld,
    step,
    world,
  };
};
