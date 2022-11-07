import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as RECS from '@recs/core';
import React from 'react';
import { createECS } from '../../src';
import { Setup } from '../Setup';

export default {
  title: 'Spaces',
};

const R = createECS();

const R3FStepper = () => {
  useFrame((_, delta) => {
    R.step(delta);
  });

  return null;
};

class ExampleTagComponent extends RECS.Component {}

class Object3DComponent extends RECS.Component {
  object3D!: THREE.Object3D;

  construct(object3D: THREE.Object3D): void {
    this.object3D = object3D;
  }
}

const EntitiesAndTheirSpaces = () => (
  <R.QueryEntities query={[ExampleTagComponent]}>
    {(entity) => (
      <R.Component type={Object3DComponent}>
        <Html center style={{ color: 'white', width: '200px' }}>
          entity {entity.id} is in space {entity.space.id}
        </Html>
      </R.Component>
    )}
  </R.QueryEntities>
);

export const DefaultSpace = () => {
  return (
    <>
      <Setup cameraPosition={[0, 0, 2]}>
        <>
          <R3FStepper />

          {/* create an entity in default space */}
          <R.Entity>
            <R.Component type={ExampleTagComponent} />
          </R.Entity>

          {/* render entity space ids */}
          <EntitiesAndTheirSpaces />
        </>
      </Setup>
    </>
  );
};

export const ExplicitSpace = () => {
  return (
    <>
      <Setup cameraPosition={[0, 0, 2]}>
        <>
          <R3FStepper />

          {/* create a space */}
          <R.Space id="some-other-space">
            <R.Entity>
              <R.Component type={ExampleTagComponent} />
            </R.Entity>
          </R.Space>

          {/* render entity space ids */}
          <EntitiesAndTheirSpaces />
        </>
      </Setup>
    </>
  );
};
