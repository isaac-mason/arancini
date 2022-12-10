# @arancini/core

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
