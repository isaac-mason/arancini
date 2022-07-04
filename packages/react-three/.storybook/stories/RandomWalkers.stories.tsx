import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Component as RComponent } from '@recs/core';
import React from 'react';
import { Group } from 'three';
import { createRECS } from '../../src';
import { Setup } from '../Setup';

export default {
  title: 'Random Walkers',
};

const R = createRECS();

class Walking extends RComponent {}

class Renderable extends RComponent {
  jsx!: JSX.Element;
  group!: Group;

  construct(jsx: JSX.Element): void {
    this.jsx = jsx;
    this.group = new Group();
  }
}

const WalkingSystem = () => {
  const { all: walkers } = R.useQuery([Renderable, Walking]);

  useFrame((_, delta) => {
    walkers.forEach(walker => {
      const { group } = walker.get(Renderable);

      group.position.x += (Math.random() - 0.5) * 0.25 * delta;
      group.position.y += (Math.random() - 0.5) * 0.25 * delta;
      group.position.z += (Math.random() - 0.5) * 0.25 * delta;

      group.rotation.x += (Math.random() - 0.5) * 0.25 * delta;
      group.rotation.y += (Math.random() - 0.5) * 0.25 * delta;
      group.rotation.z += (Math.random() - 0.5) * 0.25 * delta;
    });
  });

  return null;
};

const Renderer = () => {
  const { all: entities } = R.useQuery([Renderable]);
  return (
    <>
      {entities.map(entity => {
        const { jsx, group } = entity.get(Renderable);
        return (
          <primitive key={entity.id} object={group}>
            {jsx}
          </primitive>
        );
      })}
    </>
  );
};

const Box = () => (
  <mesh>
    <boxBufferGeometry args={[0.1, 0.1, 0.1]} />
    <meshNormalMaterial />
  </mesh>
);

const App = () => {
  return (
    <>
      <WalkingSystem />
      <Renderer />

      <R.Space>
        {Array.from({ length: 10 }).map((_, idx) => (
          <R.Entity key={idx}>
            <R.Component type={Renderable}>
              <Box />
            </R.Component>
            <R.Component type={Walking} />
          </R.Entity>
        ))}
      </R.Space>

      <OrbitControls />
    </>
  );
};

export const Example = () => {
  return (
    <>
      <Setup cameraPosition={[0, 0, -1]}>
        <R.World>
          <App />
        </R.World>
      </Setup>
    </>
  );
};
