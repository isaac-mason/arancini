import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as RECS from '@recs/core';
import React from 'react';
import { createWorld } from '../../src';
import { Setup } from '../Setup';

export default {
  title: 'Spaces',
};

const R = createWorld();

class SpaceIdText extends RECS.Component {
  jsx: JSX.Element | undefined = undefined;

  onInit(): void {
    this.jsx = (
      <>
        <Text color="white">{this.space.id}</Text>
      </>
    )
  }
}

const R3FStepper = () => {
  useFrame((_, delta) => {
    R.step(delta);
  });

  return null;
};

const Renderer = () => {
  const entities = R.useQuery([SpaceIdText]);
  return (
    <>
      {entities.all.map((entity) => (
        <group key={entity.id}>
          {entity.get(SpaceIdText).jsx}
        </group>
      ))}
    </>
  );
}

export const DefaultSpace = () => {
  return (
    <>
      <Setup cameraPosition={[0, 0, 2]}>
        <R3FStepper />

        <R.World>

          {/* Entity in default World Space */}
          <R.Entity>
            <R.Component type={SpaceIdText} />
          </R.Entity>

          {/* Render JSX Components */}
          <Renderer />
        </R.World>
      </Setup>
    </>
  )
}

export const ExplicitSpace = () => {
  return (
    <>
      <Setup cameraPosition={[0, 0, 2]}>
        <R3FStepper />

        <R.World>

          {/* Seperate Space */}
          <R.Space id="some-other-space">

            {/* Entity in explicitly defined Space */}
            <R.Entity>
              <R.Component type={SpaceIdText} />
            </R.Entity>

          </R.Space>

          {/* Render JSX Components */}
          <Renderer />

        </R.World>
      </Setup>
    </>
  );
}