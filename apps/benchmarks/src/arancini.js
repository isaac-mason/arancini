import { World } from '@arancini/core'

let updateCount = 0

export const arancini = {
  setup() {
    this.world = new World()

    this.query = this.world.query((e) => e.has('position', 'velocity'))

    this.movementSystem = () => {
      for (let i = 0; i < this.query.entities.length; i++) {
        const { position, velocity } = this.query.entities[i]

        position.x += velocity.x
        position.y += velocity.y
        position.z += velocity.z

        updateCount++
      }
    }

    updateCount = 0
  },
  createEntity() {
    const entity = {}
    this.world.create(entity)
    return entity
  },
  addPositionComponent(entity) {
    this.world.add(entity, 'position', { x: 0, y: 0, z: 0 })
  },
  addVelocityComponent(entity) {
    this.world.add(entity, 'velocity', {
      dx: Math.random() - 0.5,
      dy: Math.random() - 0.5,
      dz: Math.random() - 0.5,
    })
  },
  removePositionComponent(entity) {
    this.world.remove(entity, 'position')
  },
  removeVelocityComponent(entity) {
    this.world.remove(entity, 'velocity')
  },
  destroyEntity(entity) {
    this.world.destroy(entity)
  },
  cleanup() {
    this.world.clear()
  },
  updateMovementSystem() {
    this.movementSystem()
  },
  getMovementSystemUpdateCount() {
    return updateCount
  },
}
