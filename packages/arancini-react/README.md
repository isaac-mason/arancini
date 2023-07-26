# @arancini/react

React glue for the [arancini](https://github.com/isaac-mason/arancini/tree/main/packages/arancini) Entity Component System.

## Installation

```sh
> npm install @arancini/react
```

## Usage

To get started, use `createECS` to get glue components and hooks scoped to a given arancini world. Because the react glue is scoped, libraries can use @arancini/react without worrying about context conflicts.

```ts
import { World } from '@arancini/core'
import { createECS } from '@arancini/react'

const world = new World()

world.registerComponent(MyComponent)
world.registerSystem(MySystem)
world.init()

const ECS = createECS(world)
```

### Updating Systems

`@arancini/react` does not automatically update systems for you. If you are using arancini with `@react-three/fiber`, you can use the `useFrame` hook to update systems in the world.

```tsx
import { useFrame } from '@react-three/fiber'

const Stepper = () => {
  useFrame((_, delta) => {
    ECS.update(delta)
  })

  return null
}
```

If arancini needs to be integrated into an existing game loop, instead of calling `update`, you can decide when to update particular systems.

```tsx
const world = new World()
const ECS = createECS(world)

const Example = () => {
  useFrame(({ clock: { elapsedTime }, delta) => {
    // update all systems
    this.systemManager.update(delta, elapsedTime)

    // or update a particular system
    const exampleSystem = world.getSystem(ExampleSystem)
    exampleSystem.update(delta, elapsedTime)
  })
}
```

### Entities and Components

`<Entity />` can be used to declaratively create entities, and `<Component />` can be used to add components to an entity.

```tsx
class PositionComponent extends Component {
  x!: number
  y!: number

  construct(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

const Example = () => (
  <ECS.Entity>
    <ECS.Component type={PositionComponent} args={[0, 0]} />
  </ECS.Entity>
)
```

You can also pass an existing entity to `<Entity />`.

```tsx
const entity = world.create.entity()

const Example = () => (
  <ECS.Entity entity={entity}>
    {/* this will add the Position component to the existing entity */}
    <ECS.Component type={PositionComponent} args={[0, 0]} />
  </ECS.Entity>
)
```

`@arancini/react` also provides an `<Entities />` component that can be used to render a list of entities or add components to existing entities. `<Entities />` also supports [render props](https://reactjs.org/docs/render-props.html).

```tsx
const SimpleExample = () => (
  <ECS.Entities entities={[entity1, entity2]}>
    {/* ... */}
  </ECS.Entities>
)

const AddComponentToEntities = () => (
  <ECS.Entities entities={[entity1, entity2]}>
    <ECS.Component type={PositionComponent} args={[0, 0]} />
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

### Querying the world

#### `useQuery`

The `useQuery` hook queries the world for entities with given components and will re-render when the query results change.

```tsx
const Example = () => {
  const entities = ECS.useQuery([PositionComponent])

  // ...
}
```

#### `QueryEntities`

`QueryEntities` can be used to render entities, as well as enhance existing ones. It will re-render whenever the query results change. It also supports [render props](https://reactjs.org/docs/render-props.html).

```tsx
const world = new World()
const ECS = createECS(world)

const SimpleExample = () => (
  <ECS.QueryEntities query={[ExampleTagComponent]}>
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshNormalMaterial />
    </mesh>
  </ECS.QueryEntities>
)

const RenderProps = () => (
  <ECS.QueryEntities query={[ExampleTagComponent]}>
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
  <ECS.QueryEntities query={[ExampleTagComponent]}>
    {(entity) => {
      return (
        <ECS.Component type={Object3DComponent}>
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

### Capturing React Component refs

If a child is passed to `Component`, it will be captured and passed to the component's `construct` method. This is useful for keeping ECS code decoupled from React code.

```tsx
const world = new A.World()
const ECS = createECS(world)

class CanvasElementComponent extends A.Component {
  canvasElement!: HTMLCanvasElement

  construct(canvasElement: HTMLCanvasElement) {
    this.canvasElement = canvasElement
  }
}

const Example = () => (
  <ECS.Entity>
    <ECS.Component type={CanvasElementComponent}>
      <canvas />
    </ECS.Component>
  </ECS.Entity>
)
```

## Advanced Usage

### Entity context

You can use the `useCurrentEntitiy` hook to access the current entity in a React component.

```tsx
import { Component } from '@arancini/core'
import { createECS } from '@arancini/react'

const ECS = createECS()

class Position extends Component {
  x!: number
  y!: number

  construct(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

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
