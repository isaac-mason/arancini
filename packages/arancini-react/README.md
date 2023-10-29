# @arancini/react

React glue for the [arancini](https://github.com/isaac-mason/arancini/tree/main/packages/arancini) Entity Component System.

## Installation

```sh
> npm install @arancini/react
```

## Creating the React glue

To get started, use `createECS` to get glue components and hooks scoped to a given arancini world. Because the react glue is scoped, libraries can use @arancini/react without worrying about context conflicts.

```ts
import { World } from '@arancini/core'
import { createECS } from '@arancini/react'

type EntityType = {
  health?: number
  position?: [number, number]
}

const world = new World<EntityType>({
  components: ['position', 'health'],
})

world.registerSystem(MySystem)

world.init()

const ECS = createECS(world)
```

## Entities and Components

`<Entity />` can be used to declaratively create entities with components.

```tsx
const Example = () => <ECS.Entity health={100} position={[0, 0]} />
```

You can also pass an existing entity to `<Entity />`.

```tsx
const entity = world.create({ position: [0, 0] })

const Example = () => <ECS.Entity entity={entity} health={100} />
```

`<Component />` can be used to add components to an entity.

```tsx
const Example = () => (
  <ECS.Entity>
    <ECS.Component name="health" data={100} />
  </ECS.Entity>
)
```

### Capturing React Component refs

If a child is passed to `Component`, it will be captured and used as the value of the component. This is useful for keeping ECS code decoupled from React code.

```tsx
const world = new A.World()
const ECS = createECS(world)

const Example = () => (
  <ECS.Entity>
    <ECS.Component name="object3D">
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshNormalMaterial />
      </mesh>
    </ECS.Component>
  </ECS.Entity>
)
```

### Rendering multiple entities

`@arancini/react` also provides an `<Entities />` component that can be used to render a list of entities or add components to existing entities. `<Entities />` also supports [render props](https://reactjs.org/docs/render-props.html).

```tsx
const SimpleExample = () => (
  <ECS.Entities entities={[entity1, entity2]}>{/* ... */}</ECS.Entities>
)

const AddComponentToEntities = () => (
  <ECS.Entities entities={[entity1, entity2]}>
    <ECS.Component name="position" data={[0, 0]} />
  </ECS.Entities>
)

const RenderProps = () => (
  <ECS.Entities entities={[entity1, entity2]}>
    {(entity) => {
      // ...
    }}
  </ECS.Entities>
)
```

## Querying the world

### `useQuery`

The `useQuery` hook queries the world for entities with given components and will re-render when the query results change.

```tsx
const Example = () => {
  const entities = ECS.useQuery((e) => e.with('health'))

  // ...
}
```

### `QueryEntities`

`QueryEntities` can be used to render entities, as well as enhance existing ones. It will re-render whenever the query results change. It also supports [render props](https://reactjs.org/docs/render-props.html).

```tsx
const world = new World()
const ECS = createECS(world)

const SimpleExample = () => (
  <ECS.QueryEntities query={(e) => e.with('exampleTag')}>
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshNormalMaterial />
    </mesh>
  </ECS.QueryEntities>
)

const RenderProps = () => (
  <ECS.QueryEntities query={(e) => e.with('exampleTag')}>
    {(entity) => {
      return (
        <mesh>
          <boxGeometry
            position={[
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
            ]}
          />
          <meshNormalMaterial />
        </mesh>
      )
    }}
  </ECS.QueryEntities>
)

const EnhanceExistingEntities = () => (
  <ECS.QueryEntities query={(e) => e.with('exampleTag')}>
    {(entity) => {
      return (
        <ECS.Component name="object3D">
          <mesh>
            <boxGeometry
              position={[
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
              ]}
            />
            <meshNormalMaterial />
          </mesh>
        </ECS.Component>
      )
    }}
  </ECS.QueryEntities>
)
```

## Updating Systems

`@arancini/react` does not automatically update systems for you. If you are using arancini with `@react-three/fiber`, you can use the `useFrame` hook to update systems in the world.

```tsx
import { useFrame } from '@react-three/fiber'

const Stepper = () => {
  useFrame((_, delta) => {
    ECS.step(delta)
  })

  return null
}
```

## Advanced Usage

### Entity context

You can use the `useCurrentEntitiy` hook to access the current entity in a React component.

```tsx
import { Component } from '@arancini/core'
import { createECS } from '@arancini/react'

const ECS = createECS()

const Example = () => {
  const entity = useCurrentEntity()

  // ...
}

const App = () => (
  <ECS.Entity>
    <Example />
  </ECS.Entity>
)
```

For extra advanced usage, `createECS` also returns the entity react context `entityContext`.
