import { World } from '@arancini/core'
import { createReactAPI } from '@arancini/react'
import { Executor, System } from '@arancini/systems'
import { Canvas, useFrame } from '@react-three/fiber'
import * as P2 from 'p2-es'
import React, { useMemo } from 'react'
import { Repeat } from 'timeline-composer'

export default {
  title: 'React / External Physics Library',
}

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

type EntityType = {
  object3D: THREE.Object3D
  rigidBody: P2.Body
}

class PhysicsSystem extends System<EntityType> {
  bodiesQuery = this.query((e) => e.has('rigidBody'))

  physicsWorld = new P2.World({ gravity: [0, -9.81] })

  onInit() {
    this.physicsWorld.addContactMaterial(boxGroundContactMaterial)
    this.physicsWorld.addContactMaterial(boxBoxContactMaterial)

    this.bodiesQuery.onEntityAdded.add((added) => {
      this.physicsWorld.addBody(added.rigidBody)
    })

    this.bodiesQuery.onEntityRemoved.add((removed) => {
      this.physicsWorld.removeBody(removed.rigidBody)
    })
  }

  onUpdate(delta: number) {
    const stepSize = 1 / 60
    const maxSubSteps = 30
    this.physicsWorld.step(stepSize, delta, maxSubSteps)

    for (const entity of this.bodiesQuery) {
      const { object3D } = entity
      if (object3D === undefined) continue

      const { rigidBody } = entity
      object3D.position.set(rigidBody.position[0], rigidBody.position[1], 0)
      object3D.rotation.set(0, 0, rigidBody.angle)
    }
  }
}

const world = new World<EntityType>()

const rigidBodyQuery = world.query((e) => e.has('rigidBody'))

const executor = new Executor(world)

executor.add(PhysicsSystem)

executor.init()

const { Entity, Component, Entities } = createReactAPI(world)

const Plane = () => {
  const planeBody = useMemo(() => {
    const body = new P2.Body({
      position: [0, -2],
    })

    body.addShape(new P2.Plane({ material: groundMaterial }))

    return body
  }, [])

  return <Entity rigidBody={planeBody} />
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

  return <Entity rigidBody={boxBody} />
}

const App = () => {
  useFrame((_, delta) => {
    executor.update(delta)
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
      <Entities in={rigidBodyQuery}>
        {(entity) => {
          const { rigidBody } = entity

          const boxes: P2.Box[] = []
          const planes: P2.Plane[] = []

          for (const shape of rigidBody.shapes) {
            if (shape.type === P2.Shape.BOX) {
              boxes.push(shape as P2.Box)
            } else if (shape.type === P2.Shape.PLANE) {
              planes.push(shape as P2.Plane)
            }
          }

          return (
            <Component name="object3D">
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
            </Component>
          )
        }}
      </Entities>

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
