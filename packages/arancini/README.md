![cover](https://raw.githubusercontent.com/isaac-mason/arancini/main/packages/arancini/cover.png)

[![Version](https://img.shields.io/npm/v/arancini?style=for-the-badge)](https://www.npmjs.com/package/arancini)
![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/isaac-mason/arancini/release.yml?style=for-the-badge)
[![Downloads](https://img.shields.io/npm/dt/arancini.svg?style=for-the-badge)](https://www.npmjs.com/package/arancini)
[![Bundle Size](https://img.shields.io/bundlephobia/min/arancini?style=for-the-badge&label=bundle%20size)](https://bundlephobia.com/result?p=arancini)

# arancini - an object-based Entity Component System (ECS) library for JavaScript

```
> npm i arancini
```

- 🍱 ‎ Entities are regular objects, components are properties
- 🔍 ‎ Fast reactive queries powered by bitsets
- 🧩 ‎ Framework agnostic, plug arancini into whatever you like
- 🧠 ‎ Define Systems with `arancini/systems`, or bring your own system logic
- ⚛️ ‎ [Easy integration with React](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react)
- 💙 ‎ TypeScript friendly

## Introduction

Arancini is an Entity Component System (ECS) library for JavaScript. It aims to strike a balance between ease of use and performance.

You can use arancini to structure demanding applications such as games and simulations.

If you aren't familiar with Entity Component Systems, this is a good read: https://github.com/SanderMertens/ecs-faq

TL;DR - Entity Component Systems are a data-oriented approach to structuring applications.

## Getting Started

### 🌎 Creating a World

A world represents your game or simulation. It contains entities, updates queries, and runs systems.

```ts
import { World } from 'arancini'

// (optional) define a type for entities in the world
type Entity = {
  position?: { x: number; y: number }
  health?: number
  velocity?: { x: number; y: number }
  inventory?: { items: string[] }
}

// create a world
const world = new World<Entity>({
  components: ['position', 'health', 'velocity', 'inventory'],
})
```

> **Note:**
> Components must be registered before they can be used. You can register components in an existing world using `world.registerComponents`, but doing so will cause a small performance hit as structures for existing entities need to be updated.

### 🍱 Creating Entities

In arancini, entities are regular objects, and components are properties on those objects.

You can use `world.create` to create an entity from any object. This adds the entity to the world, and adds any components that are defined on the object.

```ts
const playerEntity = { position: { x: 0, y: 0 } }

world.create(playerEntity)
```

### 📦 Adding and Removing Components

To add and remove components from an entity, you can use `world.add`, `world.remove`, and `world.update`.

```ts
/* add a component */
world.add(playerEntity, 'health', 100)

/* remove a component */
world.remove(playerEntity, 'health')

/* add and remove multiple components with a partial entity */
world.update(playerEntity, {
  // add a component
  velocity: { x: 1, y: 0 },
  // remove a component
  poisioned: undefined,
})

/* add and remove multiple components with an update callback */
world.update(playerEntity, (e) => {
  // add a component
  e.velocity = { x: 1, y: 0 }

  // remove a component
  delete e.poisioned
})
```

### 🗑 Destroying Entities

To destroy an entity, use `world.destroy`.

```ts
world.destroy(playerEntity)
```

> **Note:** Destroying an entity does not remove any properties/components from the entity object, it just removes the entity from the world and all queries.

### 🔎 Querying Entities

You can query entities based on their components with `world.query`. Queries are reactive, they will update as entities in the world change.

```ts
const monsters = world.query((e) => e.all('health', 'position', 'velocity'))
```

> **Note:** Arancini dedupes queries with the same conditions, so you can create multiple of the same query without performance penalty!

Arancini supports `all`, `any`, and `none` conditions. The query builder has some aliases for the main three conditions and noop grammar to make queries easier to read.

```ts
const monsters = world.query((e) =>
  e.all('health', 'position').any('skeleton', 'zombie').none('dead')
)

const monsters = world.query((entities) =>
  entities
    .with('health', 'position')
    .and.any('skeleton', 'zombie')
    .but.not('dead')
)
```

You can iterate over queries using a `for...of` loop (via `Symbol.iterator`). This will iterate over entities in reverse order, which must be done to avoid issues when making changes that will remove entities from queries. You can also use `query.entities` directly.

```ts
const monsters = world.query((e) => e.all('health', 'position', 'velocity'))

const updateMonsters = () => {
  /* iterates over entities in reverse order */
  for (const monster of monsters) {
    if (monster.health <= 0) {
      world.destroy(monster)
    }

    monster.position.x += monster.velocity.x
    monster.position.y += monster.velocity.y
  }
}

console.log(monsters.entities)
```

### 📡 Query Events

Queries emit events when entities are added or removed.

These events are be emitted after internal structures are updated to reflect the change, but before destructive changes are made to entities, e.g. removing components.

```ts
const query = world.query((e) => e.has('position'))

const handler = (entity: Entity) => {
  // ...
}

query.onEntityAdded.add(handler)
query.onEntityAdded.remove(handler)

query.onEntityRemoved.add(handler)
query.onEntityRemoved.remove(handler)
```

### 👀 Ad-hoc Queries

You can use `world.filter` and `world.find` to get ad-hoc query results.

This is useful for cases where you want to get results infrequently, without the cost of evaluating a reactive query as the world changes.

If there is an existing query with the same conditions, the query results will be reused.

```ts
const monsters = world.filter((e) => e.has('health', 'position', 'velocity'))

const player = world.find((e) => e.has('player'))
```

### 🧠 Systems

The core library (`@arancini/core`) does not have a concept of systems. A "System" can be as simple as a function that operations on entities in the world, as we saw in the "Querying Entities" section above.

Arancini does however provide opt-in utilities for writing systems in `arancini/systems`. This provides a convenient way of organising logic if you're not sure where to start.

In `arancini/systems`, systems are classes that extend `System`. Systems are added to an `Executor`, and are updated when calling `executor.update()`.

```ts
import { World } from 'arancini'
import { Executor, System } from 'arancini/systems'

type Entity = {
  position?: { x: number; y: number }
  velocity?: { x: number; y: number }
}

// Create a World
const world = new World<Entity>({
  components: ['position', 'velocity'],
})

// Create an Executor
const executor = new Executor(world)

// Define a System
class MovementSystem extends System<Entity> {
  moving = this.query((e) => e.has('position', 'velocity'))

  onUpdate(delta: number, time: number) {
    for (const entity of this.moving) {
      const position = entity.get('position')
      const velocity = entity.get('velocity')

      position.x += velocity.x
      position.y += velocity.y
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
executor.add(MovementSystem)

// Update all systems, optionally passing a delta time
executor.update(1 / 60)
```

#### System priority

Systems can be added with a priority. The order systems run in is first determined by priority, then by the order systems were added.

```ts
executor.add(MovementSystem, { priority: 10 })
```

#### Required system queries

If a system should only run when a query has results, you can mark the query as required. Then, `onUpdate` will only be called if the query has at least one result.

> **Note:** `onInit` and `onDestroy` will be called regardless of whether required queries have results.

```ts
class ExampleSystem extends System<Entity> {
  requiredQuery = this.query((e) => e.has('position'), { required: true })

  onUpdate() {
    // we can safely assume that the query has at least one result
    const { x, y } = this.requiredQuery.first
  }
}
```

#### Singleton Queries

The `this.singleton` utility method creates a query for a single component, and sets the property to the given component on the first matching entity.

```ts
class CameraRigSystem extends System<Entity> {
  camera = this.singleton('camera', { required: true })

  onUpdate() {
    console.log(camera)
  }
}
```

> **Note:** Singleton components must be defined on a top-level property of the system. The property must not be a ES2022 private field (prefixed with `#`).

#### Attaching systems to other systems

Systems can be attached to other systems with `this.attach`. This is useful for sharing logic or system state that doesn't belong in a component.

```ts
class ExampleSystem extends System<Entity> {
  otherSystem = this.attach(OtherSystem)

  onInit() {
    this.otherSystem.foo()
  }
}
```

## Packages

You can install all of arancini with the umbrella `arancini` package, or you can install individual packages under the `@arancini/*` scope.

> **Note:** In order to use entrypoints with typescript, you must use a `moduleResolution` option that supports entrypoints, for example `bundler` or `NodeNext`.

> **Note:** Bundles are ECMAScript modules, there are no CommonJS bundles right now.

### [**`arancini`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini)

[![Version](https://img.shields.io/npm/v/arancini)](https://www.npmjs.com/package/arancini)

The umbrella package for `arancini`.

```bash
> npm install arancini
```

```ts
import { World } from 'arancini'
import { Executor, System } from 'arancini/systems'
import { createReactApi } from 'arancini/react'
```

### [**`@arancini/core`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-core)

[![Version](https://img.shields.io/npm/v/arancini)](https://www.npmjs.com/package/@arancini/core)

The core library!

```bash
> npm install @arancini/core
```

```ts
import { World } from '@arancini/core'
```

### [**`@arancini/systems`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-systems)

[![Version](https://img.shields.io/npm/v/@arancini/systems)](https://www.npmjs.com/package/@arancini/systems)

Systems for arancini.

```bash
> npm install @arancini/systems
```

```ts
import { Executor, System } from '@arancini/systems'
```

### [**`@arancini/react`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react)

[![Version](https://img.shields.io/npm/v/@arancini/react)](https://www.npmjs.com/package/@arancini/react)

React glue for arancini.

See the [**@arancini/react README**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react) for docs.

```bash
> npm install @arancini/react
```

```ts
import { createReactApi } from '@arancini/react'
```

### [**`@arancini/events`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-events)

[![Version](https://img.shields.io/npm/v/@arancini/events)](https://www.npmjs.com/package/@arancini/events)

Eventing utilities.

```bash
> npm install @arancini/events
```

```ts
import { Topic } from '@arancini/events'

const inventoryEvents = new Topic<[item: string, quantity: number]>()

const unsubscribe = topic.inventoryEvents((item, quantity) => {
  console.log(item, quantity)
})

inventoryEvents.emit('apple', 1)

inventoryEvents.clear()
```

### [**`@arancini/pool`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-pool)

[![Version](https://img.shields.io/npm/v/@arancini/pool)](https://www.npmjs.com/package/@arancini/pool)

Object pooling utilities.

```bash
> npm install @arancini/pool
```

```ts
import { ObjectPool } from '@arancini/pool'

const pool = new ObjectPool(() => new Float32Array(1000))

const array = pool.request()

pool.recycle(array)
```
