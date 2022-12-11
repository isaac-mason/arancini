# @arancini/react

React glue for the [arancini](https://github.com/isaac-mason/arancini/tree/main/packages/arancini) Entity Component System.

## Installation

```sh
> yarn add @arancini/react
```

## Usage

To get started, use `createECS` to get glue components and hooks scoped to a given arancini world. Because the react glue is scoped, libraries can use @arancini/react without worrying about context conflicts.

```ts
import { createECS } from '@arancini/react'

const ECS = createECS()
```

You can also pass in an existing world.

```ts
import { createECS } from '@arancini/react'
import { World } from 'arancini'

const world = new World()
const ECS = createECS(world)
```

### Imperative API

`createECS` returns a reference to the arancini world, so if you didn't pass `createECS` in an existing world, you can still use the regular imperative API.

```ts
const ECS = createECS()
const world = ECS.world

// use the world as normal
const entity = world.create.entity()
```

### Stepping the World

`@arancini/react` does not automatically step the world for you. If you are using arancini with `@react-three/fiber`, you can use the `useFrame` hook to step the World.

```tsx
import { useFrame } from '@react-three/fiber'

const Stepper = () => {
  useFrame((_, delta) => {
    ECS.step(delta)
  })

  return null
}
```

If arancini needs to be integrated into an existing game loop, instead of calling `step`, you can decide when to update parts of the world.

```tsx
import * as A from 'arancini'

const ECS = createECS()

const Example = () => {
  useFrame(({ clock: { elapsedTime }, delta) => {
    // update all systems
    this.systemManager.update(delta, elapsedTime)

    // or update a particular system
    const exampleSystem = ECS.world.getSystem(ExampleSystem)
    exampleSystem.update(delta, elapsedTime)

    // recycle entity and component objects
    ECS.world.spaceManager.recycle()
  })
}
```

### Spaces, Entities, Components

`<Space />` can be used to declaratively create spaces, `<Entity />` can be used to declaratively create entities, and `<Component />` can be used to add components to an entity.

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
  <ECS.Space>
    <ECS.Entity>
      <ECS.Component type={Position} args={[0, 0]} />
    </ECS.Entity>
  </ECS.Space>
)
```

You can also pass an existing entity to `<Entity />`.

```tsx
const entity = ECS.world.create.entity()

const Example = () => (
  <ECS.Entity entity={entity}>
    {/* this will add the Position component to the existing entity */}
    <ECS.Component type={Position} args={[0, 0]} />
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
    <ECS.Component type={Position} args={[0, 0]} />
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

### Systems

`@arancini/react` provides a `<System />` helper component that can be used to register a system. It will automatically unregister the system when the component unmounts.

```tsx
import * as A from 'arancini'

class ExampleSystem extends A.System {
  update(delta: number) {
    // ...
  }
}

const Example = () => (
  <ECS.System type={ExampleSystem} priority={10} />
)
```

You can also opt to register systems using the imperative API.

```tsx
const Example = () => {
  useEffect(() => {
    ECS.world.registerSystem(ExampleSystem, { priority: 10 })

    return () => {
      ECS.world.unregisterSystem(ExampleSystem)
    }
  }, [])
}
```

## Advanced Usage

### Entity and Space contexts

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

For truly advanced usage, `createECS` also returns the react contexts, `entityContext` and `spaceContext`.
