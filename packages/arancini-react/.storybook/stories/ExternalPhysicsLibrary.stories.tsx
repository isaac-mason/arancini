import { Component, System, World } from '@arancini/core'
import { createECS } from '@arancini/react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as P2 from 'p2-es'
import React, { useMemo } from 'react'
import { Repeat } from 'timeline-composer'

const boxMaterial = new P2.Material()
const groundMaterial = new P2.Material()

const boxGroundContactMaterial = new P2.ContactMaterial(
  boxMaterial,
  groundMaterial,
  { friction: 0.75 }
)
const boxBoxContactMaterial = new P2.ContactMaterial(
  boxMaterial,
  groundMaterial,
  { friction: 0.75 }
)

const Object3DComponent = Component.object<THREE.Object3D>('Object3D')

class RigidBodyComponent extends Component {
  body!: P2.Body

  construct(body: P2.Body) {
    this.body = body
  }
}

class PhysicsSystem extends System {
  bodiesQuery = this.query([RigidBodyComponent])

  physicsWorld = new P2.World({ gravity: [0, -9.81] })

  bodies = new Map<string, P2.Body>()

  onInit() {
    this.physicsWorld.addContactMaterial(boxGroundContactMaterial)
    this.physicsWorld.addContactMaterial(boxBoxContactMaterial)

    this.bodiesQuery.onEntityAdded.add((added) => {
      const body = added.get(RigidBodyComponent).body
      this.bodies.set(added.id, body)
      this.physicsWorld.addBody(body)
    })

    this.bodiesQuery.onEntityRemoved.add((removed) => {
      const body = this.bodies.get(removed.id)!
      this.bodies.delete(removed.id)
      this.physicsWorld.removeBody(body)
    })
  }

  onUpdate(delta: number) {
    const stepSize = 1 / 60
    const maxSubSteps = 30
    this.physicsWorld.step(stepSize, delta, maxSubSteps)

    for (const entity of this.bodiesQuery) {
      const object3D = entity.find(Object3DComponent)
      if (object3D === undefined) continue

      const { body } = entity.get(RigidBodyComponent)
      object3D.position.set(body.position[0], body.position[1], 0)
      object3D.rotation.set(0, 0, body.angle)
    }
  }
}

const world = new World()
world.registerComponent(RigidBodyComponent)
world.registerComponent(Object3DComponent)
world.registerSystem(PhysicsSystem)
world.init()

const ECS = createECS(world)

const Queries = {
  TO_RENDER: ECS.world.query([RigidBodyComponent]),
}

const Plane = () => {
  const planeBody = useMemo(() => {
    const body = new P2.Body({
      position: [0, -2],
    })

    body.addShape(new P2.Plane({ material: groundMaterial }))

    return body
  }, [])

  return (
    <ECS.Entity>
      <ECS.Component type={RigidBodyComponent} args={[planeBody]} />
    </ECS.Entity>
  )
}

type BoxProps = {
  position: [number, number]
  width: number
  height: number
}

const Box = ({ position, width, height }: BoxProps) => {
  const boxBody = useMemo(() => {
    const body = new P2.Body({ mass: 1, position: [...position] })

    body.addShape(
      new P2.Box({
        width,
        height,
        material: boxMaterial,
      })
    )

    return body
  }, [])

  return (
    <ECS.Entity>
      <ECS.Component type={RigidBodyComponent} args={[boxBody]} />
    </ECS.Entity>
  )
}

const App = () => {
  useFrame((_, delta) => {
    ECS.update(delta)
  })

  return (
    <>
      {/* create the ground */}
      <Plane />

      {/* falling boxes */}
      <Repeat seconds={3}>
        <Box width={0.5} height={0.5} position={[0, 0]} />
        <Box width={2} height={0.5} position={[-0.2, 1]} />
        <Box width={0.5} height={0.5} position={[0.2, 2]} />
        <Box width={1} height={0.5} position={[-0.2, 3]} />
        <Box width={0.5} height={0.5} position={[0.2, 4]} />
      </Repeat>

      {/* render rigid bodies */}
      <ECS.QueryEntities query={Queries.TO_RENDER}>
        {(entity) => {
          const colliderComponent = entity.get(RigidBodyComponent)

          const boxes: P2.Box[] = []
          const planes: P2.Plane[] = []

          for (const shape of colliderComponent.body.shapes) {
            if (shape instanceof P2.Box) {
              boxes.push(shape)
            } else if (shape instanceof P2.Plane) {
              planes.push(shape)
            }
          }

          return (
            <ECS.Component type={Object3DComponent}>
              <group>
                {/* render box shapes */}
                {boxes.map((box, index) => (
                  <mesh key={index}>
                    <meshStandardMaterial color="orange" />
                    <boxGeometry
                      args={[
                        (box as P2.Box).width,
                        (box as P2.Box).height,
                        0.5,
                      ]}
                    />
                  </mesh>
                ))}

                {/* render plane shapes */}
                {planes.map((plane, index) => (
                  <mesh key={index} rotation={[-Math.PI / 2, 0, plane.angle]}>
                    <meshStandardMaterial color="#333" />
                    <planeGeometry args={[100, 100]} />
                  </mesh>
                ))}
              </group>
            </ECS.Component>
          )
        }}
      </ECS.QueryEntities>

      {/* lights */}
      <ambientLight intensity={1.5} />
      <directionalLight intensity={3} position={[10, 10, -2]} />
    </>
  )
}

export const Example = () => {
  return (
    <Canvas camera={{ position: [0, 0, -10], fov: 50 }}>
      <App />
    </Canvas>
  )
}

export default {
  title: 'External Physics Library',
}
