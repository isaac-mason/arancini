import { World } from '@arancini/core'
import { createReactAPI } from '@arancini/react'
import { Html } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { Lifetime, Repeat } from 'timeline-composer'
import { Setup } from './setup'
import React from 'react'

export default {
  title: 'React / Existing World',
}

const world = new World()

world.init()

const { Entity } = createReactAPI(world)

export const ExistingWorld = () => {
  const [worldStats, setWorldStats] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      const n = world.entities.length

      setWorldStats(`${n} ${n === 1 ? 'entity' : 'entities'}`)
    }, 1 / 10)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <>
      <Setup cameraPosition={[0, 0, 20]}>
        <Entity />

        <Repeat seconds={4}>
          <Lifetime seconds={2}>
            <Entity />
          </Lifetime>
        </Repeat>

        <Html style={{ color: 'white' }} transform scale={3}>
          {worldStats}
        </Html>
      </Setup>
    </>
  )
}
