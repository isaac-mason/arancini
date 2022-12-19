import * as A from '@arancini/core'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import React from 'react'
import { createECS } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Spaces',
}

class ExampleTagComponent extends A.Component {}

class Object3DComponent extends A.Component {
  object3D!: THREE.Object3D

  construct(object3D: THREE.Object3D): void {
    this.object3D = object3D
  }
}

const ECS = createECS()

ECS.world.registerComponent(ExampleTagComponent)
ECS.world.registerComponent(Object3DComponent)

const R3FStepper = () => {
  useFrame((_, delta) => {
    ECS.update(delta)
  })

  return null
}

const EntitiesAndTheirSpaces = () => (
  <ECS.QueryEntities query={[ExampleTagComponent]}>
    {(entity) => (
      <ECS.Component type={Object3DComponent}>
        <Html center style={{ color: 'white', width: '200px' }}>
          entity {entity.id} is in space {entity.space.id}
        </Html>
      </ECS.Component>
    )}
  </ECS.QueryEntities>
)

export const DefaultSpace = () => {
  return (
    <>
      <Setup cameraPosition={[0, 0, 2]}>
        <>
          <R3FStepper />

          {/* create an entity in default space */}
          <ECS.Entity>
            <ECS.Component type={ExampleTagComponent} />
          </ECS.Entity>

          {/* render entity space ids */}
          <EntitiesAndTheirSpaces />
        </>
      </Setup>
    </>
  )
}

export const ExplicitSpace = () => {
  return (
    <>
      <Setup cameraPosition={[0, 0, 2]}>
        <>
          <R3FStepper />

          {/* create a space */}
          <ECS.Space id="some-other-space">
            <ECS.Entity>
              <ECS.Component type={ExampleTagComponent} />
            </ECS.Entity>
          </ECS.Space>

          {/* render entity space ids */}
          <EntitiesAndTheirSpaces />
        </>
      </Setup>
    </>
  )
}
