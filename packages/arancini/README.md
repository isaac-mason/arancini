# arancini

Arancini is an object based Entity Component System. You can use Arancini to structure games and other similarly demanding applications.

## Features

- 💪 ‎ Flexible and extensible
- 🗑️ ‎ Helps you avoid garbage collection
- 🪶 ‎ Lightweight! the core library has **_zero_** dependencies
- 🖇 ‎ Easy integration with React via [`@arancini/react`](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react)

## Packages

### [**`arancini`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini)

[![Version](https://img.shields.io/npm/v/arancini)](https://www.npmjs.com/package/arancini)

The core library!

```bash
> yarn add arancini
```

### [**`@arancini/react`**](https://github.com/isaac-mason/arancini/tree/main/packages/arancini-react)

[![Version](https://img.shields.io/npm/v/@arancini/react)](https://www.npmjs.com/package/@arancini/react)

React glue for `arancini`

```bash
> yarn add @arancini/react
```

## Getting Started

Let's use arancini to make a simple random walk simulation!

### 1. Import everything we need

```ts
import { Component, Query, System, World } from 'arancini';
```

### 2. Create components to store data

Let's create a few components.

Note that Arancini will pool and re-use objects for you! This helps avoid garbage collection and improves performance. We'll define a `construct` method, which will be called every time a component object is created or re-used.

Note the not null `!:` syntax! Use this in typescript to indicate that the property will be defined, even if it's not defined in the constructor.

```ts
class Position extends Component {
  x!: number
  y!: number

  construct(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

class Color extends Component {
  color!: 'red' | 'blue'

  construct(color: 'red' | 'blue') {
    this.color = color;
  }
}

class CanvasContext extends Component {
  ctx!: CanvasRenderingContext2D
  width!: number
  height!: number
}
```

### 3. Create a System that draws entities with `Position` and `Color` components

```ts
class DrawSystem extends System {
  canvasContext = this.query([CanvasContext])

  boxesToDraw = this.query({
    all: [Position, Color],
  })

  onUpdate() {
    const context = this.canvasContext.first!.get(CanvasContext)

    context.ctx.clearRect(0, 0, context.width, context.height)

    const xOffset = context.width / 2
    const yOffset = context.height / 2

    const boxSize = 10

    for (const entity of this.boxesToDraw.entities) {
      const { x, y } = entity.get(Position)
      const { color } = entity.get(Color)

      context.ctx.fillStyle = color
      context.ctx.fillRect(
        xOffset + (x - boxSize / 2),
        yOffset + (y - boxSize / 2),
        boxSize,
        boxSize
      )
    }
  }
}
```

### 4. Create a System that moves entities with a `Position` Component

```ts
const TIME_BETWEEN_MOVEMENTS = 0.05 // seconds

class WalkSystem extends System {
  movementCountdown = TIME_BETWEEN_MOVEMENTS
  
  walkers = this.query({
    all: [Position],
  })

  onUpdate(delta: number) {
    this.movementCountdown -= delta

    if (this.movementCountdown <= 0) {
      for (const entity of this.walkers.entities) {
        const position = entity.get(Position)
        position.x += (Math.random() - 0.5) * 3
        position.y += (Math.random() - 0.5) * 3
      }

      this.movementCountdown = TIME_BETWEEN_MOVEMENTS;
    }
  }
}
```

### 5. Bringing it all together

First, create a new `World`

```ts
const world = new World()
```

Next, let's register the Components and Systems we created.

Components can be used without being registered first, but this will cause a small performance hit as internal data structures need to be updated.

```ts
world.registerComponent(Position)
world.registerComponent(Color)
world.registerComponent(CanvasContext)

world.registerSystem(WalkSystem)
world.registerSystem(DrawSystem)
world.registerSystem(FlipSystem)
```

Now let's create some random walkers. We'll create 100 random walkers, and give them a random position and color.

```ts
const N = 100

const randomPosition = () => Math.random() * 10 - 5
const randomColor = () => Math.random() > 0.5 ? 'red' : 'blue'

for (let i = 0; i < N; i++) {
  const entity = world.create.entity()
  entity.add(Position, randomPosition(), randomPosition())
  entity.add(Color, randomColor())
}
```

Next we'll create an entity with the `CanvasContext` component, which will contain the HTML canvas context. We'll also add a handler for window resizing.

```ts
const canvasContext = world.create.entity()

const canvasElement = document.querySelector('#example-canvas') as HTMLCanvasElement
canvasElement.width = window.innerWidth
canvasElement.height = window.innerHeight

const canvasComponent = canvasContext.add(CanvasContext)
canvasComponent.ctx = canvasElement.getContext('2d')!
canvasComponent.width = canvasElement.width
canvasComponent.height = canvasElement.height

const resize = () => {
  canvasComponent.width = canvasElement.width = window.innerWidth
  canvasComponent.height = canvasElement.height = window.innerHeight
};
window.addEventListener('resize', resize, false)
resize()
```

### 6. The loop

Finally, let's initialise the World and run our simulation!

```ts
world.init()

const now = () => performance.now() / 1000

let lastTime = now()

const loop = () => {
  requestAnimationFrame(loop)

  const time = now()
  const delta = time - lastTime
  lastTime = time

  world.update(delta)
}

loop()
```
