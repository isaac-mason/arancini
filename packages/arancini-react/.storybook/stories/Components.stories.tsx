import * as A from '@arancini/core'
import { Html } from '@react-three/drei'
import React from 'react'
import { createECS } from '../../src'
import { Setup } from '../Setup'
import { useControls } from 'leva'

export default {
  title: 'Components',
}

class ExampleComponent extends A.Component {
  arg!: number

  construct(arg: number) {
    this.arg = arg
  }
}

const world = new A.World()
world.registerComponent(ExampleComponent)
world.init()

const ECS = createECS(world)

export const Components = () => {
  const { arg } = useControls({ arg: 1 })

  return (
    <>
      <Setup cameraPosition={[0, 0, 2]}>
        <>
          <ECS.Entity>
            <ECS.Component type={ExampleComponent} args={[arg]} />
          </ECS.Entity>

          <ECS.QueryEntities query={[ExampleComponent]}>
            {(entity) => (
              <Html
                center
                style={{
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '1em',
                  width: '300px',
                  textAlign: 'center'
                }}
              >
                <>
                  <h1>{entity.get(ExampleComponent).arg}</h1>
                </>
              </Html>
            )}
          </ECS.QueryEntities>
        </>
      </Setup>
    </>
  )
}
