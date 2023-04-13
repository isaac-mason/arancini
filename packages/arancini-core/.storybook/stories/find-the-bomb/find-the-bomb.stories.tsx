import { Component, Entity, System, World } from '@arancini/core'
import React, { useEffect } from 'react'

import './find-the-bomb.css'

class GameState extends Component {
  clicks!: number
  foundBomb!: boolean

  construct() {
    this.clicks = 0
    this.foundBomb = false
  }
}

class Emoji extends Component {
  domElement!: HTMLElement
  revealed!: boolean
  dirty!: boolean

  construct() {
    this.domElement = document.createElement('div')
    this.revealed = false
    this.dirty = false
  }

  onDestroy(): void {
    this.domElement.remove()
  }
}

class Position extends Component {
  x!: number
  y!: number

  construct(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

class DistanceToTarget extends Component {
  value!: number

  construct(value: number) {
    this.value = value
  }
}

class Target extends Component {}

class EmojiRendererSystem extends System {
  queries = {
    toRender: this.query([Position, Emoji, DistanceToTarget]),
  }

  emojisDomElement = document.getElementById('emojis')!

  onInit(): void {
    this.queries.toRender.onEntityAdded.add((entity) => {
      const emoji = entity.get(Emoji)
      this.emojisDomElement.appendChild(emoji.domElement)
      emoji.dirty = true
    })
  }

  onUpdate() {
    for (const entity of this.queries.toRender) {
      const emoji = entity.get(Emoji)
      if (!emoji.dirty) continue

      const pos = entity.get(Position)
      const { value: distance } = entity.get(DistanceToTarget)

      if (emoji.revealed) {
        if (distance > 8) {
          emoji.domElement.innerText = '🥶'
        } else if (distance > 5) {
          emoji.domElement.innerText = '❄️'
        } else if (distance > 3) {
          emoji.domElement.innerText = '🕯'
        } else if (distance >= 2) {
          emoji.domElement.innerText = '🔥'
        } else if (distance >= 1) {
          emoji.domElement.innerText = '🫣'
        } else {
          emoji.domElement.innerText = '💣'
        }
      } else {
        emoji.domElement.innerText = '☁'
      }

      const paddingPx = 28
      const x = pos.x * paddingPx
      const y = pos.y * paddingPx
      emoji.domElement.className = `emoji ${emoji.revealed ? 'revealed' : ''}`
      emoji.domElement.style.left = `${
        x + document.body.clientWidth / 2 - paddingPx / 2
      }px`
      emoji.domElement.style.top = `${y - paddingPx / 2}px`

      emoji.dirty = false
    }
  }
}

class DistanceSystem extends System {
  queries = {
    emojis: this.query({
      all: [Position, Emoji],
    }),
    target: this.query({
      all: [Target],
    }),
  }

  get target(): Entity {
    return this.queries.target.first!
  }

  onInit(): void {
    this.queries.emojis.onEntityAdded.add((entity) => {
      const { x, y } = entity.get(Position)

      const targetPosition = this.target.get(Position)

      const distance = Math.sqrt(
        Math.pow(targetPosition.x - x, 2) + Math.pow(targetPosition.y - y, 2)
      )

      entity.add(DistanceToTarget, distance)
    })
  }
}

class InteractionSystem extends System {
  queries = {
    emojis: this.query([Emoji]),
    target: this.query([Target, Position]),
    gameState: this.query([GameState]),
  }

  get gameState(): Entity | undefined {
    return this.queries.gameState.first
  }

  nRevealedDomElement = document.createElement('p')

  onInit(): void {
    document.querySelector('#score')!.appendChild(this.nRevealedDomElement)

    this.queries.gameState.onEntityAdded.add(() => {
      this.nRevealedDomElement.innerText = 'Click on an emoji to start'
    })

    this.queries.emojis.onEntityAdded.add((entity) => {
      const emoji = entity.get(Emoji)

      emoji.domElement.addEventListener('click', () => {
        const gameState = this.gameState?.get(GameState)
        if (!gameState || gameState.foundBomb) return

        if (!emoji.revealed) {
          emoji.revealed = true
          gameState.clicks += 1

          const target = this.queries.target.first!
          const targetPosition = target.get(Position)

          const clickedPosition = entity.get(Position)

          if (
            targetPosition.x === clickedPosition.x &&
            targetPosition.y === clickedPosition.y
          ) {
            gameState.foundBomb = true
            this.nRevealedDomElement.innerText =
              'You found the bomb in ' +
              gameState.clicks.toString() +
              ' clicks!'
          } else {
            this.nRevealedDomElement.innerText = InteractionSystem.scoreText(
              gameState.clicks
            )
          }

          emoji.dirty = true
        }
      })
    })
  }

  static scoreText(clicks: number): string {
    return `${clicks} clicks so far...`
  }
}

export const FindTheBomb = () => {
  useEffect(() => {
    const world = new World()

    world
      .registerComponent(GameState)
      .registerComponent(Position)
      .registerComponent(Emoji)
      .registerComponent(Target)
      .registerComponent(DistanceToTarget)
      .registerSystem(DistanceSystem)
      .registerSystem(EmojiRendererSystem)
      .registerSystem(InteractionSystem)

    world.init()

    const randomBetween = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1) + min)

    const setupGame = () => {
      const space = world.create.space()

      const gameState = space.create.entity()
      gameState.add(GameState)

      const rows = 11
      const rowsLower = -Math.floor(rows / 2)
      const rowsUpper = Math.ceil(rows / 2)

      const cols = 11
      const colsLower = -Math.floor(cols / 2)
      const colsUpper = Math.ceil(cols / 2)

      const target = space.create.entity()
      const randomTargetPosition = (): [number, number] => [
        randomBetween(rowsLower + 2, rowsUpper - 2),
        randomBetween(colsLower + 2, colsUpper - 2),
      ]
      const targetPosition = randomTargetPosition()
      target.add(Position, ...targetPosition)
      target.add(Target)

      for (let i = rowsLower; i < rowsUpper; i++) {
        for (let j = colsLower; j < colsUpper; j++) {
          const entity = space.create.entity()
          entity.add(Position, j, i)
          entity.add(Emoji)
        }
      }

      return () => {
        space.destroy()
      }
    }

    let tearDownGame = setupGame()

    document.querySelector('#reset')!.addEventListener('click', () => {
      tearDownGame()
      tearDownGame = setupGame()
    })

    window.addEventListener('resize', () => {
      world.query([Emoji]).forEach((entity) => {
        entity.get(Emoji).dirty = true
      })
    })

    const now = () => performance.now() / 1000

    let running = true
    let lastTime = now()

    const update = () => {
      if (!running) return

      requestAnimationFrame(update)

      const time = now()
      const delta = time - lastTime
      lastTime = time

      world.update(delta)
    }

    update()

    return () => {
      running = false
      world.destroy()
    }
  })

  return (
    <>
      <div id="emoji-sweeper">
        <p>
          Click the emojis to reveal them. Try to find the bomb in as few clicks
          as possible!
        </p>
        <div id="score"></div>
        <button id="reset">Reset</button>
        <div id="emojis"></div>
      </div>
    </>
  )
}

export default {
  name: 'Find The Bomb',
  component: FindTheBomb,
}
