import * as A from '@arancini/core'
import { Html } from '@react-three/drei'
import { button, useControls } from 'leva'
import React, { useImperativeHandle } from 'react'
import { createECS } from '../../src'
import { Setup } from '../Setup'

export default {
  title: 'Components',
}

const useRerender = () => {
  const [, setTick] = React.useState(0)

  return () => {
    setTick((tick) => tick + 1)
  }
}

let rerenders = 0

class ExampleComponentWithMultipleArgs extends A.Component {
  argOne!: number
  argTwo!: number

  static timesRecreated = 0

  construct(argOne: number, argTwo: number) {
    this.argOne = argOne
    this.argTwo = argTwo
    ExampleComponentWithMultipleArgs.timesRecreated++
  }
}

class ExampleComponentWithSingleArg extends A.Component {
  argOne!: number

  static timesRecreated = 0

  construct(argOne: number) {
    this.argOne = argOne
    ExampleComponentWithSingleArg.timesRecreated++
  }
}

const world = new A.World()
world.registerComponent(ExampleComponentWithMultipleArgs)
world.registerComponent(ExampleComponentWithSingleArg)
world.init()

const ECS = createECS(world)

export const Args = () => {
  const rerender = useRerender()

  const { argOne, argTwo } = useControls({
    rerender: button(rerender),
    argOne: 1,
    argTwo: 2,
  })

  return (
    <>
      <Setup cameraPosition={[0, 0, 2]}>
        <>
          <ECS.Entity>
            <ECS.Component
              type={ExampleComponentWithMultipleArgs}
              args={[argOne, argTwo]}
            />
          </ECS.Entity>

          <ECS.QueryEntities query={[ExampleComponentWithMultipleArgs]}>
            {(entity) => (
              <Html
                center
                style={{
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '1em',
                  width: '300px',
                  textAlign: 'left',
                  whiteSpace: 'pre',
                }}
              >
                <>
                  <div>rerenders: {++rerenders}</div>
                  <div>
                    times recreated:{' '}
                    {ExampleComponentWithMultipleArgs.timesRecreated}
                  </div>
                  <div>
                    argOne:{' '}
                    {entity.get(ExampleComponentWithMultipleArgs).argOne}
                  </div>
                  <div>
                    argTwo:{' '}
                    {entity.get(ExampleComponentWithMultipleArgs).argTwo}
                  </div>
                </>
              </Html>
            )}
          </ECS.QueryEntities>
        </>
      </Setup>
    </>
  )
}

const ExampleRefComponent = React.forwardRef<number, { argOne: number }>(
  ({ argOne }, ref) => {
    useImperativeHandle(ref, () => argOne, [argOne])

    return null
  }
)

export const RefCapture = () => {
  const rerender = useRerender()

  const { argOne } = useControls({
    rerender: button(rerender),
    argOne: 1,
  })

  return (
    <>
      <Setup cameraPosition={[0, 0, 2]}>
        <>
          <ECS.Entity>
            <ECS.Component type={ExampleComponentWithSingleArg}>
              <ExampleRefComponent argOne={argOne} />
            </ECS.Component>
          </ECS.Entity>

          <ECS.QueryEntities query={[ExampleComponentWithSingleArg]}>
            {(entity) => (
              <Html
                center
                style={{
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '1em',
                  width: '300px',
                  textAlign: 'left',
                  whiteSpace: 'pre',
                }}
              >
                <>
                  <div>rerenders: {++rerenders}</div>
                  <div>
                    times recreated:{' '}
                    {ExampleComponentWithSingleArg.timesRecreated}
                  </div>
                  <div>
                    argOne: {entity.get(ExampleComponentWithSingleArg).argOne}
                  </div>
                </>
              </Html>
            )}
          </ECS.QueryEntities>
        </>
      </Setup>
    </>
  )
}
