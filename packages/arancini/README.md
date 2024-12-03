![cover](https://raw.githubusercontent.com/isaac-mason/arancini/main/packages/arancini/cover.png)

[![Version](https://img.shields.io/npm/v/arancini?style=for-the-badge)](https://www.npmjs.com/package/arancini)
![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/isaac-mason/arancini/release.yml?style=for-the-badge)
[![Downloads](https://img.shields.io/npm/dt/arancini.svg?style=for-the-badge)](https://www.npmjs.com/package/arancini)
[![Bundle Size](https://img.shields.io/bundlephobia/min/arancini?style=for-the-badge&label=bundle%20size)](https://bundlephobia.com/result?p=arancini)

# arancini

An entity manager for JavaScript.

```
> npm i arancini
```

- 👾 ‎ Manage game or simulation entities
- 🛹 ‎ Strikes a balance between ease of use and performance
- 🍱 ‎ Entities are regular objects, components are properties on objects
- 🧩 ‎ Framework agnostic, plug arancini into anything
- 💙 ‎ TypeScript friendly
- ⚛️ ‎ [Easy integration with React](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react)

## Introduction

Arancini is an entity manager for JavaScript that helps you write data-oriented code for games, simulations, and other applications.

Arancini has a few key features/differentiators:
- Entities are regular objects, and components are properties on objects.
- Queries update reactively as components are added and removed from entities.
- The core library has no concept of "Systems", it's easy to plug arancini into your existing gameloop.
- Strong TypeScript support for queries

## Overview

### 🌎 Creating a World

A world is a container for entities. It provides methods for managing entities, and methods for querying entities based on their components.

```ts
import { World } from "arancini";

// (optional) define a type for entities in the world
type Entity = {
  position?: { x: number; y: number };
  health?: number;
  velocity?: { x: number; y: number };
  inventory?: { items: string[] };
};

const world = new World<Entity>();
```

### 🍱 Creating Entities

You can use `world.create` to create an entity from any object.

```ts
const playerEntity = { position: { x: 0, y: 0 } };

world.create(playerEntity);
```

### 📦 Adding and Removing Components

To add and remove components from an entity, you can use `world.add`, `world.remove`.

```ts
/* add a component */
world.add(playerEntity, "health", 100);

/* remove a component */
world.remove(playerEntity, "health");
```

You can also use `world.update` to add and remove multiple components at once.

```ts
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

> **Warning:** Avoid adding/removing properties without using `world.add`, `world.remove`, or `world.update`. These methods ensure that queries are updated correctly.

### 🔎 Querying Entities

You can query entities based on their components with `world.query`. Queries are reactive, they will update as components are added and removed from components.

```ts
const monsters = world.query((e) => e.all("health", "position", "velocity"));
```

> **Note:** Arancini dedupes queries with the same conditions, so you can create multiple of the same query without performance penalty!

### 🧠 Iterating over Query results

You can use a `for...of` loop to iterate over queries in reverse order. This prevents problems that can occur when removing entities from queries within a loop.

```ts
const moving = world.query((e) => e.all("position", "velocity"));

const alive = world.query((e) => e.all("health"));

const movementSystem = () => {
  for (const entity of moving) {
    const position = entity.position;
    const velocity = entity.velocity;

    position.x += velocity.x;
    position.y += velocity.y;
  }
};

const healthSystem = () => {
  for (const entity of alive) {
    if (entity.health <= 0) {
      world.destroy(entity);
    }
  }
};
```

You can also use `query.entities` directly.

```ts
const moving = world.query((e) => e.all("position", "velocity"));

console.log(moving.entities); // [...]
```

### ⍰ Query Conditions

Query functions support `all`, `any`, and `none` conditions. The query builder also has some no-op grammar and aliases to make queries easier to read.

```ts
const monsters = world.query((e) =>
  e.all("health", "position").any("skeleton", "zombie").none("dead"),
);

const monsters = world.query((entities) =>
  entities
    .with("health", "position")
    .and.any("skeleton", "zombie")
    .but.not("dead"),
);
```

### 🗑 Destroying Entities

`world.destroy` removes an entity from the world and from all queries.

```ts
world.destroy(playerEntity);
```

Destroying an entity doesn't remove any properties from the entity object.


### 📡 Query Events

Queries emit events when entities are added or removed.

```ts
const query = world.query((e) => e.has("position"));

query.onEntityAdded.add((entity) => {
  console.log("added!", entity);
});

query.onEntityRemoved.add((entity) => {
  console.log("removed!", entity);
});
```

### 🔦 Ad-hoc Queries

You can use `world.filter` and `world.find` to get ad-hoc query results.

```ts
const monsters = world.filter((e) => e.has("health", "position", "velocity"));

const player = world.find((e) => e.has("player"));
```

This is useful for cases where you want to get results infrequently, without the cost of evaluating a reactive query as the world changes.

If there is an existing query with the same conditions, the query results will be reused.

### 🧠 Systems

The core library (`@arancini/core`) does not have a built-in concept of systems.

A "System" can be anything that operates on the world. You can write simple functions and call them however you like, e.g. inside setInterval, requestAnimationFrame, or in your existing game loop.

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
import { World } from "arancini";
import { createReactAPI } from "arancini/react";
```

### [**`@arancini/core`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-core)

[![Version](https://img.shields.io/npm/v/arancini)](https://www.npmjs.com/package/@arancini/core)

The core library!

```bash
> npm install @arancini/core
```

```ts
import { World } from "@arancini/core";
```

### [**`@arancini/react`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react)

[![Version](https://img.shields.io/npm/v/@arancini/react)](https://www.npmjs.com/package/@arancini/react)

React glue for arancini.

See the [**@arancini/react README**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react) for docs.

```bash
> npm install @arancini/react
```

```ts
import { createReactAPI } from "@arancini/react";
```
