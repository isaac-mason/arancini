import { World } from '@arancini/core'
import { Executor, System } from '@arancini/systems'
import React, { useEffect } from 'react'

type Entity = {
  position?: {
    x: number
    y: number
  }
  red?: true
  blue?: true
  canvasContext?: {
    ctx: CanvasRenderingContext2D
    width: number
    height: number
  }
}

const BOX_SIZE = 10

class DrawSystem extends System<Entity> {
  // get the canvas context
  context = this.singleton('canvasContext')!

  // A `System` can have many queries for entities, filtering by what components they have
  // this query is called `toDraw`
  toDraw = this.query((entities) =>
    entities.with('position').and.any('red', 'blue')
  )

  // On each update, let's draw
  onUpdate() {
    // get the first entity from our canvas context query
    const { ctx, width, height } = this.context

    // clear the canvas
    ctx.clearRect(0, 0, width, height)

    const xOffset = width / 2
    const yOffset = height / 2

    // the results of the `toDraw` query are available in `this.toDraw.entities`
    // to get entities that have been matched and unmatched from the query
    for (const entity of this.toDraw) {
      // let's get the position of the random walker
      const {
        position: { x, y },
      } = entity

      // let's also get the color for this random walker
      const color: 'red' | 'blue' = entity.red ? 'red' : 'blue'

      // draw the box
      ctx.fillStyle = color

      ctx.fillRect(
        xOffset + (x - BOX_SIZE / 2),
        yOffset + (y - BOX_SIZE / 2),
        BOX_SIZE,
        BOX_SIZE
      )
    }
  }
}

class WalkSystem extends System<Entity> {
  // query for walkers
  walkers = this.query((entities) => entities.with('position'))

  // keep track of when our walkers should move again
  static timeBetweenMovements = 0.05

  // our random walkers should move every 0.05s
  movementCountdown = WalkSystem.timeBetweenMovements

  onUpdate(delta: number) {
    // count down until walkers should move again
    this.movementCountdown -= delta

    // if it's time for entities to move again
    if (this.movementCountdown <= 0) {
      // move all walkers in a random direction
      for (const entity of this.walkers) {
        const { position } = entity
        position.x = position.x + (Math.random() - 0.5) * 3
        position.y = position.y + (Math.random() - 0.5) * 3
      }

      // reset the countdown
      this.movementCountdown = WalkSystem.timeBetweenMovements
    }
  }
}

class FlipSystem extends System<Entity> {
  walkers = this.query((entities) => entities.some('red', 'blue'))

  onUpdate() {
    for (const entity of this.walkers) {
      // small chance of changing color
      if (Math.random() >= 0.95) {
        if (entity.blue) {
          this.world.remove(entity, 'blue')
          this.world.add(entity, 'red', true)
        } else {
          this.world.remove(entity, 'red')
          this.world.add(entity, 'blue', true)
        }
      }
    }
  }
}

export const RandomColorChangingWalkers = () => {
  useEffect(() => {
    const world = new World<Entity>()

    const executor = new Executor(world)

    executor.add(WalkSystem)
    executor.add(DrawSystem)
    executor.add(FlipSystem)

    // how many entities to create
    const n = 100

    // create entities in the World's default
    for (let i = 0; i < n; i++) {
      const entity: Entity = {
        position: {
          x: (Math.random() - 0.5) * 300,
          y: (Math.random() - 0.5) * 300,
        },
      }

      if (i % 2 === 0) {
        entity.red = true
      } else {
        entity.blue = true
      }

      world.create(entity)
    }

    // create an entity with a component containing the canvas context
    const canvasElement = document.querySelector(
      '#example-canvas'
    ) as HTMLCanvasElement
    canvasElement.width = window.innerWidth
    canvasElement.height = window.innerHeight

    const canvasEntity = {
      canvasContext: {
        ctx: canvasElement.getContext('2d')!,
        width: canvasElement.width,
        height: canvasElement.height,
      },
    }

    world.create(canvasEntity)

    // handle resizing
    const resize = () => {
      canvasEntity.canvasContext.width = canvasElement.width = window.innerWidth
      canvasEntity.canvasContext.height = canvasElement.height =
        window.innerHeight
    }
    window.addEventListener('resize', resize, false)
    resize()

    executor.init()

    const now = () => performance.now() / 1000

    let running = true
    let lastTime = now()

    const update = () => {
      if (!running) return

      requestAnimationFrame(update)

      const time = now()
      const delta = time - lastTime
      lastTime = time

      executor.update(delta)
    }

    update()

    return () => {
      running = false
      world.reset()
    }
  })

  return <canvas id="example-canvas" />
}

export default {
  name: 'Vanilla / Random Walkers',
  component: RandomColorChangingWalkers,
}
