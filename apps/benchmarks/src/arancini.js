import { World, System } from '@arancini/core'

let updateCount = 0

class MovementSystem extends System {
  movement = this.query((e) => e.has('position', 'velocity'))

  onUpdate() {
    for (let i = 0; i < this.movement.entities.length; i++) {
      const e = this.movement.entities[i]

      const { position, velocity } = e

      position.x += velocity.dx
      position.y += velocity.dy

      updateCount++
    }
  }
}

export const arancini = {
  setup() {
    this.world = new World({ components: ['position', 'velocity'] })

    this.world.registerSystem(MovementSystem)

    this.world.init()
    updateCount = 0
  },
  createEntity() {
    const entity = {}
    this.world.create(entity)
    return entity
  },
  addPositionComponent(entity) {
    this.world.add(entity, 'position', { x: 0, y: 0 })
  },
  addVelocityComponent(entity) {
    this.world.add(entity, 'velocity', {
      dx: Math.random() - 0.5,
      dy: Math.random() - 0.5,
    })
  },
  removePositionComponent(entity) {
    this.world.remove(entity, 'position')
  },
  removeVelocityComponent(entity) {
    entity.remove(entity, 'velocity')
  },
  destroyEntity(entity) {
    this.world.destroy(entity)
  },
  cleanup() {
    this.world.reset()
  },
  updateMovementSystem() {
    this.world.step()
  },
  getMovementSystemUpdateCount() {
    return updateCount
  },
}
