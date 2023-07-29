import * as A from '@arancini/core'
import { Html, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React, { useEffect, useState } from 'react'
import { Lifetime, Repeat } from 'timeline-composer'
import { createECS } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Existing World',
}

const world = new A.World()
world.init()

const ECS = createECS(world)

const R3FStepper = () => {
  useFrame((_, delta) => {
    ECS.update(delta)
  })

  return null
}

export const ExistingWorld = () => {
  const [worldStats, setWorldStats] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      const n = world.entities.size

      setWorldStats(`${n} ${n === 1 ? 'entity' : 'entities'}`)
    }, 1 / 10)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <>
      <Setup cameraPosition={[0, 0, 20]}>
        <R3FStepper />

        <ECS.Entity />

        <Repeat seconds={4}>
          <Lifetime seconds={2}>
            <ECS.Entity />
          </Lifetime>
        </Repeat>

        <Html style={{ color: 'white' }} transform scale={3}>
          {worldStats}
        </Html>
      </Setup>
    </>
  )
}
