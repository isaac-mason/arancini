/* eslint-disable max-classes-per-file */
import * as R from '@recs/core';
import React, {
  createContext,
  ForwardedRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
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

export type SystemProps = {
  system: R.SystemClass;
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

  const worldContext = createContext({} as WorldProviderContext);
  const spaceContext = createContext({} as SpaceProviderContext);
  const entityContext = createContext({} as EntityProviderContext);

  const world = new R.World();
  world.registerSystem(QueryRerenderSystem, { priority: -Infinity });
  world.init();

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

  const Space = ({ id, children }: SpaceProps) => {
    const space = useData((): R.Space => {
      return world.create.space({ id });
    });

    useEffect(() => {
      return () => {
        space.destroy();
      };
    }, []);

    return (
      <spaceContext.Provider value={{ space }}>
        {children}
      </spaceContext.Provider>
    );
  };

  const System = ({ system, priority }: SystemProps) => {
    useEffect(() => {
      world.registerSystem(system, { priority });

      return () => {
        world.unregisterSystem(system);
      };
    }, [system, priority]);

    return null;
  };

  const Entity = React.forwardRef<R.Entity, EntityProps>(
    ({ children }, ref) => {
      const { space } = useContext(spaceContext);

      const entity = useData<R.Entity>(() => space.create.entity());

      useImperativeHandle(ref, () => entity);

      useEffect(() => {
        return () => {
          entity.destroy();
        };
      }, []);

      return (
        <entityContext.Provider value={{ entity }}>
          {children}
        </entityContext.Provider>
      );
    }
  );

  const ComponentImpl = <T extends R.Component>(
    { args = [] as never, children, type }: ComponentProps<T>,
    ref: ForwardedRef<T>
  ) => {
    const { entity } = useContext(entityContext);
    const component = useRef<T>();

    useImperativeHandle(ref, () => component.current as T);

    useEffect(() => {
      let comp: R.Component;

      if (children) {
        const childrenArray = (
          !Array.isArray(children) ? [children] : children
        ) as Parameters<T['construct']>;
        comp = entity.addComponent(type, ...childrenArray);
      } else {
        comp = entity.addComponent(type, ...args);
      }

      component.current = comp as T;

      return () => {
        if (comp && entity.has(comp.__recs.class)) {
          entity.removeComponent(comp);
        }
      };
    }, [args, entity]);

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
  };
};
