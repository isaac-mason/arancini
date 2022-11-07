import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Component, System } from '@recs/core';
import { createECS } from '@recs/react';
import * as P2 from 'p2-es';
import { Repeat } from 'timeline-composer';

const boxMaterial = new P2.Material();
const groundMaterial = new P2.Material();

const boxGroundContactMaterial = new P2.ContactMaterial(boxMaterial, groundMaterial, { friction: 0.75 })
const boxBoxContactMaterial = new P2.ContactMaterial(boxMaterial, groundMaterial, { friction: 0.75 })

let R = createECS();

const R3FStepper = () => {
  useFrame((_, delta) => {
    R.step(delta);
  });

  return null;
};

class Object3DComponent extends Component {
  object3D!: THREE.Object3D;

  construct(object3D: THREE.Object3D) {
    this.object3D = object3D;
  }
}

class ColliderComponent extends Component {
  body!: P2.Body;

  construct(body: () => P2.Body) {
    this.body = body();
  }
}

class PhysicsSystem extends System {
  bodiesQuery = this.query([ColliderComponent]);
  
  physicsWorld!: P2.World;
  bodies!: Map<string, P2.Body>;
  
  onInit(): void {
    this.physicsWorld = new P2.World({ gravity: [0, -9.81]});
    this.physicsWorld.addContactMaterial(boxGroundContactMaterial);
    this.physicsWorld.addContactMaterial(boxBoxContactMaterial);

    this.bodies = new Map();
    
    this.bodiesQuery.onEntityAdded.add((added) => {
      const body = added.get(ColliderComponent).body;
      this.bodies.set(added.id, body);
      this.physicsWorld.addBody(body);
    });

    this.bodiesQuery.onEntityRemoved.add((removed) => {
      const body = this.bodies.get(removed.id)!;
      this.bodies.delete(removed.id);
      this.physicsWorld.removeBody(body);
    });
  }

  onUpdate(delta: number) {
    this.physicsWorld.step(1 / 60, delta, 30);

    for (const entity of this.bodiesQuery) {
      const object3DComponent = entity.find(Object3DComponent);
      if (object3DComponent === undefined) continue;

      const { body } = entity.get(ColliderComponent);
      object3DComponent.object3D.position.set(body.position[0], body.position[1], 0);
      object3DComponent.object3D.rotation.set(0, 0, body.angle)
    }
  }
}

const Plane = () => (
  <R.Entity>
    <R.Component
      type={ColliderComponent}
      args={[
        () => {
          const plane = new P2.Plane({ material: groundMaterial });
          const body = new P2.Body();  
          body.position = [0, -3];
          body.addShape(plane);
          return body;
        },
      ]}
    />
  </R.Entity>
);

const Box = ({ position }: { position: [number, number] }) => (
  <R.Entity>
    <R.Component type={Object3DComponent}>
      <mesh>
        <meshNormalMaterial />
        <boxBufferGeometry args={[0.5, 0.5, 0.5]} />
      </mesh>
    </R.Component>
    <R.Component
      type={ColliderComponent}
      args={[
        () => {
          const box = new P2.Box({ width: 0.5, height: 0.5, material: boxMaterial });
          const body = new P2.Body({ mass: 1 });
          body.position = [...position];
          body.addShape(box);
          return body;
        },
      ]}
    />
  </R.Entity>
);

const App = () => {
  return (
    <>
      {/* loop for r3f */}
      <R3FStepper />

      {/* physics system */}
      <R.System type={PhysicsSystem} />

      {/* create the ground */}
      <Plane />

      {/* falling boxes */}
      <Repeat seconds={3}>
        <Box position={[0, 0]} />
        <Box position={[-0.2, 1]} />
        <Box position={[0.2, 2]} />
        <Box position={[-0.2, 3]} />
        <Box position={[0.2, 4]} />
      </Repeat>
    </>
  );
};

export const Example = () => {
  return (
    <Canvas camera={{ position: [0, 0, -10], fov: 50 }}>
      <App />
    </Canvas>
  );
};

export default {
  title: 'External Physics Library',
};
