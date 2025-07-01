import { Topic } from './topic';
import type { AnyEntity } from './world';

export class EntityCollection<Entity> {
  entities: Entity[] = [];

  version = 0;

  onEntityAdded = new Topic<[entity: Entity]>();

  onEntityRemoved = new Topic<[entity: Entity]>();

  /** @ignore */
  _entityPositions = new Map<Entity, number>();

  get first(): Entity | undefined {
    return this.entities[0];
  }

  get size() {
    return this.entities.length;
  }

  [Symbol.iterator]() {
    let index = this.entities.length;

    const result: {
      value: Entity;
      done: boolean;
    } = {
      value: undefined!,
      done: false,
    };

    return {
      next: () => {
        result.value = this.entities[--index];
        result.done = index < 0;
        return result;
      },
    };
  }

  has(entity: Entity): boolean {
    return this._entityPositions.has(entity);
  }
}

export const addToCollection = <E extends AnyEntity>(
  collection: EntityCollection<E>,
  entity: E,
): void => {
  // assumes the entity is not already in the collection

  collection.entities.push(entity);
  collection._entityPositions.set(entity, collection.entities.length - 1);

  collection.version++;

  collection.onEntityAdded.emit(entity);
};

export const removeFromCollection = <E extends AnyEntity>(
  collection: EntityCollection<E>,
  entity: E,
): void => {
  // assumes the entity is in the collection

  const index = collection._entityPositions.get(entity)!;
  collection._entityPositions.delete(entity);

  const other = collection.entities[collection.entities.length - 1];
  if (other !== entity) {
    collection.entities[index] = other;
    collection._entityPositions.set(other, index);
  }
  collection.entities.pop();

  collection.version++;

  collection.onEntityRemoved.emit(entity);
};
