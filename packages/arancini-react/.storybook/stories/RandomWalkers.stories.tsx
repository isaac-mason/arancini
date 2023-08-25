import { Component, System, World } from '@arancini/core'
import { OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import { createECS } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Random Walkers',
}

const WalkingComponent = Component.tag('Walking')

const Object3DComponent = Component.object<THREE.Object3D>('Object3D')

class WalkingSystem extends System {
  walking = this.query([Object3DComponent, WalkingComponent])

  onUpdate(delta: number) {
    for (const walker of this.walking) {
      const object3D = walker.get(Object3DComponent)

      object3D.position.x += (Math.random() - 0.5) * 2 * delta
      object3D.position.y += (Math.random() - 0.5) * 2 * delta
      object3D.position.z += (Math.random() - 0.5) * 2 * delta

      object3D.rotation.x += (Math.random() - 0.5) * 2 * delta
      object3D.rotation.y += (Math.random() - 0.5) * 2 * delta
      object3D.rotation.z += (Math.random() - 0.5) * 2 * delta
    }
  }
}

const world = new World()
world.registerComponent(WalkingComponent)
world.registerComponent(Object3DComponent)
world.registerSystem(WalkingSystem)
world.init()

const ECS = createECS(world)

const R3FStepper = () => {
  useFrame((_, delta) => {
    ECS.update(delta)
  })

  return null
}

const App = () => {
  return (
    <>
      {/* stepper for r3f */}
      <R3FStepper />

      {/* create some walkers */}
      {Array.from({ length: 10 }).map((_, idx) => (
        <ECS.Entity key={idx}>
          {/* give the walkers the "walking" tag component */}
          <ECS.Component type={WalkingComponent} />
        </ECS.Entity>
      ))}

      {/* render the walkers */}
      <ECS.QueryEntities query={[WalkingComponent]}>
        {() => (
          <ECS.Component type={Object3DComponent}>
            <mesh
              // random initial position
              position={[
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
              ]}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshNormalMaterial />
            </mesh>
          </ECS.Component>
        )}
      </ECS.QueryEntities>

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
