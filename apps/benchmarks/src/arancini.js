import { World, Component, System } from '@arancini/core'

class Position extends Component {
  construct() {
    this.x = 0
    this.y = 0
  }
}
Position.objectPooled = true

class Velocity extends Component {
  construct() {
    this.dx = Math.random() - 0.5
    this.dy = Math.random() - 0.5
  }
}
Velocity.objectPooled = true

let updateCount = 0

class MovementSystem extends System {
  movement = this.query([Velocity, Position])

  onUpdate() {
    for (let i = 0; i < this.movement.entities.length; i++) {
      const e = this.movement.entities[i]

      const velocity = e.get(Velocity)
      const position = e.get(Position)

      position.x += velocity.dx
      position.y += velocity.dy

      updateCount++
    }
  }
}

export const arancini = {
  setup() {
    this.world = new World()
    
    this.world.registerComponent(Position)
    this.world.registerComponent(Velocity)

    this.world.registerSystem(MovementSystem)

    this.world.init()
    updateCount = 0
  },
  createEntity() {
    return this.world.create()
  },
  addPositionComponent(entity) {
    entity.add(Position)
  },
  addVelocityComponent(entity) {
    entity.add(Velocity)
  },
  removePositionComponent(entity) {
    entity.remove(Position)
  },
  removeVelocityComponent(entity) {
    entity.remove(Velocity)
  },
  destroyEntity(entity) {
    entity.destroy()
  },
  cleanup() {
    this.world.destroy()
  },
  updateMovementSystem() {
    this.world.update()
  },
  getMovementSystemUpdateCount() {
    return updateCount
  },
}
