import { Entity } from './entity'
import { Topic } from './topic'

export class EntityContainer {
  version = 0

  entities: Entity[] = []

  onEntityAdded = new Topic<[Entity]>()

  onEntityRemoved = new Topic<[Entity]>()

  private entityPositions = new Map<Entity, number>()

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
    return this.entityPositions.has(entity)
  }

  /**
   * @ignore internal
   */
  _addEntity(entity: Entity): void {
    if (entity && !this.has(entity)) {
      this.entities.push(entity)
      this.entityPositions.set(entity, this.entities.length - 1)

      this.version++

      this.onEntityAdded.emit(entity)
    }
  }

  /**
   * @ignore internal
   */
  _removeEntity(entity: Entity): void {
    if (!this.has(entity)) {
      return
    }

    const index = this.entityPositions.get(entity)!
    this.entityPositions.delete(entity)

    const other = this.entities[this.entities.length - 1]
    if (other !== entity) {
      this.entities[index] = other
      this.entityPositions.set(other, index)
    }

    this.entities.pop()

    this.version++

    this.onEntityRemoved.emit(entity)
  }
}
