import { Canvas, useFrame } from '@react-three/fiber'
import { Component, System, World } from 'arancini'
import { createECS } from 'arancini/react'
import { Object3D, Vector3, Vector3Tuple } from 'three'

class ThreeComponent extends Component {
  object!: Object3D

  construct(object: Object3D) {
    this.object = object
  }
}

class AngularVelocity extends Component {
  linvel!: Vector3

  construct(...linvel: Vector3Tuple) {
    this.linvel = new Vector3(...linvel)
  }
}

class LinearVelocitySystem extends System {
  linvel = this.query([AngularVelocity, ThreeComponent])

  onUpdate(delta: number): void {
    for (const entity of this.linvel) {
      const { object } = entity.get(ThreeComponent)
      const { linvel } = entity.get(AngularVelocity)

      object.rotation.x += linvel.x * delta
      object.rotation.y += linvel.y * delta
      object.rotation.z += linvel.z * delta
    }
  }
}

const world = new World()

world.registerComponent(ThreeComponent)
world.registerComponent(AngularVelocity)
world.registerSystem(LinearVelocitySystem)
world.init()

const ECS = createECS(world)

const App = () => {
  useFrame((_, delta) => {
    ECS.update(delta)
  })

  return (
    <>
      <ECS.Entity>
        <ECS.Component type={ThreeComponent}>
          <mesh>
            <boxGeometry />
            <meshStandardMaterial color="orange" />
          </mesh>
        </ECS.Component>
        <ECS.Component type={AngularVelocity} args={[0.25, 0.5, 1]} />
      </ECS.Entity>

      <pointLight position={[10, 10, 10]} />
      <ambientLight intensity={0.5} />
    </>
  )
}

export default () => (
  <Canvas>
    <App />
  </Canvas>
)
