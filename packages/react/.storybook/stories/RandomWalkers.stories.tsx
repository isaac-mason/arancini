import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as RECS from '@recs/core';
import React from 'react';
import * as THREE from 'three';
import { Vector3Tuple } from 'three';
import { createWorld } from '../../src';
import { Setup } from '../Setup';

export default {
  title: 'Random Walkers',
};

const R = createWorld();

const R3FStepper = () => {
  useFrame((_, delta) => {
    R.step(delta);
  });

  return null;
};

class Walking extends RECS.Component {}

class Transform extends RECS.Component {
  group!: THREE.Group;

  construct(props: { position?: Vector3Tuple; rotation?: Vector3Tuple }) {
    this.group = new THREE.Group();
    this.group.position.set(...(props.position ?? [0, 0, 0]));
    this.group.rotation.set(...(props.rotation ?? [0, 0, 0]));
  }
}

class JSX extends RECS.Component {
  jsx!: JSX.Element;

  construct(jsx: JSX.Element): void {
    this.jsx = jsx;
  }
}

class WalkingSystem extends RECS.System {
  walking!: RECS.Query;
  
  onInit() {
    this.walking = this.query([Transform, Walking]);
  }

  onUpdate(delta: number) {
    for (const walker of this.walking.all) {
      const { group } = walker.get(Transform);

      group.position.x += (Math.random() - 0.5) * 2 * delta;
      group.position.y += (Math.random() - 0.5) * 2 * delta;
      group.position.z += (Math.random() - 0.5) * 2 * delta;

      group.rotation.x += (Math.random() - 0.5) * 2 * delta;
      group.rotation.y += (Math.random() - 0.5) * 2 * delta;
      group.rotation.z += (Math.random() - 0.5) * 2 * delta;
    }
  }
}

const RendererSystem = () => {
  const { all: entities } = R.useQuery([JSX]);
  return (
    <>
      {entities.map((entity) => {
        const { jsx } = entity.get(JSX);
        const { group } = entity.get(Transform);
        return (
          <primitive key={entity.id} object={group}>
            {jsx}
          </primitive>
        );
      })}
    </>
  );
};

const App = () => {
  return (
    <>
      {/* stepper for r3f */}
      <R3FStepper />

      {/* space for the walkers */}
      <R.Space>
        {Array.from({ length: 10 }).map((_, idx) => (
          <R.Entity key={idx}>
            {/* initial position */}
            <R.Component
              type={Transform}
              args={[
                {
                  position: [
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4,
                  ],
                },
              ]}
            />

            {/* how the walker should be displayed */}
            <R.Component type={JSX}>
              <mesh>
                <boxBufferGeometry args={[1, 1, 1]} />
                <meshNormalMaterial />
              </mesh>
            </R.Component>

            {/* tag component */}
            <R.Component type={Walking} />
          </R.Entity>
        ))}
      </R.Space>

      {/* class system to move the walkers */}
      <R.System type={WalkingSystem} />

      {/* component system to render the walkers */}
      <RendererSystem />

      <OrbitControls />
    </>
  );
};

export const Example = () => {
  return (
    <>
      <Setup cameraPosition={[0, 0, -10]}>
        <R.World>
          <App />
        </R.World>
      </Setup>
    </>
  );
};
