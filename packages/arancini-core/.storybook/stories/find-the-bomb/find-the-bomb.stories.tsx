import { System, World } from '@arancini/core'
import React, { useEffect } from 'react'

import './find-the-bomb.css'

type Entity = {
  gameState?: {
    clicks: number
    foundBomb: boolean
  }
  emoji?: {
    revealed: boolean
    dirty: boolean
    domElement: HTMLElement
  }
  position?: {
    x: number
    y: number
  }
  distanceToTarget?: {
    distance: number
  }
  target?: boolean
}

class EmojiRendererSystem extends System<Entity> {
  emojisToRender = this.query((entities) =>
    entities.with('position', 'emoji', 'distanceToTarget')
  )

  emojisDomElement = document.getElementById('emojis')!

  onInit(): void {
    this.emojisToRender.onEntityAdded.add((entity) => {
      const { emoji } = entity
      this.emojisDomElement.appendChild(emoji.domElement)
      emoji.dirty = true
    })
  }

  onDestroy(): void {
    for (const entity of this.emojisToRender) {
      const { emoji } = entity
      emoji.domElement.remove()
    }
  }

  onUpdate() {
    for (const entity of this.emojisToRender) {
      const { emoji } = entity
      if (!emoji.dirty) continue

      const { position, distanceToTarget } = entity
      if (!distanceToTarget) continue

      const { distance } = distanceToTarget

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
      const x = position.x * paddingPx
      const y = position.y * paddingPx
      emoji.domElement.className = `emoji ${emoji.revealed ? 'revealed' : ''}`
      emoji.domElement.style.left = `${
        x + document.body.clientWidth / 2 - paddingPx / 2
      }px`
      emoji.domElement.style.top = `${y - paddingPx / 2}px`

      emoji.dirty = false
    }
  }
}

class DistanceSystem extends System<Entity> {
  emojis = this.query((entities) => entities.with('emoji', 'position'))

  target = this.query((entities) => entities.with('target', 'position'))

  onInit(): void {
    this.emojis.onEntityAdded.add((entity) => {
      const { position: { x, y } } = entity

      const { position } = this.target.first!

      const distance = Math.sqrt(
        Math.pow(position.x - x, 2) + Math.pow(position.y - y, 2)
      )

      this.world.add(entity, 'distanceToTarget', { distance })
    })
  }
}

class InteractionSystem extends System<Entity> {
  emojis = this.query((entities) => entities.with('emoji', 'position'))

  target = this.query((entities) => entities.with('target', 'position'))

  gameState = this.singleton('gameState', { required: true })

  nRevealedDomElement = document.createElement('p')

  onInit(): void {
    document.querySelector('#score')!.appendChild(this.nRevealedDomElement)

    this.nRevealedDomElement.innerText = 'Click on an emoji to start'

    this.emojis.onEntityAdded.add((entity) => {
      const { emoji } = entity

      emoji.domElement.addEventListener('click', () => {
        if (!this.gameState || this.gameState.foundBomb) return

        if (!emoji.revealed) {
          emoji.revealed = true
          this.gameState.clicks += 1

          const target = this.target.first!
          const { position: targetPosition } = target
          const { position: clickedPosition } = entity

          if (
            targetPosition.x === clickedPosition.x &&
            targetPosition.y === clickedPosition.y
          ) {
            this.gameState.foundBomb = true
            this.nRevealedDomElement.innerText =
              'You found the bomb in ' +
              this.gameState.clicks.toString() +
              ' clicks!'
          } else {
            this.nRevealedDomElement.innerText = InteractionSystem.scoreText(
              this.gameState.clicks
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
    const world = new World<Entity>({
      components: [
        'position',
        'emoji',
        'distanceToTarget',
        'target',
        'gameState',
      ]
    })

    world
      .registerSystem(DistanceSystem)
      .registerSystem(EmojiRendererSystem)
      .registerSystem(InteractionSystem)

    world.init()

    const randomBetween = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1) + min)

    const setupGame = () => {
      const gameState = { gameState: { clicks: 0, foundBomb: false } }
      world.create(gameState)

      const rows = 11
      const rowsLower = -Math.floor(rows / 2)
      const rowsUpper = Math.ceil(rows / 2)

      const cols = 11
      const colsLower = -Math.floor(cols / 2)
      const colsUpper = Math.ceil(cols / 2)

      const target = {
        position: {
          x: randomBetween(rowsLower + 2, rowsUpper - 2),
          y: randomBetween(colsLower + 2, colsUpper - 2),
        },
        target: true,
      }

      world.create(target)

      for (let i = rowsLower; i < rowsUpper; i++) {
        for (let j = colsLower; j < colsUpper; j++) {
          const emoji = {
            position: { x: j, y: i },
            emoji: {
              revealed: false,
              dirty: false,
              domElement: document.createElement('div'),
            },
          }
          world.create(emoji)
        }
      }

      return () => {
        world.reset()
      }
    }

    let destroyGame = setupGame()

    document.querySelector('#reset')!.addEventListener('click', () => {
      destroyGame()
      destroyGame = setupGame()
    })

    window.addEventListener('resize', () => {
      world
        .filter((entities) => entities.with('emoji'))
        .forEach((entity) => {
          entity.emoji.dirty = true
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

      world.step(delta)
    }

    update()

    return () => {
      running = false
      world.reset()
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
