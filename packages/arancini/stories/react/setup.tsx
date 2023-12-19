import { OrbitControls } from '@react-three/drei'
import { Canvas, Props as CanvasProps } from '@react-three/fiber'
import * as React from 'react'

type Props = React.PropsWithChildren<
  CanvasProps & {
    cameraFov?: number
    cameraPosition?: [number, number, number]
    controls?: boolean
    lights?: boolean
  }
>

export const Setup = ({
  children,
  cameraFov = 75,
  cameraPosition = [-5, 5, 5],
  controls = true,
  lights = true,
  ...restProps
}: Props) => (
  <Canvas
    shadows
    camera={{ position: cameraPosition, fov: cameraFov }}
    {...restProps}
  >
    <React.StrictMode>
      {children}
      {lights && (
        <>
          <ambientLight intensity={0.8} />
          <pointLight intensity={1} position={[0, 6, 0]} />
        </>
      )}
      {controls && <OrbitControls makeDefault />}
    </React.StrictMode>
  </Canvas>
)
