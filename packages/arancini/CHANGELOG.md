# arancini

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
