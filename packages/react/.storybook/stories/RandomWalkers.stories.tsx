import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as RECS from '@recs/core';
import React from 'react';
import { Object3D } from 'three';
import { createECS } from '../../src';
import { Setup } from '../Setup';

export default {
  title: 'Random Walkers',
};

const R = createECS();

const R3FStepper = () => {
  useFrame((_, delta) => {
    R.step(delta);
  });

  return null;
};

class WalkingComponent extends RECS.Component {}

class Object3DComponent extends RECS.Component {
  object3D!: THREE.Object3D;

  construct(object3D: THREE.Object3D): void {
    this.object3D = object3D;
  }
}

class WalkingSystem extends RECS.System {
  walking = this.query([Object3DComponent, WalkingComponent]);

  onUpdate(delta: number) {
    for (const walker of this.walking) {
      const { object3D } = walker.get(Object3DComponent);

      object3D.position.x += (Math.random() - 0.5) * 2 * delta;
      object3D.position.y += (Math.random() - 0.5) * 2 * delta;
      object3D.position.z += (Math.random() - 0.5) * 2 * delta;

      object3D.rotation.x += (Math.random() - 0.5) * 2 * delta;
      object3D.rotation.y += (Math.random() - 0.5) * 2 * delta;
      object3D.rotation.z += (Math.random() - 0.5) * 2 * delta;
    }
  }
}

const App = () => {
  return (
    <>
      {/* stepper for r3f */}
      <R3FStepper />

      {/* space for the walkers */}
      <R.Space>
        {Array.from({ length: 10 }).map((_, idx) => (
          <R.Entity key={idx}>
            {/* how the walker should be displayed */}
            <R.Component type={Object3DComponent}>
              <mesh
                // initial position
                position={[
                  (Math.random() - 0.5) * 4,
                  (Math.random() - 0.5) * 4,
                  (Math.random() - 0.5) * 4,
                ]}
              >
                <boxBufferGeometry args={[1, 1, 1]} />
                <meshNormalMaterial />
              </mesh>
            </R.Component>

            {/* tag component */}
            <R.Component type={WalkingComponent} />
          </R.Entity>
        ))}
      </R.Space>

      {/* class system to move the walkers */}
      <R.System type={WalkingSystem} />

      <OrbitControls />
    </>
  );
};

export const Example = () => {
  return (
    <>
      <Setup cameraPosition={[0, 0, -10]}>
        <App />
      </Setup>
    </>
  );
};
