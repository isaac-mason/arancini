import * as A from '@arancini/core'
import * as THREE from 'three'
import { Bounds, Environment, PerspectiveCamera } from '@react-three/drei'
import { useFrame, Vector3 } from '@react-three/fiber'
import React, { useEffect, useState } from 'react'
import { createECS } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Selection',
}

const ECS = createECS()

/* events */

type SelectedEvent = {
  topic: 'selected'
  selected: boolean
}

/* components */

class SelectedComponent extends A.Component {}

class CameraComponent extends A.Component {
  camera!: THREE.PerspectiveCamera

  construct(camera: THREE.PerspectiveCamera): void {
    this.camera = camera
  }
}

class Object3DComponent extends A.Component {
  object3D!: THREE.Object3D

  construct(object3D: THREE.Object3D): void {
    this.object3D = object3D
  }
}

ECS.world.registerComponent(Object3DComponent)
ECS.world.registerComponent(SelectedComponent)
ECS.world.registerComponent(CameraComponent)

/* systems */

class SelectedEventSystem extends A.System {
  selectedQuery = this.query([SelectedComponent])

  onInit(): void {
    this.selectedQuery.onEntityAdded.add((entity) => {
      entity.emit<SelectedEvent>({ topic: 'selected', selected: true })
    })
    this.selectedQuery.onEntityRemoved.add((entity) => {
      entity.emit<SelectedEvent>({ topic: 'selected', selected: false })
    })
  }
}

class CameraSystem extends A.System {
  selectedQuery = this.query([SelectedComponent, Object3DComponent])

  cameraQuery = this.query([CameraComponent])

  get camera(): THREE.PerspectiveCamera | undefined {
    return this.cameraQuery.first?.get(CameraComponent).camera
  }

  private lerpedLookAt = new THREE.Vector3(0, 0, 0)

  onUpdate(delta: number) {
    const camera = this.camera
    if (!camera) return

    const selected = this.selectedQuery.entities.map(
      (entity) => entity.get(Object3DComponent).object3D
    )

    const lookAt = new THREE.Vector3(0, 0, 0)

    if (selected.length > 0) {
      for (const object of selected) {
        lookAt.add(object.position)
      }
      lookAt.divideScalar(selected.length)
    }

    this.lerpedLookAt = this.lerpedLookAt.lerp(lookAt, 10 * delta)
    camera.lookAt(this.lerpedLookAt)
  }
}

ECS.world.registerSystem(CameraSystem)
ECS.world.registerSystem(SelectedEventSystem)

const useIsSelected = (entity: A.Entity | undefined) => {
  const [selected, setSelected] = useState(false)

  useEffect(() => {
    if (!entity) return

    const subscription = entity.on<SelectedEvent>('selected', (e) => {
      setSelected(e.selected)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [entity])

  return selected
}

const SelectableBox = (props: JSX.IntrinsicElements['mesh']) => {
  const entity = ECS.useCurrentEntity()
  const isSelected = useIsSelected(entity)
  const [isHovered, setIsHovered] = useState(false)

  const toggleSelection = () => {
    if (!entity) return

    if (entity.has(SelectedComponent)) {
      entity.remove(SelectedComponent)
    } else {
      entity.add(SelectedComponent)
    }
  }

  let color: string
  
  if (isHovered) {
    color = isSelected ? '#FFD580' : '#999'
  } else {
    color = isSelected ? 'orange' : '#555'
  }

  return (
    <ECS.Component type={Object3DComponent}>
      <mesh
        {...props}
        onClick={toggleSelection}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <boxBufferGeometry args={[1, 1, 1]} />
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
      
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 10, 5]} />
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
