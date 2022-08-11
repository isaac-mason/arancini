/* eslint-disable max-classes-per-file */
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
  system: R.SystemClass<T>;
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

export const createWorld = () => {
  const queryRerenderHooks: Map<() => void, R.Query> = new Map();

  class QueryRerenderSystem extends R.System {
    onUpdate() {
      queryRerenderHooks.forEach((query, rerender) => {
        if (query.added.length > 0 || query.removed.length > 0) {
          rerender();
        }
        query.clearEvents();
      });
    }
  }

  const WorldContext = createContext(null! as WorldProviderContext);
  const SpaceContext = createContext(null! as SpaceProviderContext);
  const EntityContext = createContext(null! as EntityProviderContext);

  const world = new R.World();
  world.registerSystem(QueryRerenderSystem, { priority: -Infinity });
  world.init();

  const step = (delta: number) => {
    world.update(delta);
  };

  const World = ({ children }: WorldProps) => {
    return (
      <WorldContext.Provider value={{ world }}>
        <SpaceContext.Provider value={{ space: world.defaultSpace }}>
          {children}
        </SpaceContext.Provider>
      </WorldContext.Provider>
    );
  };

  const SystemImpl = <T extends R.System>(
    { system, priority }: SystemProps<T>,
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
          <SpaceContext.Provider value={{ space }}>
            {children}
          </SpaceContext.Provider>
        )
      );
    }
  );

  const Entity = React.forwardRef<R.Entity, EntityProps>(
    ({ children }, ref) => {
      const { space } = useContext(SpaceContext);
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
          <EntityContext.Provider value={{ entity }}>
            {children}
          </EntityContext.Provider>
        )
      );
    }
  );

  const ComponentImpl = <T extends R.Component>(
    { args, children, type }: ComponentProps<T>,
    ref: ForwardedRef<T>
  ) => {
    const { entity } = useContext(EntityContext);
    const [component, setComponent] = useState<T>();

    useImperativeHandle(ref, () => component as T);

    useEffect(() => {
      let comp: R.Component;

      if (children) {
        const childrenArray = (
          !Array.isArray(children) ? [children] : children
        ) as Parameters<T['construct']>;
        comp = entity.addComponent(type, ...childrenArray);
      } else {
        comp = entity.addComponent(type, ...(args ?? ([] as never)));
      }

      setComponent(comp as T);

      return () => {
        if (entity.alive && entity.has(comp.__recs.class)) {
          entity.removeComponent(comp);
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
      queryRerenderHooks.set(rerender, query);

      return () => {
        queryRerenderHooks.delete(rerender);
        query.destroy();
      };
    }, []);

    return query;
  };

  const useWorld = () => {
    const { world: worldInstance } = useContext(WorldContext);
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
  };
};
