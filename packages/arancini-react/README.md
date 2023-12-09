# @arancini/react

React glue for the [arancini](https://github.com/isaac-mason/arancini/tree/main/packages/arancini) Entity Component System.

## Installation

```sh
> npm install @arancini/react
```

## Creating the React glue

To get started, use `createReactAPI` to get glue components and hooks scoped to a given arancini world. Because the react glue is scoped, libraries can use @arancini/react without worrying about context conflicts.

```ts
import { World } from '@arancini/core'
import { createReactAPI } from '@arancini/react'

type EntityType = {
  health?: number
  position?: [number, number]
}

const world = new World<EntityType>({
  components: ['position', 'health'],
})

const { Entity, Entities, Component, useQuery } =
  createReactAPI(world)
```

## Entities and Components

`<Entity />` can be used to declaratively create entities with components.

```tsx
const Example = () => <Entity health={100} position={[0, 0]} />
```

You can also pass an existing entity to `<Entity />`.

```tsx
const entity = world.create({ position: [0, 0] })

const Example = () => <Entity entity={entity} health={100} />
```

`<Component />` can be used to add components to an entity.

```tsx
const Example = () => (
  <Entity>
    <Component name="health" data={100} />
  </Entity>
)
```

### Capturing React Component refs

If a child is passed to `Component`, it will be captured and used as the value of the component. This is useful for keeping your logic decoupled from React.

```tsx
const RefCaptureExample = () => (
  <Entity>
    <Component name="object3D">
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshNormalMaterial />
      </mesh>
    </Component>
  </Entity>
)
```

### Rendering multiple entities

`@arancini/react` also provides an `<Entities />` component that can be used to render a collection of entities or add components to existing entities. `<Entities />` also supports [render props](https://reactjs.org/docs/render-props.html).

```tsx
const Simple = () => (
  <Entities in={[entity1, entity2]}>{/* ... */}</Entities>
)

const AddComponentToEntities = () => (
  <Entities in={[entity1, entity2]}>
    <Component name="position" data={[0, 0]} />
  </Entities>
)

const RenderProps = () => (
  <Entities in={[entity1, entity2]}>
    {(entity) => {
      // ...
    }}
  </Entities>
)
```

`Entities` also supports a `where` prop that takes a query description.

```tsx
const SimpleExample = () => (
  <Entities where={(e) => e.with('exampleTag')}>
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshNormalMaterial />
    </mesh>
  </Entities>
)
```

## Queries

### `useQuery`

The `useQuery` hook queries the world for entities with given components and will re-render when the query results change.

```tsx
const Example = () => {
  const entitiesWithHealth = useQuery((e) => e.with('health'))

  // ...
}
```
