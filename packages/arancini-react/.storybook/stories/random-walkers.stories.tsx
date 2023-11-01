import { System, World } from '@arancini/core'
import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import { createECS } from '../../src'
import { Setup } from '../setup'

export default {
  title: 'Random Walkers',
}

type EntityType = {
  object3D?: THREE.Object3D
  walking?: boolean
}

class WalkingSystem extends System<EntityType> {
  walking = this.query((e) => e.has('object3D', 'walking'))

  onUpdate(delta: number) {
    for (const walker of this.walking) {
      const { object3D } = walker

      object3D.position.x += (Math.random() - 0.5) * 2 * delta
      object3D.position.y += (Math.random() - 0.5) * 2 * delta
      object3D.position.z += (Math.random() - 0.5) * 2 * delta

      object3D.rotation.x += (Math.random() - 0.5) * 2 * delta
      object3D.rotation.y += (Math.random() - 0.5) * 2 * delta
      object3D.rotation.z += (Math.random() - 0.5) * 2 * delta
    }
  }
}

const world = new World<EntityType>({
  components: ['object3D', 'walking'],
})

world.registerSystem(WalkingSystem)

world.init()

const { step, Entity, QueryEntities, Component } = createECS(world)

const App = () => {
  useFrame((_, delta) => {
    step(delta)
  })

  return (
    <>
      {Array.from({ length: 10 }).map((_, idx) => (
        <Entity key={idx} walking />
      ))}

      <QueryEntities query={(e) => e.has('walking')}>
        {() => (
          <Component name="object3D">
            <mesh
              position={[
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
              ]}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshNormalMaterial />
            </mesh>
          </Component>
        )}
      </QueryEntities>

      <OrbitControls />
    </>
  )
}

export const Example = () => {
  return (
    <>
      <Setup cameraPosition={[0, 0, -10]}>
        <App />
      </Setup>
    </>
  )
}
