import * as A from '@arancini/core';
import React, {
  createContext,
  type ForwardedRef,
  forwardRef,
  type JSX,
  memo,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIsomorphicLayoutEffect, useRerender } from './hooks';

type Children = ReactNode | JSX.Element;

type EntityProviderContext<Entity extends A.AnyEntity> = Entity;

export type EntityProps<Entity extends A.AnyEntity> = {
  entity?: Entity;
  children?: Children;
  ref?: ForwardedRef<Entity>;
} & (
  | {
      [C in keyof Entity]?: Entity[C];
    }
  | object
);

export type ComponentProps<E, C extends keyof E> = {
  name: C;
  value?: E[C];
  children?: Children;
};

export type ReactAPI<E extends A.AnyEntity> = ReturnType<
  typeof createReactAPI<E>
>;

export const createReactAPI = <E extends A.AnyEntity>(world: A.World<E>) => {
  const entityContext = createContext(null! as EntityProviderContext<E>);

  let entityIdCounter = 0;
  const entityToId = new WeakMap<E, number>();

  const entityId = (entity: E) => {
    let id = entityToId.get(entity);

    if (id === undefined) {
      id = entityIdCounter++;
      entityToId.set(entity, id);
    }

    return id;
  };

  const useCurrentEntity = (): E | undefined => {
    const entity = useContext(entityContext);

    if (!entity) {
      throw new Error(
        'useCurrentEntity must be used within an <Entity /> component',
      );
    }

    return entity;
  };

  const RawEntity = <T extends E>(
    { children, entity: existingEntity, ...propComponents }: EntityProps<T>,
    ref: ForwardedRef<E>,
  ) => {
    const newEntity = useRef({});
    const entity = existingEntity || (newEntity.current as T);

    useEffect(() => {
      if (world.has(entity)) return;

      world.create(entity);

      return () => {
        world.destroy(entity);
      };
    }, []);

    useImperativeHandle(ref, () => entity!, [entity]);

    return (
      <entityContext.Provider value={entity}>
        {children}

        {Object.entries(propComponents).map(([name, value]) => {
          return <Component key={name} name={name as keyof E} value={value} />;
        })}
      </entityContext.Provider>
    );
  };

  const Entity = memo(forwardRef(RawEntity)) as <T extends E>(
    props: EntityProps<T>,
  ) => ReactElement;

  const Component = <C extends keyof E>({
    name,
    value,
    children,
  }: ComponentProps<E, C>) => {
    const [childRef, setChildRef] = useState<E[C]>();

    const entity = useContext(entityContext);

    if (!entity) {
      throw new Error(
        '<Component /> must within an <Entity /> or <Entities /> component',
      );
    }

    useIsomorphicLayoutEffect(() => {
      let componentValue: E[C];

      if (children !== undefined) {
        componentValue = childRef as never;
      } else if (value !== undefined) {
        componentValue = value;
      } else {
        // default to true if no value is provided
        componentValue = true as never;
      }

      world.add(entity, name, componentValue!);

      return () => {
        world.remove(entity, name);
      };
    }, [entity, name, value, childRef]);

    const refCatpureProps = useMemo(() => {
      return {
        ref: setChildRef,
      };
    }, []);

    // capture ref of child
    if (children) {
      const child = React.Children.only(children) as ReactElement;

      return React.cloneElement(child, refCatpureProps);
    }

    return null;
  };

  const useContainer = <T extends E>(container: A.EntityContainer<T>) => {
    const rerender = useRerender();

    const originalVersion = useMemo(() => container.version, [container]);

    useIsomorphicLayoutEffect(() => {
      if (container.version !== originalVersion) rerender();
    }, [container]);

    useIsomorphicLayoutEffect(
      () => container.onEntityAdded.add(rerender),
      [container, rerender],
    );

    useIsomorphicLayoutEffect(
      () => container.onEntityRemoved.add(rerender),
      [container, rerender],
    );

    return container;
  };

  const useQuery = <T extends E>(query: A.Query<T>) => {
    return useContainer(query);
  };

  type EntitiesInListProps<T extends E> = {
    entities: T[];
    children: Children | ((entity: T) => Children);
  };

  const EntitiesInList = <T extends E>({
    entities,
    children,
  }: EntitiesInListProps<T>) => {
    return (
      <>
        {entities.map((entity) => (
          <Entity key={entityId(entity)} entity={entity}>
            {typeof children === 'function' ? children(entity) : children}
          </Entity>
        ))}
      </>
    );
  };

  type EntitiesInContainerProps<T extends E> = {
    container: A.EntityContainer<T>;
    children: Children | ((entity: T) => Children);
  };

  const EntitiesInContainer = <T extends E>({
    container: entities,
    children,
  }: EntitiesInContainerProps<T>) => {
    const container = useContainer(entities);

    return (
      <EntitiesInList entities={[...container.entities]} children={children} />
    );
  };

  const Entities = <T extends E>(props: {
    in: T[] | A.EntityContainer<T>;
    children: Children | ((entity: T) => Children);
  }): ReactElement => {
    if (props.in instanceof A.EntityContainer) {
      return (
        <EntitiesInContainer container={props.in} children={props.children} />
      );
    }

    return (
      <EntitiesInList entities={props.in as T[]} children={props.children} />
    );
  };

  return {
    Entity,
    Entities,
    Component,
    useCurrentEntity,
    useQuery,
    world,
  };
};
