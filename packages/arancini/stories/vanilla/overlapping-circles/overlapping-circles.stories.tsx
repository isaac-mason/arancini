import { World } from '@arancini/core'
import { Executor, System } from '@arancini/systems'
import React, { useEffect } from 'react'
import * as THREE from 'three'
import { drawLine, fillCircle, intersection, random } from './utils'

type Entity = {
  movement?: {
    velocity: THREE.Vector2
    acceleration: THREE.Vector2
  }
  circle?: {
    position: THREE.Vector2
    radius: number
  }
  intersecting?: {
    points: [number, number, number, number][]
  }
  canvas?: {
    canvasElement: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    width: number
    height: number
  }
}

export class MovementSystem extends System<Entity> {
  movingCircles = this.query((entities) => entities.with('movement', 'circle'))

  context = this.singleton('canvas')!

  onUpdate(delta: number) {
    const canvasWidth = this.context.width
    const canvasHeight = this.context.height
    const multiplier = 0.5

    const entities = this.movingCircles.entities
    for (let i = 0; i < entities.length; i++) {
      const { circle, movement } = entities[i]

      circle.position.x +=
        movement.velocity.x * movement.acceleration.x * delta * multiplier
      circle.position.y +=
        movement.velocity.y * movement.acceleration.y * delta * multiplier

      if (movement.acceleration.x > 1)
        movement.acceleration.x -= delta * multiplier
      if (movement.acceleration.y > 1)
        movement.acceleration.y -= delta * multiplier
      if (movement.acceleration.x < 1) movement.acceleration.x = 1
      if (movement.acceleration.y < 1) movement.acceleration.y = 1

      if (circle.position.y + circle.radius < 0)
        circle.position.y = canvasHeight + circle.radius

      if (circle.position.y - circle.radius > canvasHeight)
        circle.position.y = -circle.radius

      if (circle.position.x - circle.radius > canvasWidth) circle.position.x = 0

      if (circle.position.x + circle.radius < 0) circle.position.x = canvasWidth
    }
  }
}

export class IntersectionSystem extends System<Entity> {
  circles = this.query((entities) => entities.with('circle'))

  onUpdate() {
    const entities = this.circles.entities

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i]
      if (entity.intersecting) {
        entity.intersecting.points.length = 0
      }

      const { circle } = entity

      for (let j = i + 1; j < entities.length; j++) {
        const entityB = entities[j]
        const { circle: circleB } = entityB

        const intersect = intersection(circle, circleB)

        if (intersect !== false) {
          if (!entity.intersecting) {
            this.world.add(entity, 'intersecting', {
              points: [],
            })
          }
          entity.intersecting!.points.push(intersect)
        }
      }

      if (entity.intersecting && entity.intersecting.points.length === 0) {
        this.world.remove(entity, 'intersecting')
      }
    }
  }

  onDestroy() {
    // Clean up interesection when stopping
    const entities = this.circles.entities

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i]
      if (entity.intersecting) {
        entity.intersecting.points.length = 0
      }
    }
  }
}

export class Renderer extends System<Entity> {
  circles = this.query((entities) => entities.with('circle'))
  intersectingCircles = this.query((entities) => entities.with('intersecting'))
  context = this.singleton('canvas')!

  onUpdate() {
    const { ctx, width, height } = this.context

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)

    const circles = this.circles.entities
    for (let i = 0; i < circles.length; i++) {
      const { circle } = circles[i]

      ctx.beginPath()
      ctx.arc(
        circle.position.x,
        circle.position.y,
        circle.radius,
        0,
        2 * Math.PI,
        false
      )
      ctx.lineWidth = 1
      ctx.strokeStyle = '#fff'
      ctx.stroke()
    }

    const intersectingCircles = this.intersectingCircles.entities
    for (let i = 0; i < intersectingCircles.length; i++) {
      const { intersecting } = intersectingCircles[i]
      for (let j = 0; j < intersecting.points.length; j++) {
        const points = intersecting.points[j]
        ctx.lineWidth = 2
        ctx.strokeStyle = '#ff9'

        ctx.fillStyle = 'rgba(255, 255,255, 0.2)'
        fillCircle(ctx, points[0], points[1], 8)
        fillCircle(ctx, points[2], points[3], 8)

        ctx.fillStyle = '#fff'
        fillCircle(ctx, points[0], points[1], 3)
        fillCircle(ctx, points[2], points[3], 3)

        drawLine(ctx, points[0], points[1], points[2], points[3])
      }
    }
  }
}

export const OverlappingCircles = () => {
  useEffect(() => {
    const world = new World<Entity>()

    const executor = new Executor(world)

    executor.add(MovementSystem).add(Renderer).add(IntersectionSystem)

    const canvasElement = document.querySelector(
      '#example-canvas'
    ) as HTMLCanvasElement

    const canvasEntity = {
      canvas: {
        canvasElement,
        ctx: canvasElement.getContext('2d')!,
        width: canvasElement.width,
        height: canvasElement.height,
      },
    }

    world.create(canvasEntity)

    const onResize = () => {
      const parent = canvasElement.parentElement!
      canvasEntity.canvas.width = canvasElement.width = parent.clientWidth
      canvasEntity.canvas.height = canvasElement.height = parent.clientHeight
    }

    onResize()
    window.addEventListener('resize', onResize, false)

    for (let i = 0; i < 30; i++) {
      const entity = {
        circle: {
          position: new THREE.Vector2(
            random(0, canvasEntity.canvas.width),
            random(0, canvasEntity.canvas.height)
          ),
          radius: random(20, 100),
        },
        movement: {
          velocity: new THREE.Vector2(random(-20, 20), random(-20, 20)),
          acceleration: new THREE.Vector2(),
        },
      }

      world.create(entity)
    }

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
  name: 'Vanilla / Overlapping Circles',
  component: OverlappingCircles,
}
