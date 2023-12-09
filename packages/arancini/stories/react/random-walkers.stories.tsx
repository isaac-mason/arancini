import { World } from '@arancini/core'
import { Executor, System } from '@arancini/systems'
import { createReactAPI } from '@arancini/react'
import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import { Setup } from './setup'

export default {
  title: 'React / Random Walkers',
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

const executor = new Executor(world)

executor.add(WalkingSystem)

executor.init()

const { Entity, Entities, Component } = createReactAPI(world)

const App = () => {
  useFrame((_, delta) => {
    executor.update(delta)
  })

  return (
    <>
      {Array.from({ length: 10 }).map((_, idx) => (
        <Entity key={idx} walking />
      ))}

      <Entities where={(e) => e.has('walking')}>
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
      </Entities>

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
