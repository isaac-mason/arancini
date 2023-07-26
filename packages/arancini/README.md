# arancini

Arancini is an object based Entity Component System. You can use arancini to structure demanding applications such as games and simulations.

- 💪 ‎ Flexible and extensible
- 🔍 ‎ Reactive queries
- 🗑️ ‎ Built-in object pooling to help avoid garbage collection
- 🍃 ‎ Less than 4kB minified + gzipped
- 🖇 ‎ [Easy integration with React](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react)

## Overview

If you aren't familiar with Entity Component Systems, this is a good read: https://github.com/SanderMertens/ecs-faq

TL;DR: ECS is a data-oriented architecture for structuring your application.

In arancini, components are defined as classes and can contain data. You can then use queries to find entities that have certain components, and run logic on them. Arancini has built-in support for Systems, but you can also use queries alone to roll your own "System" logic.

Object-pooling is a core feature of arancini. Arancini will pool and re-use entity and component objects for you! This helps avoid garbage collection and improves performance.

## Packages

You can install all of arancini with the umbrella `arancini` package, or you can install particular packages.

> **Note:** arancini ships as ESM only

### [**`arancini`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini)

[![Version](https://img.shields.io/npm/v/arancini)](https://www.npmjs.com/package/arancini)

The umbrella package for `arancini`. Includes `@arancini/core`, and `@arancini/react` under the `arancini/react` entrypoint.

```bash
> npm install arancini
```

### [**`@arancini/core`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-core)

[![Version](https://img.shields.io/npm/v/arancini)](https://www.npmjs.com/package/@arancini/core)

The core library!

```bash
> npm install @arancini/core
```

### [**`@arancini/react`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react)

[![Version](https://img.shields.io/npm/v/@arancini/react)](https://www.npmjs.com/package/@arancini/react)

React glue for arancini.

```bash
> npm install @arancini/react
```

## Getting Started

### 🌎 World

A world represents your game or simulation. It maintains the entities, components, queries and systems in the ECS.

```ts
import { World } from "arancini";

// create a world
const world = new World();

// register components and systems
world.registerComponent(MyComponent);
world.registerSystem(MySystem);

// initialise the world
world.init();
```

### 🍱 Entity

An entity is a container for components.

```ts
// create an entity
const entity = world.create();

// remove all components and remove from the world
entity.destroy();
```

> **Note:** You should avoid storing references to entities and components - arancini pools/recycles entity and component objects. Use queries to find entities that have certain components, run logic on them, and then discard the references.

### 📦 Component

Components are containers for data. There are multiple ways to define components.

#### Basic Data Component

You can use the `Component.data` utility to define a basic data component.

```ts
import { Component } from "arancini";

const PositionComponent = Component.data<{ x: number; y: number }>();

world.registerComponent(PositionComponent);

const entity = world.create();
const position = entity.add(PositionComponent, { x: 1, y: 2 });

console.log(position.x, position.y); // 1, 2
```

> **Note:** If you want some properties to be optional, you should include them as `undefined`. Otherwise, the previous value from a recycled component may be present. It may be more straightforward to define a component with the below method.

#### Custom Component

The basic method is succinct, but it doesn't exploit all of arancini's features. To get the most out of arancini, you can define your components as classes that extend the `Component` class.

You can define a `construct` method on your components, which will be called every time a component object is created or re-used. You can also define `onInit` and `onDestroy` methods, which will be called when the component is added or removed from an entity.

```ts
class PositionComponent extends Component {
  x!: number;
  y!: number;

  construct(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

world.registerComponent(PositionComponent);

entity.add(Position, 10, 20);
entity.remove(Position);
```

> **Note:** In typescript you need to use the not null `!:` syntax to indicate that the properties should be defined, as they will be set in the `construct` method.

> **Note:** Components must be registered with the world before they can be used. You can register components after the world is initialised, but doing so will cause a small performance hit as internal data structures need to be updated.

Adding or removing a component from an entity will cause queries to be updated. To avoid unnecessary updates, you can use `entity.bulk` to add or remove multiple components in a single operation.

```ts
entity.bulk(() => {
  entity.add(Position, 10, 20);
  entity.add(Velocity, 1, 2);
  entity.remove(Health);
});
```

**You can only register a component with one world.** If you want to use the same component in multiple worlds, you can create a base class and extend it for each world. For example:

```ts
/* lib.ts */
import { Component } from "arancini";

export class MyComponent extends Component {
  /* ... */
}

/* some-world.ts */
import { World } from "arancini";
import { MyComponent as MyComponentImpl } from "./lib";

class MyComponent extends MyComponentImpl {}

const world = new World();
world.registerComponent(MyComponent);
```

### 🔎 Query

You can use queries to find entities that have certain components. Queries support `all`, `one`, and `none` filters. Queries with the same filters are deduplicated by arancini, so you can create multiple queries with the same filters without performance penalty.

```ts
const basicQuery = world.query([Position]);

const advancedQuery = world.query({
  all: [Position, Velocity],
  one: [EitherThisComponent, OrThisComponent],
  none: [NotThisComponent],
});
```

#### Iterating over query results

The `Query` class has a `Symbol.iterator` method which can be used to iterate over all entities that match the query in reverse order. When removing entities from within the loop, entities must be iterated over in reverse order.

Alternatively, you can simply iterate over entities in `query.entities`.

```ts
const query = world.query([Position]);

for (const entity of query) {
  // iterates over entities in reverse order
}

for (const entity of query.entities) {
  // regular forward iteration
}
```

#### Reactive queries

Queries are reactive and can emit events when entities are added or removed from the query.

```ts
const query = world.query([Position]);

const handler = (entity: Entity) => {
  // ...
};

query.onEntityAdded.add(handler);
query.onEntityRemoved.add(handler);

query.onEntityAdded.remove(handler);
query.onEntityRemoved.remove(handler);
```

### 🧠 System

Arancini has built-in support for systems, but you can also use queries alone to create your own "System" logic if you prefer. Systems are just a convenient way to organise your logic.

#### Updating systems

If you have systems registered in the world, you can use `world.update()` to run the systems. If you don't have any systems registered, you don't need to call `update`! Arancini is fully reactive, queries will be updated as the composition of entities change.

```ts
const delta = 1 / 60;
world.update(delta);
```

#### System lifecycle methods

Systems have lifecycle methods that are called on world initialisation and teardown, and when the world is updated.

```ts
class ExampleSystem extends System {
  onInit() {
    // called when the world is initialised,
    // or when the system is registered in an initialised world
  }

  onDestroy() {
    // called when the world is destroyed or the system is unregistered
  }

  onUpdate(delta: number, time: number) {
    // called when updating the world
  }
}
```

#### Creating system queries

You can use `this.query` to create a query linked to the system. These queries will automatically be destroyed when the system is destroyed.

```ts
class MovementSystem extends System {
  moving = this.query([Position, Velocity]);

  onUpdate() {
    for (const entity of this.moving) {
      const position = entity.get(Position);
      const velocity = entity.get(Velocity);

      position.x += velocity.x;
      position.y += velocity.y;
    }
  }
}
```

System queries can be marked as 'required', meaning that the system will only be updated if the query has at least one result.

```ts
class ExampleSystem extends System {
  requiredQuery = this.query([ExampleComponent], { required: true });

  onUpdate() {
    const { data } = this.requiredQuery.first!.get(ExampleComponent);
  }
}
```

#### Singleton components

Singleton components queries can be defined for cases where systems need to access shared data, like a camera or player component.

The `singleton` method creates a query for a single component, and sets the property on the system to the given component from the first matching entity.

```ts
class ExampleSystem extends System {
  player = this.singleton(PlayerComponent, { required: true });

  onUpdate() {
    player.ENERGY -= 1;
  }
}
```

> **Note:** Singleton components must be defined on a top-level property of the system. The property must not be a ES2022 private field (prefixed with `#`).

#### Execution Order

Systems can be registered with a priority. The order systems run in is first determined by priority, then by the order systems were registered.

```ts
const priority = 10;
world.registerSystem(MovementSystem, priority);
```

## Example

Let's use arancini to make a simple random walk simulation!

### 1. Import everything we need

```ts
import { Component, Query, System, World } from "arancini";
```

### 2. Create components to store data

```ts
class Position extends Component {
  x!: number;
  y!: number;

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

### 3. Create a System that draws entities with `Position` and `Color` components

```ts
class DrawSystem extends System {
  canvasContext = this.query([CanvasContext]);

  boxesToDraw = this.query({
    all: [Position, Color],
  });

  onUpdate() {
    const context = this.canvasContext.first!.get(CanvasContext);

    context.ctx.clearRect(0, 0, context.width, context.height);

    const xOffset = context.width / 2;
    const yOffset = context.height / 2;

    const boxSize = 10;

    for (const entity of this.boxesToDraw.entities) {
      const { x, y } = entity.get(Position);
      const { color } = entity.get(Color);

      context.ctx.fillStyle = color;
      context.ctx.fillRect(
        xOffset + (x - boxSize / 2),
        yOffset + (y - boxSize / 2),
        boxSize,
        boxSize
      );
    }
  }
}
```

### 4. Create a System that moves entities with a `Position` Component

```ts
const TIME_BETWEEN_MOVEMENTS = 0.05; // seconds

class WalkSystem extends System {
  movementCountdown = TIME_BETWEEN_MOVEMENTS;

  walkers = this.query({
    all: [Position],
  });

  onUpdate(delta: number) {
    this.movementCountdown -= delta;

    if (this.movementCountdown <= 0) {
      for (const entity of this.walkers.entities) {
        const position = entity.get(Position);
        position.x += (Math.random() - 0.5) * 3;
        position.y += (Math.random() - 0.5) * 3;
      }

      this.movementCountdown = TIME_BETWEEN_MOVEMENTS;
    }
  }
}
```

### 5. Bringing it all together

First, create a new `World`

```ts
const world = new World();
```

Next, let's register the Components and Systems we created.

```ts
world.registerComponent(Position);
world.registerComponent(Color);
world.registerComponent(CanvasContext);

world.registerSystem(WalkSystem);
world.registerSystem(DrawSystem);
world.registerSystem(FlipSystem);
```

Now let's create some random walkers. We'll create 100 random walkers, and give them a random position and color.

```ts
const N = 100;

const randomPosition = () => Math.random() * 10 - 5;
const randomColor = () => (Math.random() > 0.5 ? "red" : "blue");

for (let i = 0; i < N; i++) {
  const entity = world.create();
  entity.add(Position, randomPosition(), randomPosition());
  entity.add(Color, randomColor());
}
```

Next we'll create an entity with the `CanvasContext` component, which will contain the HTML canvas context. We'll also add a handler for window resizing.

```ts
const canvasContext = world.create();

const canvasElement = document.querySelector(
  "#example-canvas"
) as HTMLCanvasElement;
canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

const canvasComponent = canvasContext.add(CanvasContext);
canvasComponent.ctx = canvasElement.getContext("2d")!;
canvasComponent.width = canvasElement.width;
canvasComponent.height = canvasElement.height;

const resize = () => {
  canvasComponent.width = canvasElement.width = window.innerWidth;
  canvasComponent.height = canvasElement.height = window.innerHeight;
};
window.addEventListener("resize", resize, false);
resize();
```

### 6. The loop

Finally, let's initialise the World and run our simulation!

```ts
world.init();

const now = () => performance.now() / 1000;

let lastTime = now();

const loop = () => {
  requestAnimationFrame(loop);

  const time = now();
  const delta = time - lastTime;
  lastTime = time;

  world.update(delta);
};

loop();
```
