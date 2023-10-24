# arancini

Arancini is an object based Entity Component System.

```
> npm i arancini
```

- 💙 ‎ TypeScript friendly
- 💪 ‎ Flexible and extensible
- 🔍 ‎ Fast reactive queries powered by bitsets
- 🍃 ‎ Zero dependencies
- 🖇 ‎ [Easy integration with React](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react)

## Introduction

In arancini, entities are regular javascript objects, and components are properties on those objects. You can use arancini to structure demanding applications such as games and simulations.

If you aren't familiar with Entity Component Systems, this is a good read: https://github.com/SanderMertens/ecs-faq

TL;DR - Entity Component Systems are a data-oriented approach to structuring applications.

## Getting Started

### 🌎 Creating a World

A world represents your game or simulation. It maintains the entities, components, queries and systems in the ECS.

```ts
import { World } from "arancini";

// (optional) define a type for entities in the world
type Entity = {
  position?: { x: number; y: number };
  health?: number;
  velocity?: { x: number; y: number };
  inventory?: { items: string[] };
};

// create a world
const world = new World<Entity>({
  // components that can be added to entities
  components: ["position", "health", "velocity", "inventory"],
});

// initialise the world
world.init();
```

### 🍱 Creating Entities

In arancini, entities are regular objects, and components are properties on those objects.

You can use `world.create` to create an entity from any object. This registers the entity with the world, and adds any components that are defined on the object.

```ts
const playerEntity = { position: { x: 0, y: 0 } };

world.create(playerEntity);
```

### 📦 Adding and Removing Components

To add and remove components from an entity, you can use `world.add`, `world.remove`, and `world.update`.

```ts
/* add a component */
world.add(playerEntity, "health", 100);

/* remove a component */
world.remove(playerEntity, "health");

/* add and remove multiple components with a partial entity */
world.update(playerEntity, {
  // add a component
  velocity: { x: 1, y: 0 },
  // remove a component
  poisioned: undefined,
});

/* add and remove multiple components with an update callback */
world.update(playerEntity, (e) => {
  // add a component
  e.velocity = { x: 1, y: 0 };

  // remove a component
  delete e.poisioned;
});
```

### 🗑 Destroying Entities

To destroy an entity, use `world.destroy`. Note that destroying an entity does not remove any properties/components from the entity object.

```ts
world.destroy(playerEntity);
```

### 🔎 Querying Entities

You can query entities based on what components they have with `all`, `one`, and `none` filters.

```ts
const monsters = world.query((q) => q.all("health", "position", "velocity"));

const updateMonsters = () => {
  for (const monster of monsters) {
    monster.position.x += monster.velocity.x;
    monster.position.y += monster.velocity.y;
  }
};
```

Arancini also supports more advanced queries. The query builder has some aliases for the main three conditions and noop grammar to make queries easier to read.

```ts
const monsters = world.query((entities) =>
  entities
    .with("health", "position")
    .and.any("skeleton", "zombie")
    .but.not("dead"),
);
```

Queries have a `Symbol.iterator` method, so you can iterate over them with a `for...of` loop. This will iterate over entities in reverse order, which must be done to avoid issues when making changes that will remove entities from queries.

```ts
const query = world.query((e) => e.has("position"));

// iteratee over entities in reverse order
for (const entity of query) {
  // ...
}

// regular iteration
for (const entity of query.entities) {
  // ...
}
```

Arancini attempts to normalise queries with equivelant filters, so you can generally create multiple of the same query without performance penalty.

### Advanced

#### Reactive Query events

Queries emit events when entities are added or removed.

These events will be emitted after internal structures are updated to reflect the change, but before components are removed from the entity object.

```ts
const query = world.query((e) => e.has("position"));

const handler = (entity: Entity) => {
  // ...
};

query.onEntityAdded.add(handler);
query.onEntityAdded.remove(handler);

query.onEntityRemoved.add(handler);
query.onEntityRemoved.remove(handler);
```

### 🧠 Systems

Arancini has built-in support for systems, but there is nothing special about them. You can write your own "System" logic if you prefer. Arancini Systems just offer a convenient way of organising logic.

```ts
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
    // called when the world is initialised,
    // or when the system is registered in an initialised world
  }

  onDestroy() {
    // called when the world is destroyed or the system is unregistered
  }
}

// Register the system
world.registerSystem(ExampleSystem);

// Use `world.step()` to run all registered systems
world.step(1 / 60);
```

#### System Execution Order

Systems can be registered with a priority. The order systems run in is first determined by priority, then by the order systems were registered.

```ts
const priority = 10;
world.registerSystem(MovementSystem, priority);
```

### Advanced

#### Registering components after creating the world

Components must be registered with the world before they can be used. You can register components after the world is initialised with `world.registerComponents`, but doing so will cause a small performance hit as internal data structures need to be updated.

#### Required system queries

System queries can be marked as 'required', meaning that the system will only be updated if the query has at least one result.

```ts
class ExampleSystem extends System {
  requiredQuery = this.query((q) => q.has("position"), { required: true });

  onUpdate() {
    const { x, y } = this.requiredQuery.first;
  }
}
```

#### System Singleton Queries

Singleton components queries can be defined for cases where systems need to access shared data, like a camera or player component.

The `singleton` method creates a query for a single component, and sets the property on the system to the given component from the first matching entity.

```ts
class ExampleSystem extends System {
  player = this.singleton("player", { required: true });

  onUpdate() {
    console.log(player);
  }
}
```

> **Note:** Singleton components must be defined on a top-level property of the system. The property must not be a ES2022 private field (prefixed with `#`).

#### Attaching systems to other systems

Systems can be attached to other systems with this.attach. This is useful for sharing logic or system state that doesn't belong in a component.

```ts
class ExampleSystem extends System {
  otherSystem = this.attach(OtherSystem);

  onUpdate() {
    this.otherSystem.foo();
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
