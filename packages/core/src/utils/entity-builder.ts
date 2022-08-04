import { ComponentClass, Component } from '../component';
import { Entity } from '../entity';
import { Space } from '../space';
import { SpaceManager } from '../space-manager';

export type EntityBuilder = {
  addComponent: <T extends Component>(
    clazz: ComponentClass<T>,
    ...args: Parameters<T['construct']>
  ) => EntityBuilder;
  build: () => Entity;
};

export const EntityBuilderFactory =
  (space: Space, spaceManager: SpaceManager): (() => EntityBuilder) =>
  () => {
    const components: { clazz: ComponentClass; args: unknown[] }[] = [];

    const builder = {
      addComponent: <T extends Component>(
        clazz: ComponentClass<T>,
        ...args: Parameters<T['construct']>
      ) => {
        components.push({ clazz, args });
        return builder;
      },
      build: (): Entity => {
        return spaceManager.createEntity(space, components);
      },
    };

    return builder;
  };
