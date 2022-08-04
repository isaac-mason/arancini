# @recs/core 🦖

recs - *Reminiscent [of an] Entity Component System*

- [x] Simple to use API
- [x] Flexible and extensible!
- [x] Avoids garbage collection without making you think too hard
- [x] Predictable - runs updates in the order systems and components are added, queues events and processes them each update

```bash
> yarn add @recs/core
```

## Introduction

As mentioned above, RECS is *kind-of* an Entity Component System.

The structure of RECS was partially inspired by how SimonDev structures the code for his game development tutorial youtube videos. If you haven't his videos before, check them out! https://www.youtube.com/channel/UCEwhtpXrg5MmwlH04ANpL8A

`recs` is far from being a pure Entity Component System.

You can use `recs` as *~more* of a pure ECS with data-only `Components` belonging to `Entities` that are managed by `Systems` with `Queries`.

You can also optionally add behavior to Components for unity-like Game Objects.

`recs` also contains an event system for eventing in Spaces and Entities.

## Getting Started

***Let's use RECS to make a dirt simple 2D random walk simulation!***

**1. Import everything we need**

```ts
import { Component, Query, System, World } from '@recs/core';
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

  // * `recs` reuses component objects! *
  // Here we add a method `construct`, which behaves just like a `constructor`.
  // This method will be called every time a new component is being created or re-used
  construct(x: number, y: number) {
    this.x = x;
    this.y = y;
  };
}

class Color extends Component {
  color!: 'red' | 'blue';

  construct(color: 'red' | 'blue') {
    this.color = color;
  };
}
```

**3. Create a `System` that looks for entities with the `Position` and `Color` components and draws them!**

```ts
const BOX_SIZE = 2;

class DrawSystem extends System {
  // get a `canvas` element from the page
  canvas = document.getElementById('example-canvas') as HTMLCanvasElement;

  // A `System` can have many queries for entities, filtering by what components they have
  // this query is called `toDraw`
  toDraw!: Query;

  onInit() {
    // initialise the `toDraw` query
    this.toDraw = this.query({
      // we want to find entities with all of these components
      all: [Position, Color],
    });
  }

  // On each update, let's draw
  onUpdate() {
    const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const xOffset = this.canvas.width / 2;
    const yOffset = this.canvas.height / 2;

    // the results of the `toDraw` query are available under
    // `this.toDraw.all`
    // We can also check `this.toDraw.added` and this.toDraw.removed`
    // to get entities that have been matched and unmatched from the query
    this.toDraw.all.forEach((entity) => {
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
    });
  };
}
```

**4. Create a system that makes our random walkers walk**

```ts
class WalkSystem extends System {
  walkers!: Query;

  movementCountdown = WalkSystem.timeBetweenMovements;

  // our random walkers should move every 0.05s
  static timeBetweenMovements = 0.05;

  onInit() {
    this.walkers = this.query({
      all: [Position],
    });
  }

  onUpdate(delta: number) {
    this.movementCountdown -= delta;

    if (this.movementCountdown <= 0) {
      this.walkers.all.forEach((entity) => {
        // move the walker in a random direction
        const position = entity.get(Position);
        position.x = position.x + Math.random() * 2 - 1;
        position.y = position.y + Math.random() * 2 - 1;
      });

      this.movementCountdown = WalkSystem.timeBetweenMovements;
    }
  };
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
```

Now let's create some entities for our random walkers and add `Position` and `Color` components.

```ts
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
  entity.addComponent(Color, i % 2 === 0 ? 'red' : 'blue');
}
```

**6. The loop**

Finally, lets start our simulation!

```ts
world.init();

let lastCall = 0;
const loop = (now: number) => {
  const elapsed = now - lastCall;
  world.update(elapsed);
  lastCall = now;

  requestAnimationFrame((elapsedMs) => loop(elapsedMs / 1000));
};

loop(0);
```
