import { System, World } from '@arancini/core'
import { Bounds, PerspectiveCamera } from '@react-three/drei'
import { Vector3, useFrame } from '@react-three/fiber'
import React, { useState } from 'react'
import * as THREE from 'three'
import { createECS } from '../../src'
import { Setup } from '../setup'

export default {
  title: 'Selection',
}

type EntityType = {
  object3D?: THREE.Object3D
  camera?: THREE.PerspectiveCamera
  selected?: boolean
}

class CameraSystem extends System<EntityType> {
  selectedQuery = this.query((e) => e.has('selected', 'object3D'))

  camera = this.singleton('camera', { required: true })!

  private lerpedLookAt = new THREE.Vector3(0, 0, 0)

  onUpdate(delta: number) {
    const selected = this.selectedQuery.entities.map(
      (entity) => entity.object3D
    )

    const lookAt = new THREE.Vector3(0, 0, 0)

    if (selected.length > 0) {
      for (const object of selected) {
        lookAt.add(object.position)
      }
      lookAt.divideScalar(selected.length)
    }

    this.lerpedLookAt = this.lerpedLookAt.lerp(lookAt, 10 * delta)
    this.camera.lookAt(this.lerpedLookAt)
  }
}

const world = new World<EntityType>({
  components: ['object3D', 'camera', 'selected'],
})

world.registerSystem(CameraSystem)

world.init()

const { step, useCurrentEntity, Component, Entity } = createECS(world)

const SelectableBox = (props: JSX.IntrinsicElements['mesh']) => {
  const entity = useCurrentEntity()
  const [selected, setSelected] = useState(false)
  const [hovered, setHovered] = useState(false)

  const toggleSelection = () => {
    if (!entity) return

    if (entity.selected) {
      world.remove(entity, 'selected')
      setSelected(false)
    } else {
      world.add(entity, 'selected', true)
      setSelected(true)
    }
  }

  let color: string

  if (hovered) {
    color = selected ? '#FFD580' : '#999'
  } else {
    color = selected ? 'orange' : '#555'
  }

  return (
    <Component name="object3D">
      <mesh
        {...props}
        onClick={toggleSelection}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </Component>
  )
}

const rows = 10
const cols = 10

const boxPositions = Array.from({ length: rows * cols }, (_, i) => {
  const x = (i % cols) - (cols - 1) / 2
  const y = Math.floor(i / cols) - (rows - 1) / 2
  return [x * 1.5, y * 1.5, 0]
}) as Vector3[]

const SelectableBoxes = () => (
  <>
    {boxPositions.map((position, i) => (
      <Entity key={i}>
        <SelectableBox position={position} />
      </Entity>
    ))}
  </>
)

const Camera = () => (
  <Entity>
    <Component name="camera">
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 30]} />
    </Component>
  </Entity>
)

const App = () => {
  useFrame((_, delta) => {
    step(delta)
  })

  return (
    <>
      <Camera />

      <Bounds fit clip observe>
        <SelectableBoxes />
      </Bounds>

      <ambientLight intensity={1.5} />
      <directionalLight intensity={3} position={[5, 10, 5]} />
    </>
  )
}

export const Example = () => {
  return (
    <>
      <Setup controls={false} lights={false}>
        <App />
      </Setup>
    </>
  )
}
