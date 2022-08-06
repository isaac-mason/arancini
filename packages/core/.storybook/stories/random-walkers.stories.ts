import { useEffect } from '@storybook/client-api';
import { Component, Query, System, World } from '@recs/core';

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

export class CanvasContext extends Component {
  ctx!: CanvasRenderingContext2D;
  width!: number;
  height!: number;
}

const Queries = {
  ToDraw: {
    all: [Position],
    any: [Red, Blue],
  },
  Context: [CanvasContext],
  WalkerPosition: [Position],
  Color: {
    any: [Red, Blue],
  }
}

const BOX_SIZE = 10;

class DrawSystem extends System {
  // get the canvas context
  context: Query;

  // A `System` can have many queries for entities, filtering by what components they have
  // this query is called `toDraw`
  toDraw!: Query;
  
  onInit(): void {
    this.context = this.query(Queries.Context);
    this.toDraw = this.query(Queries.ToDraw);
  }

  // On each update, let's draw
  onUpdate() {
    // get the first entity from our canvas context query
    const context = this.context.first!.get(CanvasContext);
    const ctx = context.ctx;

    // clear the canvas
    ctx.clearRect(0, 0, context.width, context.height);

    const xOffset = context.width / 2;
    const yOffset = context.height / 2;

    // the results of the `toDraw` query are available under
    // `this.toDraw.all`
    // We can also check `this.toDraw.added` and this.toDraw.removed`
    // to get entities that have been matched and unmatched from the query
    for (const entity of this.toDraw.all) {
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
    }
  }
}

class WalkSystem extends System {
  walkers!: Query;

  // keep track of when our walkers should move again
  static timeBetweenMovements = 0.05;

  // our random walkers should move every 0.05s
  movementCountdown = WalkSystem.timeBetweenMovements;

  onInit(): void {
    // query for walkers
    this.walkers = this.query(Queries.WalkerPosition);
  }
  
  onUpdate(delta: number) {
    // count down until walkers should move again
    this.movementCountdown -= delta;

    // if it's time for entities to move again
    if (this.movementCountdown <= 0) {
      // move all walkers in a random direction
      for (const entity of this.walkers.all) {
        const position = entity.get(Position)
        position.x = position.x + (Math.random() - 0.5) * 3;
        position.y = position.y + (Math.random() - 0.5) * 3;
      }

      // reset the countdown
      this.movementCountdown = WalkSystem.timeBetweenMovements;
    }
  }
}

class FlipSystem extends System {
  walkers!: Query;

  onInit(): void {
    this.walkers = this.query(Queries.Color);
  }

  onUpdate() {
    this.walkers.all.forEach((entity) => {
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

    world.registerSystem(WalkSystem);
    world.registerSystem(DrawSystem);
    world.registerSystem(FlipSystem);

    // how many entities to create
    const n = 100;

    // create entities in the World's default space
    for (let i = 0; i < n; i++) {
      const entity = world.create.entity();
      entity.addComponent(
        Position,
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 300
      );
      entity.addComponent(i % 2 === 0 ? Red : Blue);
    }

    // create an entity with a component containing the canvas context
    const context = world.create.entity()

    const canvas = document.querySelector(
      '#example-canvas'
    ) as HTMLCanvasElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const canvasComponent = context.addComponent(CanvasContext);
    canvasComponent.ctx = canvas.getContext('2d')!;
    canvasComponent.width = canvas.width;
    canvasComponent.height = canvas.height;

    // handle resizing
    window.addEventListener(
      'resize',
      () => {
        canvasComponent.width = canvas.width = window.innerWidth;
        canvasComponent.height = canvas.height = window.innerHeight;
      },
      false
    );

    world.init();

    let running = true;
    let lastTime = performance.now() / 1000;
    function update() {
      if (!running) return;
      const time = performance.now() / 1000;
      const delta = time - lastTime;
      lastTime = time;
      world.update(delta);
      requestAnimationFrame(update);
    }

    update();

    return () => {
      running = false;
      world.destroy();
    }
  });

  return `
    <canvas id="example-canvas" />
  `;
};

export default {
  name: 'Random Walkers',
  component: RandomColorChangingWalkers,
};