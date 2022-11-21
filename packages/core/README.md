# recs

recs is _Reminiscent [of an] Entity Component System_

**Under active alpha development! Minor version bumps will have breaking changes. Stable release coming soon :)**

- 🚀 ‎ Aims to provide a simple but performant API
- 💪 ‎ Flexible and extensible
- 🗑️ ‎ Avoids garbage collection without making you think too hard
- 🪶 ‎ The core library has **_zero_** dependencies
- 🖇 ‎ Easy integration with React - [`@recs/react`](https://github.com/isaac-mason/recs/tree/main/packages/react)

## Packages

### [**`@recs/core`**](https://github.com/isaac-mason/recs/tree/main/packages/core)

[![Version](https://img.shields.io/npm/v/@recs/core)](https://www.npmjs.com/package/@recs/core)

The core library!

```bash
> yarn add @recs/core
```

### [**`@recs/react`**](https://github.com/isaac-mason/recs/tree/main/packages/react)

[![Version](https://img.shields.io/npm/v/@recs/react)](https://www.npmjs.com/package/@recs/react)

React glue for `@recs/core`

```bash
> yarn add @recs/react
```

## Introduction

As mentioned above, `recs` is an object based Entity Component System. You can use `recs` to structure games and other demanding applications.

If you don't know what an Entity Component System is, have a wikipedia article: https://en.wikipedia.org/wiki/Entity_component_system

## Getting Started

**_Let's use RECS to make a dirt simple random walk simulation!_**

**1. Import everything we need**

```ts
import { Component, Query, System, World } from "@recs/core";
```

**2. Create a few simple components to store some data**

First, let's create a few components. We'll create:
- a component that stores a position
- a component that stores a color
- a component that stores the html canvas context

```ts
class Position extends Component {
  // * note the not null `!:` syntax! *
  // It is recommended that components use this to indicate those properties
  // will be be initialised late, but at time of construction will be defined.
  x!: number;
  y!: number;

  // * `recs` pools component objects for you! *
  // Think of the `construct` method as a `constructor`.
  // This method will be called every time a new component is being created or re-used
  construct(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Color extends Component {
  color!: "red" | "blue";

  construct(color: "red" | "blue") {
    this.color = color;
  }
}

class CanvasContext extends Component {
  ctx!: CanvasRenderingContext2D;
  width!: number;
  height!: number;
}
```

**3. Create a `System` that looks for entities with the `Position` and `Color` components and draws them!**

```ts
const BOX_SIZE = 10;

class DrawSystem extends System {
  // A `System` can have many queries for entities, filtering by what components they have

  // we want to get the canvas context
  context = this.query([CanvasContext]);

  // we want to find entities with a Position and Color
  toDraw = this.query({
    all: [Position, Color],
  });

  // On each update, let's draw
  onUpdate() {
    // get the first entity from our canvas context query
    const context = this.context.first!.get(CanvasContext);
    const ctx = context.ctx;

    // clear the canvas
    ctx.clearRect(0, 0, context.width, context.height);

    const xOffset = context.width / 2;
    const yOffset = context.height / 2;

    // the results of the `toDraw` query are available under `this.toDraw.entities`
    for (const entity of this.toDraw.entities) {
      // let's get the position of the random walker
      const { x, y } = entity.get(Position);

      // let's also get the color for this random walker
      const { color } = entity.get(Color);

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
```

**4. Create a system that makes our random walkers walk**

```ts
class WalkSystem extends System {
  // query for walkers
  walkers = this.query({
    all: [Position],
  });

  // keep track of when our walkers should move again
  movementCountdown = WalkSystem.timeBetweenMovements;

  // our random walkers should move every 0.05s
  static timeBetweenMovements = 0.05;

  onUpdate(delta: number) {
    // count down until walkers should move again
    this.movementCountdown -= delta;

    // if it's time for entities to move again
    if (this.movementCountdown <= 0) {
      // move all walkers in a random direction
      for (const entity of this.walkers.entities) {
        const position = entity.get(Position)
        position.x = position.x + (Math.random() - 0.5) * 3;
        position.y = position.y + (Math.random() - 0.5) * 3;
      }

      // reset the countdown
      this.movementCountdown = WalkSystem.timeBetweenMovements;
    }
  }
}
```

**5. Bringing it all together**

First, create a new recs `World`:

```ts
const world = new World();
```

Next, let's register the components and systems we created:

```ts
// register components
world.registerComponent(Position);
world.registerComponent(Color);
world.registerComponent(CanvasContext);

// register systems
world.registerSystem(WalkSystem);
world.registerSystem(DrawSystem);
world.registerSystem(FlipSystem);
```

Now let's create some random walkers. These will be entities with the `Position` and `Color` components.

```ts
// create 100 random walkers!
const n = 100;
for (let i = 0; i < n; i++) {
  const entity = world.create.entity();
  entity.add(Position, Math.random() * 10 - 5, Math.random() * 10 - 5);
  entity.add(Color, i % 2 === 0 ? "red" : "blue");
}
```

Next we'll create an entity with the `CanvasContext` component, which will contain the HTML canvas context. We'll also add a handler for window resizing.

```ts
// create an entity with the CanvasContext component
const context = world.create.entity();

const canvas = document.querySelector("#example-canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const canvasComponent = context.add(CanvasContext);
canvasComponent.ctx = canvas.getContext("2d")!;
canvasComponent.width = canvas.width;
canvasComponent.height = canvas.height;

// handle resizing
const resize = () => {
  canvasComponent.width = canvas.width = window.innerWidth;
  canvasComponent.height = canvas.height = window.innerHeight;
};
window.addEventListener("resize", resize, false);
resize();
```

**6. The loop**

Finally, let's create a loop to run our simulation!

```ts
world.init();

const now = () => performance.now() / 1000;

let lastTime = now();

const update = () => {
  requestAnimationFrame(update);
  
  const time = now();
  const delta = time - lastTime;
  lastTime = time;

  world.update(delta);
}

update();
```
