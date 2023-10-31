import { World } from '@arancini/core'
import { Bounds, PerspectiveCamera, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React, { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { createECS } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Pong',
}

type EntityType = {
  object3D?: THREE.Object3D
  position?: THREE.Vector2Tuple
  velocity?: THREE.Vector2Tuple
  isPlayer?: boolean
  isAi?: boolean
  ball?: { size: number; speed: number }
  paddle?: { height: number; width: number; speed: number }
  input?: {
    up: boolean
    down: boolean
  }
  score?: {
    value: { left: number; right: number }
    set: (s: React.SetStateAction<{ left: number; right: number }>) => void
  }
}

const world = new World<EntityType>({
  components: [
    'object3D',
    'position',
    'velocity',
    'isPlayer',
    'isAi',
    'ball',
    'paddle',
    'input',
    'score',
  ],
})

world.init()

const { Entity, Component, QueryEntities } = createECS(world)

const queries = {
  paddles: world.query((e) => e.has('paddle', 'input', 'position', 'velocity')),
  aiPaddles: world.query((e) => e.has('paddle', 'position', 'input', 'isAi')),
  ball: world.query((e) => e.has('ball', 'position', 'velocity')),
  score: world.query((e) => e.has('score')),
}

const HEIGHT = 15
const TOP = HEIGHT / 2
const BOTTOM = -HEIGHT / 2
const WIDTH = 20

const INITIAL_BALL_SPEED = 4

const aiSystem = () => {
  const ball = queries.ball.first!

  for (const paddle of queries.aiPaddles) {
    const { input } = paddle

    const [, ballY] = ball.position

    const [, paddleY] = paddle.position

    const graceBuffer = 0.5

    if (ballY > paddleY + graceBuffer) {
      input.up = true
      input.down = false
    } else if (ballY < paddleY - graceBuffer) {
      input.up = false
      input.down = true
    } else {
      input.up = false
      input.down = false
    }
  }
}

const paddleSystem = (delta: number) => {
  for (const entity of queries.paddles) {
    const { position, velocity, input, paddle } = entity

    if (input.up) {
      velocity[1] = paddle.speed * delta
    } else if (input.down) {
      velocity[1] = -paddle.speed * delta
    } else {
      velocity[1] = 0
    }

    let yVelocity = 0

    if (input.up) {
      yVelocity = 1
    } else if (input.down) {
      yVelocity = -1
    }

    yVelocity *= 5 * paddle.speed * delta

    velocity[1] = yVelocity

    position[1] += velocity[1]

    // top and bottom bounds
    position[1] = Math.min(position[1], TOP - paddle.height / 2)
    position[1] = Math.max(position[1], BOTTOM + paddle.height / 2)
  }
}

const ballSystem = (delta: number) => {
  const ball = queries.ball.first

  if (!ball) return

  const {
    position: ballPosition,
    velocity: ballVelocity,
    ball: ballConfig,
  } = ball

  // move ball
  const magnitude = Math.sqrt(ballVelocity[0] ** 2 + ballVelocity[1] ** 2)

  let ballDx = (ballVelocity[0] /= magnitude)
  let ballDy = (ballVelocity[1] /= magnitude)

  ballDx *= ballConfig.speed
  ballDy *= ballConfig.speed

  ballPosition[0] += ballDx * delta
  ballPosition[1] += ballDy * delta

  // bounce off top/bottom
  if (ballPosition[1] > TOP - ballConfig.size / 2) {
    ballVelocity[1] *= -1
    ballPosition[1] = TOP - ballConfig.size / 2
  } else if (ballPosition[1] < BOTTOM + ballConfig.size / 2) {
    ballVelocity[1] *= -1
    ballPosition[1] = BOTTOM + ballConfig.size / 2
  }

  // bounce off paddles
  for (const entity of queries.paddles) {
    const { position: paddlePosition, paddle: paddleConfig } = entity

    // check if the ball overlaps the paddle
    if (
      ballPosition[0] - ballConfig.size / 2 <=
        paddlePosition[0] + paddleConfig.width / 2 &&
      ballPosition[0] + ballConfig.size / 2 >=
        paddlePosition[0] - paddleConfig.width / 2 &&
      ballPosition[1] - ballConfig.size / 2 <=
        paddlePosition[1] + paddleConfig.height / 2 &&
      ballPosition[1] + ballConfig.size / 2 >=
        paddlePosition[1] - paddleConfig.height / 2
    ) {
      // bounce off paddle
      ballVelocity[0] *= -1

      // move the ball out of the paddle
      ballPosition[0] =
        paddlePosition[0] +
        Math.sign(ballVelocity[0]) *
          (paddleConfig.width / 2 + ballConfig.size / 2)

      // set the ball's y velocity based on where it hit the paddle
      ballVelocity[1] =
        (ballPosition[1] - paddlePosition[1]) / ballConfig.size / 2

      // increase speed
      if (ballConfig.speed < 20) {
        ballConfig.speed *= 1.2
      }
    }
  }

  // check if the ball is out of bounds, and if so, reset the ball and update the score
  const { score } = queries.score.first!

  if (ballPosition[0] < -WIDTH / 2) {
    // player lost
    score.set((s) => ({ ...s, right: s.right + 1 }))

    ballConfig.speed = INITIAL_BALL_SPEED

    ballPosition[0] = 0
    ballPosition[1] = 0

    ballVelocity[0] = -1
    ballVelocity[1] = -1
  } else if (ballPosition[0] > WIDTH / 2) {
    // ai lost
    score.set((s) => ({ ...s, left: s.left + 1 }))

    ballConfig.speed = INITIAL_BALL_SPEED

    ballPosition[0] = 0
    ballPosition[1] = 0

    ballVelocity[0] = 1
    ballVelocity[1] = 1
  }
}

const threeSystem = () => {
  for (const entity of world.entities) {
    const { object3D, position } = entity

    if (object3D && position) {
      object3D.position.set(position[0], position[1], 0)
    }
  }
}

const Player = () => {
  const playerInput = useMemo(() => ({ up: false, down: false }), [])

  useEffect(() => {
    const upKeys = ['ArrowUp', 'w']
    const downKeys = ['ArrowDown', 's']

    const onKeyDown = (e: KeyboardEvent) => {
      if (upKeys.includes(e.key)) {
        playerInput.up = true
      } else if (downKeys.includes(e.key)) {
        playerInput.down = true
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (upKeys.includes(e.key)) {
        playerInput.up = false
      } else if (downKeys.includes(e.key)) {
        playerInput.down = false
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return (
    <Entity
      paddle={{ height: 3, width: 1, speed: 1 }}
      isPlayer
      position={[-WIDTH / 2, 0]}
      velocity={[0, 0]}
      input={playerInput}
    />
  )
}

const AiOpponent = () => (
  <Entity
    paddle={{ height: 3, width: 1, speed: 1 }}
    isAi
    position={[WIDTH / 2, 0]}
    velocity={[0, 0]}
    input={{ up: false, down: false }}
  />
)

const Ball = () => (
  <Entity ball={{ size: 1, speed: 5 }} position={[0, 0]} velocity={[-1, -1]}>
    <Component name="object3D">
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshNormalMaterial />
      </mesh>
    </Component>
  </Entity>
)

const Paddles = () => (
  <QueryEntities query={(e) => e.has('paddle')}>
    {(e) => (
      <Component name="object3D">
        <mesh>
          <boxGeometry args={[e.paddle.width, e.paddle.height, 1]} />
          <meshNormalMaterial />
        </mesh>
      </Component>
    )}
  </QueryEntities>
)

const PlayArea = () => (
  <mesh position-z={-0.5}>
    <planeGeometry args={[WIDTH, HEIGHT]} />
    <meshBasicMaterial color="#333" />
  </mesh>
)

const Score = () => {
  const [score, setScore] = useState(() => ({ left: 0, right: 0 }))

  return (
    <>
      <Entity score={{ value: score, set: setScore }} />

      <Text position={[0, 0, -0.45]} color="#999" fontSize={5}>
        {score.left} - {score.right}
      </Text>
    </>
  )
}

const App = () => {
  useFrame((_, delta) => {
    aiSystem()
    paddleSystem(delta)
    ballSystem(delta)
    threeSystem()
  })

  return (
    <>
      <Player />
      <AiOpponent />
      <Ball />

      <Paddles />

      <Score />

      <Bounds fit observe margin={1.2}>
        <PlayArea />
      </Bounds>

      <PerspectiveCamera makeDefault position={[0, 0, 20]} />
    </>
  )
}

export const Pong = () => {
  return (
    <>
      <Setup controls={false} lights={false}>
        <App />
      </Setup>
    </>
  )
}
