import { useEffect } from '@storybook/client-api';
import World, { Component, System } from '../../src';

class Position extends Component {
  // * note the not null `!:` syntax! *
  // It is recommended that components use this to indicate those properties
  // will be be initialised late, but at time of construction will be defined.
  x!: number;
  y!: number;

  // * component objects will be reused! *
  // Here we add a method `construct`, which behaves just like a `constructor`.
  // This method will be called every time a new component is being created or re-used
  construct(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Red extends Component {}
class Blue extends Component {}

const BOX_SIZE = 2;

class DrawSystem extends System {
  // get a `canvas` element from the page
  canvas = document.getElementById('example-canvas') as HTMLCanvasElement;

  // A `System` can have many queries for entities, filtering by what components they have
  queries = {
    // this query is called `toDraw`
    toDraw: {
      // we want to find entities with a position
      all: [Position],
      // we want to find entities that are either red or blue
      one: [Red, Blue],
    },
  };

  // On each update, let's draw
  onUpdate() {
    const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const xOffset = this.canvas.width / 2;
    const yOffset = this.canvas.height / 2;

    // the results of the `toDraw` query are available under
    // `this.results.toDraw.all`
    // We can also check `this.results.toDraw.added` and this.results.toDraw.removed`
    // to get entities that have been matched and unmatched from the query
    this.results.toDraw.all.forEach((entity) => {
      // let's get the position of the random walker
      const { x, y } = entity.get(Position);

      // let's also get the color for this random walker
      const color: 'red' | 'blue' = entity.has(Red) ? 'red' : 'blue';

      // draw the box
      ctx.fillStyle = color;
      ctx.fillRect(
        xOffset + (x - BOX_SIZE / 2),
        yOffset + (y - BOX_SIZE / 2),
        BOX_SIZE,
        BOX_SIZE
      );
    });
  }
}

class WalkSystem extends System {
  queries = {
    walkers: {
      all: [Position],
    },
  };

  static timeBetweenMovements = 0.05;

  movementCountdown = WalkSystem.timeBetweenMovements;

  onUpdate(timeElapsed: number) {
    this.movementCountdown -= timeElapsed;

    if (this.movementCountdown <= 0) {
      this.results.walkers.all.forEach((entity) => {
        // move the walker in a random direction
        const position = entity.get(Position);
        position.x = position.x + Math.random() * 2 - 1;
        position.y = position.y + Math.random() * 2 - 1;
      });

      this.movementCountdown = WalkSystem.timeBetweenMovements;
    }
  }
}

class FlipSystem extends System {
  queries = {
    walkers: {
      one: [Red, Blue],
    },
  };

  onUpdate() {
    this.results.walkers.all.forEach((entity) => {
      // small chance of changing color
      if (Math.random() >= 0.95) {
        if (entity.has(Blue)) {
          entity.removeComponent(Blue);
          entity.addComponent(Red);
        } else {
          entity.removeComponent(Red);
          entity.addComponent(Blue);
        }
      }
    });
  }
}

export const RandomColorChangingWalkers = () => {
  useEffect(() => {
    const world = new World();

    world.addSystem(new WalkSystem());
    world.addSystem(new DrawSystem());
    world.addSystem(new FlipSystem());

    // create a space for our entities
    const space = world.create.space();

    // how many entities to create
    const n = 100;

    // create entities in the space
    for (let i = 0; i < n; i++) {
      const entity = space.create.entity();
      entity.addComponent(
        Position,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5
      );
      entity.addComponent(i % 2 === 0 ? Red : Blue);
    }

    world.init();

    let lastCall = 0;
    const loop = (now: number) => {
      const elapsed = now - lastCall;
      world.update(elapsed);
      lastCall = now;

      requestAnimationFrame((elapsedMs) => loop(elapsedMs / 1000));
    };

    loop(0);
  });

  return `
    <canvas id="example-canvas" />
  `;
};

export default {
  name: 'Random Walkers',
  component: RandomColorChangingWalkers,
};