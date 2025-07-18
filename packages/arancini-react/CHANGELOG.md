# @arancini/react

## 8.1.0

### Minor Changes

- 075cc1a: feat: bump react peer dependency from v18 to v19

### Patch Changes

- Updated dependencies [67284b2]
  - @arancini/core@8.1.0

## 8.0.0

### Patch Changes

- @arancini/core@8.0.0

## 7.0.0

### Patch Changes

- 0f7f882: feat: remove terser, ship readable javascript to npm
- Updated dependencies [0f7f882]
  - @arancini/core@7.0.0

## 6.6.1

### Patch Changes

- 1d7fa8c: fix: don't include react/jsx-runtime in bundle
- 6c28156: fix: add babel preset @babel/preset-react
  - @arancini/core@6.6.1

## 6.6.0

### Minor Changes

- d82e4aa: feat: bundle with babel

### Patch Changes

- Updated dependencies [d82e4aa]
  - @arancini/core@6.6.0

## 6.5.0

### Minor Changes

- 68cb2b8: feat: throw meaningful errors when using hooks and components outside of required contexts

### Patch Changes

- 68cb2b8: feat: improve performance by removing a state update and rerender when initially adding components
- Updated dependencies [68cb2b8]
- Updated dependencies [68cb2b8]
- Updated dependencies [68cb2b8]
- Updated dependencies [68cb2b8]
- Updated dependencies [68cb2b8]
  - @arancini/core@6.5.0

## 6.4.0

### Patch Changes

- Updated dependencies [b51f3be]
- Updated dependencies [b51f3be]
- Updated dependencies [b51f3be]
  - @arancini/core@6.4.0

## 6.3.2

### Patch Changes

- 48ae471: fix: unexpected behaviours when adding components via Entity props and imperatively
- 501f7e2: fix: default to 'true' instead of 'undefined' for Component react api when 'value' prop is not provided
  - @arancini/core@6.3.2

## 6.3.1

### Patch Changes

- Updated dependencies [56437fc]
  - @arancini/core@6.3.1

## 6.3.0

### Patch Changes

- Updated dependencies [a31e200]
- Updated dependencies [a31e200]
  - @arancini/core@6.3.0

## 6.2.0

### Patch Changes

- Updated dependencies [9096041]
- Updated dependencies [9096041]
  - @arancini/core@6.2.0

## 6.1.3

### Patch Changes

- Updated dependencies [d252eee]
  - @arancini/core@6.1.3

## 6.1.2

### Patch Changes

- Updated dependencies [695116f]
  - @arancini/core@6.1.2

## 6.1.1

### Patch Changes

- Updated dependencies [42a87c8]
  - @arancini/core@6.1.1

## 6.1.0

### Patch Changes

- Updated dependencies [66e0529]
  - @arancini/core@6.1.0

## 6.0.4

### Patch Changes

- Updated dependencies [5580370]
  - @arancini/core@6.0.4

## 6.0.3

### Patch Changes

- c69e2c6: fix: noop on trying to destroy an entity that isn't in the world
- Updated dependencies [c69e2c6]
  - @arancini/core@6.0.3

## 6.0.2

### Patch Changes

- Updated dependencies [445c58a]
- Updated dependencies [445c58a]
  - @arancini/core@6.0.2

## 6.0.1

### Patch Changes

- 9612733: refactor(react): internal useContainers hook cleanup
  - @arancini/core@6.0.1

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

- @arancini/core@6.0.0

## 5.0.2

### Patch Changes

- @arancini/core@5.0.2

## 5.0.1

### Patch Changes

- Updated dependencies [31b8e1c]
- Updated dependencies [31b8e1c]
  - @arancini/core@5.0.1

## 5.0.0

### Patch Changes

- @arancini/core@5.0.0

## 4.2.0

### Patch Changes

- @arancini/core@4.2.0

## 4.1.3

### Patch Changes

- Updated dependencies [fcd47a1]
- Updated dependencies [fcd47a1]
  - @arancini/core@4.1.3

## 4.1.2

### Patch Changes

- Updated dependencies [c1b67ea]
- Updated dependencies [2730c0e]
  - @arancini/core@4.1.2

## 4.1.1

### Patch Changes

- Updated dependencies [9271e1d]
  - @arancini/core@4.1.1

## 4.1.0

### Minor Changes

- 5ec01eb: feat: rename createECS to createReactAPI
- ba10ed9: feat: remove QueryEntities, add 'where' prop to Entities that takes a query description
- 5ec01eb: feat(Component): rename 'data' prop to 'value'
- ba10ed9: feat: support passing useQuery and Entities a query instance

### Patch Changes

- Updated dependencies [89d5442]
- Updated dependencies [ba10ed9]
  - @arancini/core@4.1.0

## 4.0.2

### Patch Changes

- Updated dependencies [ce979c5]
  - @arancini/core@4.0.2

## 4.0.1

### Patch Changes

- 84657c6: fix: Entity and Component return types
  - @arancini/core@4.0.1

## 4.0.0

### Major Changes

- 324ecc1: Arancini v4 is a near-complete rewrite.

  Entities are now regular objects, and components are properties of entity objects.

### Patch Changes

- Updated dependencies [324ecc1]
  - @arancini/core@4.0.0

## 3.2.0

### Patch Changes

- 695e4bb: feat: export createECS return type, 'ECS'
- 695e4bb: feat: refactor useQuery component
- Updated dependencies [695e4bb]
- Updated dependencies [695e4bb]
- Updated dependencies [695e4bb]
- Updated dependencies [695e4bb]
  - @arancini/core@3.2.0

## 3.1.1

### Patch Changes

- Updated dependencies [3c18e5e]
  - @arancini/core@3.1.1

## 3.1.0

### Minor Changes

- e19b6a3: fix: don't init the World in createECS

### Patch Changes

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
  - @arancini/core@3.0.0

## 2.3.0

### Patch Changes

- Updated dependencies [2051329]
- Updated dependencies [2051329]
  - @arancini/core@2.3.0

## 2.2.2

### Patch Changes

- 8224bf2: fix: remove `"type": "module"` from package.json
- Updated dependencies [8224bf2]
  - @arancini/core@2.2.2

## 2.2.1

### Patch Changes

- Updated dependencies [a2d975e]
- Updated dependencies [e884984]
- Updated dependencies [04234c0]
  - @arancini/core@2.2.1

## 2.2.0

### Patch Changes

- @arancini/core@2.2.0

## 2.0.1

### Patch Changes

- a9ede4a: feat: recreate components on ref updates
- a9ede4a: fix: only recreate components when one of the args values or references have changed
- 330bc6a: fix: remove incorrect information regarding auto-registering components from README.md

## 2.0.0

### Minor Changes

- e44f646: remove 'System' component
- 39d3641: remove support for createECS without providing a World
- ee2b197: add ref support to '<Entity />'
- 39d3641: remove <System /> component

### Patch Changes

- 40e324f: refactor: replace 'as any' with 'as unknown as <type>'
- Updated dependencies [52bb1e5]
- Updated dependencies [4169199]
- Updated dependencies [807443d]
- Updated dependencies [39d3641]
  - @arancini/core@2.0.0

## 1.0.1

### Patch Changes

- dd76cca: Change `useCurrentEntity` to return the current entity instead of the entity context value
- Updated dependencies [533082d]
- Updated dependencies [f447622]
  - @arancini/core@1.0.1

## 1.0.0

### Minor Changes

- 9a3d50a: Add support for passing a query instance to `useQuery` and `<QueryEntities />`
- cf55aa6: Rename 'step' to 'update'

### Patch Changes

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

- afcd3c0: Update README.md
- Updated dependencies [afcd3c0]
  - @arancini/core@0.1.1
  - arancini@0.1.1

## 0.1.0

### Minor Changes

- rename to @arancini/react!

## 0.0.14

### Patch Changes

- 966c895: fix react strict mode
- 966c895: Add useCurrentEntity and useCurrentSpace hooks
- 4890772: Remove `useWorld` hook, `createECS` already returns the recs World
- 966c895: Add Entities component that renders a list of entities
- 966c895: Add QueryEntities component that renders all entities of a given archetype
- 966c895: feat(Component): capture child ref as component args if present
- 82f6cef: fix usage of EventDispatcher
- c517eb7: fix(@recs/react) fallback to useEffect on server
- 1e984a1: reorganise hooks
- 966c895: Remove <World> component and world context
- Updated dependencies [abdb3b6]
- Updated dependencies [1e984a1]
- Updated dependencies [f1f9fe5]
- Updated dependencies [32c30ed]
- Updated dependencies [f1f9fe5]
- Updated dependencies [abdb3b6]
- Updated dependencies [abdb3b6]
  - @recs/core@0.0.12

## 0.0.13

### Patch Changes

- Updated dependencies [ef5036a]
- Updated dependencies [d2cdfdb]
- Updated dependencies [ef5036a]
  - @recs/core@0.0.11

## 0.0.12

### Patch Changes

- fec263a: Rename createWorld function to createECS
- fec263a: Add optional parameter to createECS for providing an existing recs world
- Updated dependencies [091bcfd]
- Updated dependencies [c0878a6]
- Updated dependencies [49cd9b6]
- Updated dependencies [e31bd7d]
- Updated dependencies [e31bd7d]
- Updated dependencies [c0878a6]
  - @recs/core@0.0.10

## 0.0.11

### Patch Changes

- d383b35: Return the world in createWorld for imperative use

## 0.0.10

### Patch Changes

- Updated dependencies [cc22515]
  - @recs/core@0.0.9

## 0.0.9

### Patch Changes

- 7777be9: Rename System `system` prop to `type`
- Updated dependencies [acd1993]
  - @recs/core@0.0.8

## 0.0.8

### Patch Changes

- Updated dependencies [4a48358]
- Updated dependencies [4a48358]
  - @recs/core@0.0.7

## 0.0.7

### Patch Changes

- 2e4892e: Check if entity is alive before removing component in `Component`
- Updated dependencies [2e4892e]
- Updated dependencies [2e4892e]
- Updated dependencies [2e4892e]
  - @recs/core@0.0.6

## 0.0.6

### Patch Changes

- c8964f9: Update build config - remove @react-three/fiber, make @recs/core external

## 0.0.5

### Patch Changes

- Updated dependencies [883314e]
  - @recs/core@0.0.5

## 0.0.4

### Patch Changes

- 0be0265: Fix incorrect handling of Space, Entity and Component lifecycle
- 84bde0d: Remove rerender argument from useQuery, always rerender on Query changes
- d8c1325: Add ref support to Space and System components
- 3348c4b: Update useQuery hook to clear query instance events after rerenders
- d3e4ae0: Update react glue to support useQuery with @recs/core changing to updating queries as entities change
- f2dc1a9: Add "type": "module" to package.json
- Updated dependencies [edc4eed]
- Updated dependencies [c43e8b2]
- Updated dependencies [f2dc1a9]
- Updated dependencies [4b39c94]
- Updated dependencies [d3e4ae0]
- Updated dependencies [4b39c94]
- Updated dependencies [d8c1325]
- Updated dependencies [edc4eed]
- Updated dependencies [d3e4ae0]
- Updated dependencies [2fb022f]
- Updated dependencies [94241cd]
- Updated dependencies [066a95e]
- Updated dependencies [f2dc1a9]
- Updated dependencies [f2dc1a9]
- Updated dependencies [f2dc1a9]
- Updated dependencies [1674f80]
- Updated dependencies [4b39c94]
- Updated dependencies [3348c4b]
- Updated dependencies [84bde0d]
  - @recs/core@0.0.4

## 0.0.3

### Patch Changes

- 4970db1: Refactor imports, remove unused World prop
- Updated dependencies [f9eb1a5]
- Updated dependencies [6c4f48b]
  - @recs/core@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [ece6726]
  - @recs/core@0.0.2

## 0.0.1

### Patch Changes

- Initial release
- Updated dependencies
  - @recs/core@0.0.1
