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
- 🧠 ‎ Define Systems with arancini, or bring your own system logic
- 🧩 ‎ Framework agnostic, plug arancini into whatever you like
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

// initialise the world
world.init()
```

> **Note:**
> Components must be registered before they can be used. You can register components in an existing world using `world.registerComponents`, but doing so after initialising the world will cause a small performance hit.

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
const monsters = world.query((q) => q.all('health', 'position', 'velocity'))
```

> **Note:** Arancini dedupe queries with the same filters, so you can create multiple of the same query without performance penalty!

Arancini supports `all`, `any`, and `none` filters. The query builder has some aliases for the main three conditions and noop grammar to make queries easier to read.

```ts
const monsters = world.query((q) =>
  q.all('health', 'position').any('skeleton', 'zombie').none('dead')
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
const monsters = world.query((q) => q.all('health', 'position', 'velocity'))

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

```ts
const monsters = world.filter((e) => e.has('health', 'position', 'velocity'))

const player = world.find((e) => e.has('player'))
```

### 🧠 Systems

Systems contain logic that operate on entities.

In arancini, systems are classes that extend `System`. Systems are registered with a world, and are updated when `world.step` is called.

While arancini has built-in support for systems, it's worth noting that there's nothing special about systems. You can write your own "System" logic using queries directly. Arancini Systems just offer a convenient way of organising logic.

```ts
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
    // Called when the world is initialised, or when the system is registered in an initialised world
  }

  onDestroy() {
    // Called when the world is destroyed or the system is unregistered
  }
}

// Register the system
world.registerSystem(ExampleSystem)

// Use `world.step()` to run all registered systems
world.step(1 / 60)
```

#### System priority

Systems can be registered with a priority. The order systems run in is first determined by priority, then by the order systems were registered.

```ts
const priority = 10
world.registerSystem(MovementSystem, priority)
```

#### Required system queries

System queries can be marked as 'required', which will cause `onUpdate` to only be called if the query has at least one result.

```ts
class ExampleSystem extends System {
  requiredQuery = this.query((q) => q.has('position'), { required: true })

  onUpdate() {
    const { x, y } = this.requiredQuery.first
  }
}
```

#### Singleton Queries

The `singleton` method creates a query for a single component, and sets the property to the given component from the first matching entity.

Singletons are useful for accessing components that are expected to exist on a single entity, such as a camera, or a player in a single player game.

```ts
class ExampleSystem extends System {
  player = this.singleton('player', { required: true })

  onUpdate() {
    console.log(player)
  }
}
```

> **Note:** Singleton components must be defined on a top-level property of the system. The property must not be a ES2022 private field (prefixed with `#`).

#### Attaching systems to other systems

Systems can be attached to other systems with `this.attach`. This is useful for sharing logic or system state that doesn't belong in a component.

```ts
class ExampleSystem extends System {
  otherSystem = this.attach(OtherSystem)

  onUpdate() {
    this.otherSystem.foo()
  }
}
```

## Packages

You can install all of arancini with the umbrella `arancini` package, or you can install particular packages.

> **Note:** arancini ships as ECMAScript modules.

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
