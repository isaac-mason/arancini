import { World, Component, System } from '@recs/core';

class Position extends Component {
  construct() {
    this.x = 0;
    this.y = 0;
  }
}

class Velocity extends Component {
  construct() {
    this.dx = Math.random - 0.5;
    this.dy = Math.random - 0.5;
  }
}

let updateCount = 0;

class MovementSystem extends System {
  onInit() {
    this.movement = this.query([Velocity, Position]);
  }

  onUpdate() {
    for (let i = 0; i < this.movement.entities.length; i++) {
      const e = this.movement.entities[i];

      const velocity = e.get(Velocity);
      const position = e.get(Position);

      position.x += velocity.dx;
      position.y += velocity.dy;

      updateCount++;
    }
  }
}

export const recs = {
  setup() {
    this.world = new World();
    this.world.registerSystem(MovementSystem);
    this.space = this.world.create.space();
    this.world.init();
    updateCount = 0;
  },
  createEntity() {
    return this.space.create.entity();
  },
  addPositionComponent(entity) {
    entity.add(Position);
  },
  addVelocityComponent(entity) {
    entity.add(Velocity);
  },
  removePositionComponent(entity) {
    entity.remove(Position);
  },
  removeVelocityComponent(entity) {
    entity.remove(Velocity);
  },
  destroyEntity(entity) {
    entity.destroy();
  },
  cleanup() {
    this.world.destroy();
  },
  updateMovementSystem() {
    this.world.update();
  },
  getMovementSystemUpdateCount() {
    return updateCount;
  },
};
