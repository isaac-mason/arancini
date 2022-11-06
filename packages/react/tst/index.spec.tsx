import * as R from '@recs/core';
import '@testing-library/jest-dom';
import { render, renderHook } from '@testing-library/react';
import React from 'react';
import { createECS } from '../src';

class ExampleComponent extends R.Component {}

class ExampleComponentWithArgs extends R.Component {
  exampleProperty!: string;

  construct(exampleArg: string) {
    this.exampleProperty = exampleArg;
  }
}

class ExampleSystem extends R.System {}

describe('createECS', () => {
  it('should create an ECS instance', () => {
    const ECS = createECS();

    expect(ECS).toBeTruthy();
    expect(ECS.world).toBeTruthy();
  });

  it('should create an ECS instance with an existing world', () => {
    const world = new R.World();
    const ECS = createECS(world);

    expect(ECS).toBeTruthy();
    expect(ECS.world).toBe(world);
  });
});

describe('<Entity>', () => {
  it('should create an entity', () => {
    const ECS = createECS();

    render(<ECS.Entity />);

    expect(ECS.world.defaultSpace.entities.size).toBe(1);
  });

  it('should support taking an existing entity via props', () => {
    const ECS = createECS();
    const entity = ECS.world.create.entity();

    render(<ECS.Entity entity={entity} />);

    expect(ECS.world.defaultSpace.entities.size).toBe(1);
    expect(ECS.world.defaultSpace.entities.has(entity.id)).toBe(true);
  });
});

describe('<Entities>', () => {
  it('should add components to entities', () => {
    const ECS = createECS();
    const entities = [
      ECS.world.create.entity(),
      ECS.world.create.entity(),
      ECS.world.create.entity(),
    ];

    render(
      <ECS.Entities entities={entities}>
        <ECS.Component type={ExampleComponent} />
      </ECS.Entities>
    );

    expect(entities.every((entity) => entity.has(ExampleComponent))).toBe(true);
  });
});

describe('<QueryEntities>', () => {
  it('should render entities that match the query', () => {
    const ECS = createECS();
    const entities = [
      ECS.world.create.entity(),
      ECS.world.create.entity(),
      ECS.world.create.entity(),
    ];

    entities.forEach((e) => {
      e.add(ExampleComponent);
    });

    render(
      <ECS.QueryEntities query={[ExampleComponent]}>
        <ECS.Component type={ExampleComponentWithArgs} args={['example']} />
      </ECS.QueryEntities>
    );

    expect(
      entities.every((entity) => entity.has(ExampleComponentWithArgs))
    ).toBe(true);
  });
});

describe('<Space>', () => {
  it('should support creation of entities within the space', () => {
    const ECS = createECS();

    const testSpaceName = 'testSpaceName';
    render(
      <ECS.Space id={testSpaceName}>
        <ECS.Entity />
      </ECS.Space>
    );

    expect(ECS.world.defaultSpace.entities.size).toBe(0);
    expect(ECS.world.spaceManager.spaces.size).toBe(2);
    expect(ECS.world.getSpace('testSpaceName')!.entities.size).toBe(1);
  });
});

describe('<Component>', () => {
  it('should add the given component to an entity', () => {
    const ECS = createECS();
    const entity = ECS.world.create.entity();

    render(
      <ECS.Entity entity={entity}>
        <ECS.Component type={ExampleComponent} />
      </ECS.Entity>
    );

    expect(entity.get(ExampleComponent)).toBeInstanceOf(ExampleComponent);
  });

  it('should call construct with the args prop', () => {
    const ECS = createECS();
    const entity = ECS.world.create.entity();

    render(
      <ECS.Entity entity={entity}>
        <ECS.Component type={ExampleComponentWithArgs} args={['test']} />
      </ECS.Entity>
    );

    expect(entity.get(ExampleComponentWithArgs).exampleProperty).toBe('test');
  });
});

describe('<System>', () => {
  it('should add the given system to the world', () => {
    const ECS = createECS();

    render(<ECS.System type={ExampleSystem} />);

    expect(ECS.world.systemManager.systems.size).toBe(1);
    expect(ECS.world.systemManager.systems.has(ExampleSystem)).toBe(true);
  });
});

describe('useQuery', () => {
  it('should return entities that match the query', () => {
    const ECS = createECS();

    const entities = [
      ECS.world.create.entity(),
      ECS.world.create.entity(),
      ECS.world.create.entity(),
    ];

    entities.forEach((e) => {
      e.add(ExampleComponent);
    });

    const { result } = renderHook(() => ECS.useQuery([ExampleComponent]));

    expect(result.current.entities).toEqual(entities);
  });
});

describe('useCurrentEntity', () => {
  it('should return the current entity', () => {
    const ECS = createECS();
    const entity = ECS.world.create.entity();

    const { result } = renderHook(() => ECS.useCurrentEntity(), {
      wrapper: ({ children }) => (
        <ECS.Entity entity={entity}>{children}</ECS.Entity>
      ),
    });

    expect(result.current.entity).toBe(entity);
  });
});

describe('useCurrentEntity', () => {
  it('should return the default space when not wrapped in a space', () => {
    const ECS = createECS();

    const { result } = renderHook(() => ECS.useCurrentSpace());

    expect(result.current).toBe(ECS.world.defaultSpace);
  });

  it('should return the default space when not wrapped in a space', () => {
    const ECS = createECS();

    const testSpaceId = 'testSpaceId';
    const { result } = renderHook(() => ECS.useCurrentSpace(), {
      wrapper: ({ children }) => (
        <ECS.Space id={testSpaceId}>{children}</ECS.Space>
      ),
    });

    expect(result.current).toBe(ECS.world.getSpace(testSpaceId));
  });
});

describe('step', () => {
  it('should step the world', () => {
    const ECS = createECS();

    const onUpdate = jest.fn();
    ECS.world.systemManager.registerSystem(
      class extends R.System {
        onUpdate(delta: number, time: number) {
          onUpdate(delta, time);
        }
      }
    );

    const delta = 0.01;

    ECS.step(delta);
    expect(onUpdate).toBeCalledWith(delta, delta);

    ECS.step(delta);
    expect(onUpdate).toBeCalledWith(delta, delta * 2);
  });
});
