import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Component as RComponent } from '@recs/core';
import React from 'react';
import * as THREE from 'three';
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

class Walking extends RComponent {}

class Position extends RComponent {
  group!: THREE.Group;

  construct(position: [number, number, number]) {
    this.group = new THREE.Group();
    this.group.position.set(...position);
  }
}
class Renderable extends RComponent {
  jsx!: JSX.Element;

  construct(jsx: JSX.Element): void {
    this.jsx = jsx;
  }
}

const WalkingSystem = () => {
  const { all: walkers } = R.useQuery([Position, Walking]);

  useFrame((_, delta) => {
    walkers.forEach((walker) => {
      const { group } = walker.get(Position);

      group.position.x += (Math.random() - 0.5) * 2 * delta;
      group.position.y += (Math.random() - 0.5) * 2 * delta;
      group.position.z += (Math.random() - 0.5) * 2 * delta;

      group.rotation.x += (Math.random() - 0.5) * 2 * delta;
      group.rotation.y += (Math.random() - 0.5) * 2 * delta;
      group.rotation.z += (Math.random() - 0.5) * 2 * delta;
    });
  });

  return null;
};

const RendererSystem = () => {
  const { all: entities } = R.useQuery([Renderable]);
  return (
    <>
      {entities.map((entity) => {
        const { jsx } = entity.get(Renderable);
        const { group } = entity.get(Position);
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
              type={Position}
              args={[
                Array.from({ length: 3 }).map(
                  () => (Math.random() - 0.5) * 4
                ) as [number, number, number],
              ]}
            />

            {/* how the walker should be displayed */}
            <R.Component type={Renderable}>
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

      {/* system to move the walkers */}
      <WalkingSystem />

      {/* system to render the walkers */}
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
