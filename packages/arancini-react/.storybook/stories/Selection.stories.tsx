import { Component, System, World } from '@arancini/core'
import { Bounds, PerspectiveCamera } from '@react-three/drei'
import { Vector3, useFrame } from '@react-three/fiber'
import React, { useState } from 'react'
import * as THREE from 'three'
import { createECS } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Selection',
}

/* components */

const SelectedComponent = Component.tag('Selected')

const CameraComponent = Component.object<THREE.PerspectiveCamera>('Camera')

const Object3DComponent = Component.object<THREE.Object3D>('Object3D')

/* systems */

class CameraSystem extends System {
  selectedQuery = this.query([SelectedComponent, Object3DComponent])

  camera = this.singleton(CameraComponent, { required: true })!

  private lerpedLookAt = new THREE.Vector3(0, 0, 0)

  onUpdate(delta: number) {
    const selected = this.selectedQuery.entities.map((entity) =>
      entity.get(Object3DComponent)
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

const world = new World()
world.registerComponent(Object3DComponent)
world.registerComponent(SelectedComponent)
world.registerComponent(CameraComponent)
world.registerSystem(CameraSystem)
world.init()

const ECS = createECS(world)

const SelectableBox = (props: JSX.IntrinsicElements['mesh']) => {
  const entity = ECS.useCurrentEntity()
  const [selected, setSelected] = useState(false)
  const [hovered, setHovered] = useState(false)

  const toggleSelection = () => {
    if (!entity) return

    if (entity.has(SelectedComponent)) {
      entity.remove(SelectedComponent)
      setSelected(false)
    } else {
      entity.add(SelectedComponent)
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
    <ECS.Component type={Object3DComponent}>
      <mesh
        {...props}
        onClick={toggleSelection}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </ECS.Component>
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
      <ECS.Entity key={i}>
        <SelectableBox position={position} />
      </ECS.Entity>
    ))}
  </>
)

const Camera = () => (
  <ECS.Entity>
    <ECS.Component type={CameraComponent}>
      <PerspectiveCamera makeDefault fov={30} position={[0, 0, 30]} />
    </ECS.Component>
  </ECS.Entity>
)

const App = () => {
  useFrame((_, delta) => {
    ECS.update(delta)
  })

  return (
    <>
      <Bounds fit clip observe>
        <SelectableBoxes />
      </Bounds>

      <Camera />

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
