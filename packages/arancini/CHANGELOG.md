# arancini

## 6.1.2

### Patch Changes

- 695116f: fix: correctly dedupe queries for unregistered components
- Updated dependencies [695116f]
  - @arancini/core@6.1.2
  - @arancini/react@6.1.2
  - @arancini/systems@6.1.2
  - @arancini/events@6.1.2

## 6.1.1

### Patch Changes

- 42a87c8: fix: register unregistered components on creating a query
- Updated dependencies [42a87c8]
  - @arancini/core@6.1.1
  - @arancini/react@6.1.1
  - @arancini/systems@6.1.1
  - @arancini/events@6.1.1

## 6.1.0

### Minor Changes

- 66e0529: feat: remove requirement to register components before using them

### Patch Changes

- Updated dependencies [66e0529]
  - @arancini/core@6.1.0
  - @arancini/react@6.1.0
  - @arancini/systems@6.1.0
  - @arancini/events@6.1.0

## 6.0.4

### Patch Changes

- 5580370: feat: early return on attempting to create an entity that already exists in the world
- Updated dependencies [5580370]
  - @arancini/core@6.0.4
  - @arancini/react@6.0.4
  - @arancini/systems@6.0.4
  - @arancini/events@6.0.4

## 6.0.3

### Patch Changes

- c69e2c6: fix: noop on trying to destroy an entity that isn't in the world
- Updated dependencies [c69e2c6]
  - @arancini/react@6.0.3
  - @arancini/core@6.0.3
  - @arancini/systems@6.0.3
  - @arancini/events@6.0.3

## 6.0.2

### Patch Changes

- 445c58a: feat: minor refactors addressing eslint issues
- 445c58a: feat: minor non-breaking type changes addressing eslint issues
- Updated dependencies [445c58a]
- Updated dependencies [445c58a]
  - @arancini/core@6.0.2
  - @arancini/systems@6.0.2
  - @arancini/react@6.0.2
  - @arancini/events@6.0.2

## 6.0.1

### Patch Changes

- 9612733: refactor(react): internal useContainers hook cleanup
- Updated dependencies [9612733]
  - @arancini/react@6.0.1
  - @arancini/core@6.0.1
  - @arancini/events@6.0.1
  - @arancini/systems@6.0.1

## 6.0.0

### Major Changes

- 840b2e5: feat(react)!: remove "where" prop from `<Entities />`

  It was previously possible to pass a query description to `<Entities />`. This is no longer supported. Instead, you must create a query instance and pass that to `<Entities />`.

  Before:

  ```tsx
  const Example = () => (
    <Entities where={(e) => e.has("position", "velocity")}>
      {/* ... */}
    </Entities>
  );
  ```

  After:

  ```tsx
  const query = world.query((e) => e.has("position", "velocity"));

  const Example = () => <Entities where={query}>{/* ... */}</Entities>;
  ```

- 840b2e5: feat(react)!: `useQuery` now only supports query instances

  It was previously possible to pass a query description to `useQuery`. This is no longer supported. Instead, you must create a query instance and pass that to `useQuery`.

  Before:

  ```ts
  const Example = () => {
    const entities = useQuery((e) => e.has("position", "velocity"));

    // ...
  };
  ```

  After:

  ```ts
  const query = world.query((e) => e.has("position", "velocity"));

  const Example = () => {
    const entities = useQuery(query);

    // ...
  };
  ```

### Patch Changes

- Updated dependencies [840b2e5]
- Updated dependencies [840b2e5]
  - @arancini/react@6.0.0
  - @arancini/core@6.0.0
  - @arancini/events@6.0.0
  - @arancini/systems@6.0.0

## 5.0.2

### Patch Changes

- 14b82a9: fix(systems): executor query cleanup
- Updated dependencies [14b82a9]
  - @arancini/systems@5.0.2
  - @arancini/core@5.0.2
  - @arancini/events@5.0.2
  - @arancini/react@5.0.2

## 5.0.1

### Patch Changes

- 31b8e1c: fix: query usage tracking
- 31b8e1c: fix: system singleton queries not being destroyed on removing a system from an executor
- 31b8e1c: feat: change `owner` arguments to `handle`, align `destroyQuery` second argument with `query`
- Updated dependencies [31b8e1c]
- Updated dependencies [31b8e1c]
- Updated dependencies [31b8e1c]
  - @arancini/core@5.0.1
  - @arancini/systems@5.0.1
  - @arancini/react@5.0.1
  - @arancini/events@5.0.1

## 5.0.0

### Major Changes

- 89ce0e9: feat: move Systems functionality out of @arancini/core, into @arancini/systems

  Systems are no longer part of the core functionality of arancini, and are now a separate package `@arancini/systems`.

  This makes arancini much better for users who BYO systems.

  This is a breaking change, but updating is straightforward.

  **Migrating**:

  In arancini v4, you would create a world, register systems, and then call `world.step` to run systems.

  ```ts
  import { World, System } from "arancini";

  class ExampleSystem extends System {}

  const world = new World({
    components: [
      /* ... */
    ],
  });

  world.registerSystem(ExampleSystem);

  world.init();

  world.step(1 / 60);
  ```

  In arancini v5, you create a world, create an executor, add systems to the executor, and then call `executor.update` to run systems.

  ```ts
  import { World } from "arancini";
  import { Executor, System } from "arancini/systems";

  class ExampleSystem extends System {}

  const world = new World({
    components: [
      /* ... */
    ],
  });

  const executor = new Executor(world);

  executor.add(ExampleSystem);

  executor.init();

  executor.update(1 / 60);
  ```

- 89ce0e9: feat: move eventing utilities into `@arancini/events`

  If you use `Topic` from `arancini`, you should now import it from `@arancini/events` instead.

- 89ce0e9: feat: move object pooling utilities into `@arancini/pool`

  If you use `ObjectPool` from `arancini`, you should now import it from `@arancini/pool` instead.

- 89ce0e9: feat: remove `world.init()`, worlds no longer need to be initialized before use

### Patch Changes

- Updated dependencies [89ce0e9]
  - @arancini/events@5.0.0
  - @arancini/core@5.0.0
  - @arancini/react@5.0.0
  - @arancini/systems@5.0.0

## 4.2.0

### Minor Changes

- 45ef120: feat: move bundles to dist, add note to readme regarding using entrypoints with typescript

### Patch Changes

- @arancini/core@4.2.0
- @arancini/react@4.2.0

## 4.1.3

### Patch Changes

- fcd47a1: feat: refactor entity metadata logic to minimise property lookups
- fcd47a1: feat: don't reindex entities on destroying them, just remove from all queries
- Updated dependencies [fcd47a1]
- Updated dependencies [fcd47a1]
  - @arancini/core@4.1.3
  - @arancini/react@4.1.3

## 4.1.2

### Patch Changes

- c1b67ea: feat: minor refactor, jsdoc fix
- 2730c0e: fix(BitSet): reduce initial bitset words array size
- Updated dependencies [c1b67ea]
- Updated dependencies [2730c0e]
  - @arancini/core@4.1.2
  - @arancini/react@4.1.2

## 4.1.1

### Patch Changes

- Updated dependencies [9271e1d]
  - @arancini/core@4.1.1
  - @arancini/react@4.1.1

## 4.1.0

### Patch Changes

- 89d5442: refactor: entity metadata
- Updated dependencies [5ec01eb]
- Updated dependencies [89d5442]
- Updated dependencies [ba10ed9]
- Updated dependencies [5ec01eb]
- Updated dependencies [ba10ed9]
- Updated dependencies [ba10ed9]
  - @arancini/react@4.1.0
  - @arancini/core@4.1.0

## 4.0.2

### Patch Changes

- ce979c5: feat: add 'Strict' utility type that removes optional properties
- Updated dependencies [ce979c5]
  - @arancini/core@4.0.2
  - @arancini/react@4.0.2

## 4.0.1

### Patch Changes

- Updated dependencies [84657c6]
  - @arancini/react@4.0.1
  - @arancini/core@4.0.1

## 4.0.0

### Major Changes

- 324ecc1: Arancini v4 is a near-complete rewrite.

  Entities are now regular objects, and components are properties of entity objects.

### Patch Changes

- Updated dependencies [324ecc1]
  - @arancini/react@4.0.0
  - @arancini/core@4.0.0

## 3.2.0

### Minor Changes

- 695e4bb: feat: rename world.destroy() to world.reset(), add world.destroy(entity: Entity)
- 695e4bb: feat: refactor query manager
- 695e4bb: feat: world.entities is now a list, was a map
- 695e4bb: feat: class components are no longer object pooled by default, they must opted in with the `@objectPooled` annotation, or by setting the `objectPooled` property on the component definition

  ```ts
  @objectPooled()
  class MyComponent extends Component {
    /* ... */
  }

  // or

  class MyComponent extends Component {
    /* ... */
  }
  MyComponent.objectPooled = true;
  ```

### Patch Changes

- Updated dependencies [695e4bb]
- Updated dependencies [695e4bb]
- Updated dependencies [695e4bb]
- Updated dependencies [695e4bb]
- Updated dependencies [695e4bb]
- Updated dependencies [695e4bb]
  - @arancini/core@3.2.0
  - @arancini/react@3.2.0

## 3.1.1

### Patch Changes

- Updated dependencies [3c18e5e]
  - @arancini/core@3.1.1
  - @arancini/react@3.1.1

## 3.1.0

### Patch Changes

- Updated dependencies [e19b6a3]
  - @arancini/react@3.1.0
  - @arancini/core@3.1.0

## 3.0.0

### Major Changes

- 4b4891b: feat: remove Spaces

  Spaces were not useful in practise, removing to simplify the API.

- 4b4891b: feat: change `world.create.entity()` to `world.create()`
- 4b4891b: drop support for cjs, output esm only
- 4b4891b: feat: change `world.query()` to `world.find()` for getting once-off results, change `world.create.query()` to `world.query()`
- 3a33332: feat: add new component types, object components and tag components

### Minor Changes

- 4b4891b: feat: add `entity.bulk()` api for adding and removing components in a single operation

### Patch Changes

- Updated dependencies [4b4891b]
- Updated dependencies [4b4891b]
- Updated dependencies [4b4891b]
- Updated dependencies [4b4891b]
- Updated dependencies [3a33332]
- Updated dependencies [4b4891b]
  - @arancini/react@3.0.0
  - @arancini/core@3.0.0

## 2.3.0

### Minor Changes

- 2051329: feat: retain registered systems on destroying a world

### Patch Changes

- 2051329: fix: don't remove the default space from the world when destroying it
- Updated dependencies [2051329]
- Updated dependencies [2051329]
  - @arancini/core@2.3.0
  - @arancini/react@2.3.0

## 2.2.2

### Patch Changes

- 8224bf2: fix: remove `"type": "module"` from package.json
- Updated dependencies [8224bf2]
  - @arancini/react@2.2.2
  - @arancini/core@2.2.2

## 2.2.1

### Patch Changes

- Updated dependencies [a2d975e]
- Updated dependencies [e884984]
- Updated dependencies [04234c0]
  - @arancini/core@2.2.1
  - @arancini/react@2.2.1

## 2.2.0

### Minor Changes

- d2fce8c: feat: add 'arancini/react' entrypoint to 'arancini' package

  You can now either:

  - Install only the desired packages scoped under `@arancini/*`
  - Or use the umbrella `arancini` package, which provides additional entrypoints for non-core packages

### Patch Changes

- @arancini/core@2.2.0
- @arancini/react@2.2.0

## 2.1.0

### Patch Changes

- Updated dependencies [e427b6d]
  - @arancini/core@2.1.0

## 2.0.0

### Patch Changes

- Updated dependencies [52bb1e5]
- Updated dependencies [4169199]
- Updated dependencies [807443d]
- Updated dependencies [39d3641]
  - @arancini/core@2.0.0

## 1.1.0

### Patch Changes

- Updated dependencies [e41b313]
  - @arancini/core@1.1.0

## 1.0.1

### Patch Changes

- Updated dependencies [533082d]
- Updated dependencies [f447622]
  - @arancini/core@1.0.1

## 1.0.0

### Patch Changes

- 22faae1: Add "Getting Started" section to README.md
- e7af3a8: Add description and keywords to package.json
- Updated dependencies [8b7d9c6]
- Updated dependencies [9a3d50a]
- Updated dependencies [b82c03f]
- Updated dependencies [b82c03f]
- Updated dependencies [0e2acf4]
- Updated dependencies [22faae1]
- Updated dependencies [e7af3a8]
  - @arancini/core@1.0.0

## 0.1.1

### Patch Changes

- Updated dependencies [afcd3c0]
  - @arancini/core@0.1.1
