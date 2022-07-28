import { World, Component, System } from '@recs/core';

export const addRemove = () => {
  const N = 10000;

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

  class MovementSystem extends System {
    onInit() {
      this.movement = this.query([Velocity, Position]);
    }

    onUpdate() {
      for (let i = 0; i < this.movement.all.length; i++) {
        const e = this.movement.all[i];

        const velocity = e.get(Velocity);
        const position = e.get(Position);

        position.x += velocity.dx;
        position.y += velocity.dy;
      }
    }
  }

  const world = new World();

  world.addSystem(new MovementSystem());
  
  const space = world.create.space();

  world.init()

  for (let i = 0; i < N; i++) {
    const entityOne = space.create.entity();
    const entityTwo = space.create.entity();

    entityOne.addComponent(Position);
    entityOne.addComponent(Velocity);

    entityTwo.addComponent(Position);
    entityTwo.addComponent(Velocity);

    world.update();

    entityOne.removeComponent(Position);

    world.update();

    entityOne.destroy();
  }
};
