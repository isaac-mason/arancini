import * as A from '@arancini/core'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React, { useEffect, useState } from 'react'
import { Lifetime, Repeat } from 'timeline-composer'
import { createECS } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Existing World',
}

const world = new A.World()

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
      const nSpaces = world.spaceManager.spaces.size

      let nEntities = 0
      for (const [_, space] of world.spaceManager.spaces) {
        nEntities += space.entities.size
      }

      setWorldStats(
        `world with id ${world.id} has ${nSpaces} space${
          nSpaces !== 1 ? 's' : ''
        } and ${nEntities} ${nEntities === 1 ? 'entity' : 'entities'}`
      )
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
            <ECS.Space>
              <ECS.Entity />
            </ECS.Space>
          </Lifetime>
        </Repeat>

        <Text color="white">{worldStats}</Text>
      </Setup>
    </>
  )
}
