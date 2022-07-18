import {
  Component as RComponent,
  ComponentClass,
  Entity as REntity,
  Query,
  QueryDescription,
  Space as RSpace,
  System as RSystem,
  World as RWorld,
} from '@recs/core';
import React, {
  createContext,
  ForwardedRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useData } from './hooks/use-data';

type WorldProviderContext = {
  world: RWorld;
};

type SpaceProviderContext = {
  space: RSpace;
};

type EntityProviderContext = {
  entity: REntity;
};

export type WorldProps = {
  children?: React.ReactNode;
  /**
   * @default -50
   */
  renderPriority?: number;
};

export type SpaceProps = {
  children?: React.ReactNode;
};

export type SystemProps = {
  system: RSystem;
};

export type EntityProps = {
  name?: string;
  children?: React.ReactNode;
};

export type ComponentProps<T extends RComponent> = {
  type: ComponentClass<T>;
  args?: Parameters<T['construct']>;
  children?: Parameters<T['construct']> extends [unknown]
    ? Parameters<T['construct']>[0]
    : Parameters<T['construct']>;
};

export const createWorld = () => {
  const worldContext = createContext({} as WorldProviderContext);
  const spaceContext = createContext({} as SpaceProviderContext);
  const entityContext = createContext({} as EntityProviderContext);

  const world = new RWorld();
  world.init();

  const queryHooks: Map<() => void, Query> = new Map();

  function useRerender(): () => void {
    const [_, setVersion] = useState(0);
    return useCallback(() => {
      setVersion((v) => v + 1);
    }, []);
  }

  const step = (delta: number) => {
    world.update(delta);

    queryHooks.forEach((query, rerender) => {
      if (query.added.length > 0 || query.removed.length > 0) {
        rerender();
      }
    });
  };

  const World = ({ children }: WorldProps) => {
    return (
      <worldContext.Provider value={{ world }}>
        {children}
      </worldContext.Provider>
    );
  };

  const Space = ({ children }: SpaceProps) => {
    const space = useData((): RSpace => {
      return world.create.space();
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

  const System = ({ system }: SystemProps) => {
    useEffect(() => {
      world.addSystem(system);

      return () => {
        world.remove(system);
      };
    }, [system]);

    return null;
  };

  const Entity = React.forwardRef<REntity, EntityProps>(({ children }, ref) => {
    const { space } = useContext(spaceContext);

    const entity = useData<REntity>(() => space.create.entity());

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
  });

  const ComponentImpl = <T extends RComponent>(
    { args = [] as never, children, type }: ComponentProps<T>,
    ref: ForwardedRef<T>
  ) => {
    const { entity } = useContext(entityContext);
    const component = useRef<T>();

    useImperativeHandle(ref, () => component.current as T);

    useEffect(() => {
      let comp: RComponent;

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
        if (comp && entity.has(comp.class)) {
          entity.removeComponent(comp);
        }
      };
    }, [args, entity]);

    return null;
  };

  const Component = React.forwardRef(ComponentImpl) as <T extends RComponent>(
    props: ComponentProps<T>,
    ref: ForwardedRef<T>
  ) => null;

  const useQuery = (
    queryDescription: QueryDescription,
    shouldRerender = true
  ) => {
    const query = useData(
      () => world.query(queryDescription),
      [queryDescription]
    );

    const rerender = useRerender();

    useEffect(() => {
      if (shouldRerender) {
        queryHooks.set(rerender, query);
      }

      return () => {
        if (shouldRerender) {
          queryHooks.delete(rerender);
        }
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
