# @arancini/core

## 6.0.4

### Patch Changes

- 5580370: feat: early return on attempting to create an entity that already exists in the world
  - @arancini/events@6.0.4
  - @arancini/pool@6.0.4

## 6.0.3

### Patch Changes

- c69e2c6: fix: noop on trying to destroy an entity that isn't in the world
  - @arancini/events@6.0.3
  - @arancini/pool@6.0.3

## 6.0.2

### Patch Changes

- 445c58a: feat: minor refactors addressing eslint issues
- 445c58a: feat: minor non-breaking type changes addressing eslint issues
  - @arancini/events@6.0.2
  - @arancini/pool@6.0.2

## 6.0.1

### Patch Changes

- @arancini/events@6.0.1
- @arancini/pool@6.0.1

## 6.0.0

### Patch Changes

- @arancini/events@6.0.0
- @arancini/pool@6.0.0

## 5.0.2

### Patch Changes

- @arancini/events@5.0.2
- @arancini/pool@5.0.2

## 5.0.1

### Patch Changes

- 31b8e1c: fix: query usage tracking
- 31b8e1c: feat: change `owner` arguments to `handle`, align `destroyQuery` second argument with `query`
  - @arancini/events@5.0.1
  - @arancini/pool@5.0.1

## 5.0.0

### Patch Changes

- Updated dependencies [89ce0e9]
- Updated dependencies [89ce0e9]
  - @arancini/events@5.0.0
  - @arancini/pool@5.0.0

## 4.2.0

## 4.1.3

### Patch Changes

- fcd47a1: feat: refactor entity metadata logic to minimise property lookups
- fcd47a1: feat: don't reindex entities on destroying them, just remove from all queries

## 4.1.2

### Patch Changes

- c1b67ea: feat: minor refactor, jsdoc fix
- 2730c0e: fix(BitSet): reduce initial bitset words array size

## 4.1.1

### Patch Changes

- 9271e1d: feat: move entity metadata object pool to World property

## 4.1.0

### Patch Changes

- 89d5442: refactor: entity metadata
- ba10ed9: feat: export EntityContainer

## 4.0.2

### Patch Changes

- ce979c5: feat: add 'Strict' utility type that removes optional properties

## 4.0.1

## 4.0.0

### Major Changes

- 324ecc1: Arancini v4 is a near-complete rewrite.

  Entities are now regular objects, and components are properties of entity objects.

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

## 3.1.1

### Patch Changes

- 3c18e5e: feat(System): jsdoc improvement

## 3.1.0

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

## 2.3.0

### Minor Changes

- 2051329: feat: retain registered systems on destroying a world

### Patch Changes

- 2051329: fix: don't remove the default space from the world when destroying it

## 2.2.2

### Patch Changes

- 8224bf2: fix: remove `"type": "module"` from package.json

## 2.2.1

### Patch Changes

- a2d975e: fix(World): jsdoc code example
- e884984: feat(System): add support for retrieving singleton components

  Adds a protected method `singleton` to the System class, which creates a query for a single component, and sets the property on the system to the given component from the first matching entity.

  ```ts
  class ExampleSystem extends System {
    settings = this.singleton(SettingsComponent);

    // ...
  }
  ```

- 04234c0: feat: add support for manually growing and shrinking object pools

## 2.2.0

## 2.1.0

### Minor Changes

- e427b6d: feat(System): required queries that must have results for the system to update

## 2.0.0

### Major Changes

- 39d3641: remove events from World, Space, Entity

### Minor Changes

- 52bb1e5: feat: reset entities on request, not on destroy
- 4169199: feat: change query onEntityAdded and onEntityRemoved '.add()' to return unsubscribe function

### Patch Changes

- 807443d: fix: noop when destroying a non-active space or entity

## 1.1.0

### Minor Changes

- e41b313: feat(Component): remove 'world' and 'space' getters

## 1.0.1

### Patch Changes

- 533082d: Use generic for topic name type when registering a handler with `.on(...)`
- f447622: Change 'create' factories from getters to properties

## 1.0.0

### Minor Changes

- 9a3d50a: Improve performance of `entity.get()`
- b82c03f: Remove Entity 'alive' property
- 0e2acf4: Query iterator iterates over matching entities in reverse order

### Patch Changes

- 8b7d9c6: refactor: rename SpaceManager 'remove' methods for entities and spaces to 'destroy'
- b82c03f: Recycle entities and components immediately instead of on world step
- 22faae1: Add "Getting Started" section to README.md
- e7af3a8: Add description and keywords to package.json

## 0.1.1

### Patch Changes

- afcd3c0: Update README.md

## 0.1.0

### Minor Changes

- rename to @arancini/core!

## 0.0.12

### Patch Changes

- abdb3b6: refactor object pools
- 1e984a1: on entity destruction, clear entity `space` and set `initialised` to false
- f1f9fe5: use `import type`
- 32c30ed: Throw an error when adding a component to an entity that already has the component
- f1f9fe5: kill `world.builder.entity`, add optional `components` argument to `world.create.entity`
- abdb3b6: rename EventSystem `removeHandler` to `unsubscribe`
- abdb3b6: rename EventDispatcher `subscribe` and `unsubscribe` methods to `add` and `remove`

## 0.0.11

### Patch Changes

- ef5036a: Rename Query 'all' array to 'entities'
- d2cdfdb: Remove Component 'onUpdate' method. If this is desired, it can be implemented in user-land with a System that calls a method on a Component.
- ef5036a: Remove Query 'added' and 'removed' arrays, add onEntityAdded and onEntityRemoved event dispatchers

## 0.0.10

### Patch Changes

- 091bcfd: Remove redundant `id` property from System class
- c0878a6: fix: don't call System `onUpdate` after unregistering a System
- 49cd9b6: Simplify System query creation, add world as System constructor argument
- e31bd7d: Refactor `QueryManager` `onEntityComponentChange` method
- e31bd7d: Improve jsdoc for `Query` `clearEvents` method
- c0878a6: Don't re-sort system update order before the world has been initialised

## 0.0.9

### Patch Changes

- cc22515: Initialise spaces before systems

## 0.0.8

### Patch Changes

- acd1993: Minor refactor of SpaceManager, Entity, Space classes

## 0.0.7

### Patch Changes

- 4a48358: Rename `entity.addComponent` to `entity.add`, `entity.removeComponent` to `entity.remove`
- 4a48358: fix: rename `space.build` to `space.builder`, consistent with `world.builder`

## 0.0.6

### Patch Changes

- 2e4892e: Recycle entities and components at the end of an update instead of at the beginning
- 2e4892e: fix: entities not getting removed from query entitySet on destroy
- 2e4892e: Set entity.alive to false on destroy before removing components

## 0.0.5

### Patch Changes

- 883314e: Rename `world.build` to `world.builder`

## 0.0.4

### Patch Changes

- edc4eed: Use BitSets for evaluating queries, evaluate entity and component changes immediately
- c43e8b2: Seperate out World `remove` into `removeQuery` and `removeSpace`
- f2dc1a9: Small refactor of QueryManager
- 4b39c94: Change creation of persistent Queries from `world.query(...)` to `world.create.query(...)`
- 4b39c94: Change fetching of once-off query results from `world.queryOnce(...)` to `world.query(...)`
- d3e4ae0: Add support for optionally defining System priority, changes System execution order if set, otherwise defaults to registration order
- d8c1325: Add generic and use in return type for World `getSystem`
- edc4eed: Rename 'one' query condition to 'any'
- d3e4ae0: Change how Systems are added/registered to a World, System class is provided instead of instance
- 2fb022f: Always destroy Entities and Components immediately
- 94241cd: Remove 'removeSpace', 'removeQuery' World methods
- 066a95e: Throw error on creating a space with an existing Space's id
- f2dc1a9: Add 'set' property to Query, which is a set of entities currently matched by the query
- f2dc1a9: Add "type": "module" to package.json
- f2dc1a9: Remove dependency on 'uuid', increment number for unique ids
- 1674f80: Improve API for adding a Query to a System
- 4b39c94: Add `first` getter to Query, retrieves first Entity that matches the query, or null if no Entities have matched
- 3348c4b: Query instances maintain their own 'added' and 'removed' event arrays
- 84bde0d: Add default Space to World, add methods for creating Entities in a World's default space

## 0.0.3

### Patch Changes

- f9eb1a5: Minor refactor of SpaceManager removeComponentFromEntity, addComponentToEntity methods
- 6c4f48b: Change event systems to be async instead of queued

## 0.0.2

### Patch Changes

- ece6726: Add event system to world

## 0.0.1

### Patch Changes

- Initial release
