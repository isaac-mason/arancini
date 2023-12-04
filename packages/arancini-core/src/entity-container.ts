import { Topic } from '@arancini/events'
import type { AnyEntity } from './world'

export class EntityContainer<Entity> {
  entities: Entity[] = []

  version = 0

  onEntityAdded = new Topic<[Entity]>()

  onEntityRemoved = new Topic<[Entity]>()

  /** @ignore */
  _entityPositions = new Map<Entity, number>()

  /** @ignore */
  _entitySet = new Set<Entity>()

  get first(): Entity | undefined {
    return this.entities[0] || undefined
  }

  [Symbol.iterator]() {
    let index = this.entities.length

    const result: {
      value: Entity
      done: boolean
    } = {
      value: undefined!,
      done: false,
    }

    return {
      next: () => {
        result.value = this.entities[--index]
        result.done = index < 0
        return result
      },
    }
  }

  has(entity: Entity): boolean {
    return this._entitySet.has(entity)
  }
}

export const addEntityToContainer = <E extends AnyEntity>(
  container: EntityContainer<E>,
  entity: E
): void => {
  if (entity && !container.has(entity)) {
    container.entities.push(entity)
    container._entityPositions.set(entity, container.entities.length - 1)
    container._entitySet.add(entity)

    container.version++

    container.onEntityAdded.emit(entity)
  }
}

export const removeEntityFromContainer = <E extends AnyEntity>(
  container: EntityContainer<E>,
  entity: E
): void => {
  if (!container.has(entity)) {
    return
  }

  const index = container._entityPositions.get(entity)!
  container._entityPositions.delete(entity)
  container._entitySet.delete(entity)

  const other = container.entities[container.entities.length - 1]
  if (other !== entity) {
    container.entities[index] = other
    container._entityPositions.set(other, index)
  }

  container.entities.pop()

  container.version++

  container.onEntityRemoved.emit(entity)
}
