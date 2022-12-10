# @arancini/react

React glue for the [arancini](https://github.com/isaac-mason/arancini/tree/main/packages/arancini) Entity Component System.

## Installation

```sh
> yarn add @arancini/react
```

## Usage

To get started, use `createECS` to get React glue scoped to a arancini world. Because components and hooks are scoped, libraries can use them without worrying about context conflicts.

```ts
import { createECS } from '@arancini/react'

const ECS = createECS()
```

You can also pass in an existing world.

```ts
import { World } from 'arancini'
import { createECS } from '@arancini/react'

const world = new World()
const ECS = createECS(world)
```

### Imperative API

The `createECS` function returns a reference to the arancini world. If you didn't pass in an existing world, you can still use the regular imperative API directly.

```ts
const ECS = createECS()
const world = ECS.world

// use the World as normal
const entity = world.create.entity()
```

### Stepping the World

`@arancini/react` does not automatically step the World for you, the `step` method must be called. If you are using arancini with `@react-three/fiber`, you can use the `useFrame` hook to step the World.

```tsx
import { useFrame } from '@react-three/fiber'

const Stepper = () => {
  useFrame((_, delta) => {
    ECS.step(delta)
  })

  return null
}
```

### Creating Entities and Components

The `Entity` can be used to declaratively create entities, and `Component` can be used to add components to an entity.

```tsx
class Position extends A.Component {
  x!: number
  y!: number

  construct(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

const Example = () => (
  <ECS.Entity>
    <ECS.Component type={Position} args={[0, 0]} />
  </ECS.Entity>
)
```

You can also pass an existing entity to `Entity`.

```tsx
const entity = ECS.world.create.entity()

const Example = () => (
  <ECS.Entity entity={entity}>
    {/* this will add the Position component to the existing entity */}
    <ECS.Component type={Position} args={[0, 0]} />
  </ECS.Entity>
)
```

### Querying the world

#### `useQuery`

The `useQuery` hook queries the world for entities with given components, and will re-render when the query results change.

```tsx
const Example = () => {
  const entities = ECS.useQuery([Position])

  // ...
}
```

#### `QueryEntities`

`QueryEntities` can be used to render entities, as well as enhance existing ones. It will re-render whenever the query results change. It also supports [render props](https://reactjs.org/docs/render-props.html).

```tsx
const ECS = createECS()

const SimpleExample = () => (
  <ECS.QueryEntities query={[ExampleTagComponent]}>
    <mesh>
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshNormalMaterial />
    </mesh>
  </ECS.QueryEntities>
)

const RenderProps = () => (
  <ECS.QueryEntities query={[ExampleTagComponent]}>
    {(entity) => {
      return (
        <mesh>
          <boxBufferGeometry
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
        <ECS.Component type={Object3D}>
          <mesh>
            <boxBufferGeometry
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

const
```

### Capturing React Component refs

If a child is passed to `Component`, it will be captured and passed to the component's `construct` method. This is useful for keeping ECS code decoupled from React code.

```tsx
import * as A from 'arancini'
import { createECS } from '@arancini/react'

const ECS = createECS()

class CanvasElementComponent extends A.Component {
  canvasElement!: HTMLCanvasElement

  construct(canvasElement: HTMLCanvasElement) {
    this.canvasElement = canvasElement
  }
}

const Example = () => (
  <ECS.Entity>
    <ECS.Component type={Canvas}>
      <canvas />
    </ECS.Component>
  </ECS.Entity>
)
```

## Advanced

### Using Entity and Space contexts

You can use the hooks `useCurrentEntitiy` and `useCurrentSpace` to access the current entity and space in a React component.

```tsx
import * as A from 'arancini'
import { createECS } from '@arancini/react'

const ECS = createECS()

class Position extends A.Component {
  x!: number
  y!: number

  construct(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

const Example = () => {
  const entity = useCurrentEntity()
  const space = useCurrentSpace()

  // ...
}

const App = () => (
  <ECS.Space>
    <ECS.Entity>
      <Example />
    </ECS.Entity>
  </ECS.Space>
)
```

For truly advanced usage, `createECS` also returns the contexts themselves, `entityContext` and `spaceContext`.
