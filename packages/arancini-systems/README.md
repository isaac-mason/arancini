# @arancini/systems

Systems helpers for arancini.

## Installation

@arancini/systems can either be used via the umbrella package `arancini`, or installed separately.

```bash
> npm install @arancini/systems
```

## Introduction

In `arancini/systems`, systems are classes that extend `System`. Systems are added to an `Executor`, and are updated when calling `executor.update()`.

```ts
import { World } from "arancini";
import { Executor, System } from "arancini/systems";

type Entity = {
  position?: { x: number; y: number };
  velocity?: { x: number; y: number };
};

// Create a World
const world = new World<Entity>();

// Create an Executor
const executor = new Executor(world);

// Define a System
class MovementSystem extends System<Entity> {
  moving = this.query((e) => e.has("position", "velocity"));

  onUpdate(delta: number, time: number) {
    for (const entity of this.moving) {
      const position = entity.get("position");
      const velocity = entity.get("velocity");

      position.x += velocity.x;
      position.y += velocity.y;
    }
  }

  onInit() {
    // Called when the Executor is initialised, or when the system is added to an already initialised Executor
  }

  onDestroy() {
    // Called when the Executor is destroyed, or the system is removed
  }
}

// Add the system to the executor
executor.add(MovementSystem);

// Initialise the executor
executor.init();

// Update all systems, optionally passing a delta time
executor.update(1 / 60);

// Destroy the executor
executor.destroy();
```

#### System priority

Systems can be added with a priority. The order systems run in is first determined by priority, then by the order systems were added.

```ts
executor.add(MovementSystem, { priority: 10 });
```

#### Required system queries

If a system should only run when a query has results, you can mark the query as required. Then, `onUpdate` will only be called if the query has at least one result.

> **Note:** `onInit` and `onDestroy` will be called regardless of whether required queries have results.

```ts
class ExampleSystem extends System<Entity> {
  requiredQuery = this.query((e) => e.has("position"), { required: true });

  onUpdate() {
    // we can safely assume that the query has at least one result
    const { x, y } = this.requiredQuery.first;
  }
}
```

#### Singleton Queries

The `this.singleton` utility method creates a query for a single component, and sets the property to the given component on the first matching entity.

```ts
class CameraRigSystem extends System<Entity> {
  camera = this.singleton("camera", { required: true });

  onUpdate() {
    console.log(camera);
  }
}
```

> **Note:** Singleton components must be defined on a top-level property of the system. The property must not be a ES2022 private field (prefixed with `#`).

#### Attaching systems to other systems

Systems can be attached to other systems with `this.attach`. This is useful for sharing logic or system state that doesn't belong in a component.

```ts
class ExampleSystem extends System<Entity> {
  otherSystem = this.attach(OtherSystem);

  onInit() {
    this.otherSystem.foo();
  }
}
```