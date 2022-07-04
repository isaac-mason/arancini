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
import { useFrame } from '@react-three/fiber';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
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
  children?: JSX.Element;
  /**
   * @default -50
   */
  renderPriority?: number;
};

export type SpaceProps = {
  children?: JSX.Element | JSX.Element[];
};

export type SystemProps = {
  system: RSystem;
};

export type EntityProps = {
  name?: string;
  children?: JSX.Element | JSX.Element[];
};

export type ComponentProps<T extends RComponent> = {
  type: ComponentClass<T>;
  args?: Parameters<T['construct']>;
  children?: Parameters<T['construct']> | Parameters<T['construct']>[0];
};

export const createRECS = () => {
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

  const World = ({ children, renderPriority = -50 }: WorldProps) => {
    useFrame((_, delta) => {
      world.update(delta);

      queryHooks.forEach((query, rerender) => {
        if (query.added.length > 0 || query.removed.length > 0) {
          rerender();
        }
      });
    }, renderPriority);

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

  const Component = <T extends RComponent>({
    args = [] as never,
    children,
    type,
  }: ComponentProps<T>) => {
    const { entity } = useContext(entityContext);

    useEffect(() => {
      let component: RComponent;

      if (children) {
        const c = (
          !Array.isArray(children) ? [children] : children
        ) as Parameters<T['construct']>;
        component = entity.addComponent(type, ...c);
      } else {
        component = entity.addComponent(type, ...args);
      }

      return () => {
        if (component && entity.has(component.class)) {
          entity.removeComponent(component);
        }
      };
    }, [args, entity]);

    return null;
  };

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

  return {
    World,
    Space,
    System,
    Entity,
    Component,
    useQuery,
  };
};
