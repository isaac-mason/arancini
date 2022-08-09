# recs 🦖

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

React glue for `recs`.

```bash
> yarn add @recs/react
```

## Introduction

As mentioned above, `recs` is _kind-of_ an Entity Component System. It's structure was inspired by how SimonDev structures games in his YouTube tutorial videos. If you haven't his videos before, [check them out](https://www.youtube.com/channel/UCEwhtpXrg5MmwlH04ANpL8A)!

You can use `recs` as _~more_ of a pure ECS with data-only `Components` belonging to `Entities` that are managed by `Systems` with `Queries`. You can also optionally add behavior to Components for unity-like Game Objects.

## Getting Started

**_Let's use RECS to make a dirt simple random walk simulation!_**

**1. Import everything we need**

```ts
import { Component, Query, System, World } from "@recs/core";
```

**2. Create a few simple components to store some data**

First, let's create a component that can store a position, and a component that can store a color.

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
  context!: Query;
  toDraw!: Query;

  onInit() {
    // we want to get the canvas context
    this.context = this.query([CanvasContext]);

    // we want to find entities with a Position and Color
    this.toDraw = this.query({
      all: [Position, Color],
    });
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

    // the results of the `toDraw` query are available under `this.toDraw.all`
    // We can also check `this.toDraw.added` and this.toDraw.removed` to get
    // entities that have been added and remove since the last system update.
    for (const entity of this.toDraw.all) {
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
  walkers!: Query;

  // keep track of when our walkers should move again
  movementCountdown = WalkSystem.timeBetweenMovements;

  // our random walkers should move every 0.05s
  static timeBetweenMovements = 0.05;

  onInit() {
    this.walkers = this.query({
      all: [Position],
    });
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
```

**5. Bringing it all together**

First, create a new recs `World`:

```ts
const world = new World();
```

Next, let's add the systems we created:

```ts
world.registerSystem(WalkSystem);
world.registerSystem(DrawSystem);
world.registerSystem(FlipSystem);
```

Now let's create some entities for our random walkers with `Position` and `Color` components.

```ts
// how many entities to create
const n = 100;

// create entities in the world
for (let i = 0; i < n; i++) {
  world.builder.entity()
    .addComponent(Position, Math.random() * 10 - 5, Math.random() * 10 - 5);
    .addComponent(Color, i % 2 === 0 ? "red" : "blue")
    .build();
}

// create an entity with a component containing the canvas context
const context = world.create.entity();

const canvas = document.querySelector("#example-canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const canvasComponent = context.addComponent(CanvasContext);
canvasComponent.ctx = canvas.getContext("2d")!;
canvasComponent.width = canvas.width;
canvasComponent.height = canvas.height;

// handle resizing
window.addEventListener(
  "resize",
  () => {
    canvasComponent.width = canvas.width = window.innerWidth;
    canvasComponent.height = canvas.height = window.innerHeight;
  },
  false
);
```

**6. The loop**

Finally, let's create a loop to run our simulation!

```ts
world.init();

let lastTime = performance.now() / 1000;
function update() {
  const time = performance.now() / 1000;
  const delta = time - lastTime;
  lastTime = time;
  world.update(delta);
  requestAnimationFrame(update);
}
```
