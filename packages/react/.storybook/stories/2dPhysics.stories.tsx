import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Component, Query, System } from '@recs/core';
import { createWorld } from '@recs/react';
import * as P2 from 'p2-es';
import { Group } from 'three';
import { Repeat } from 'timeline-composer';

// todo - collision events

let R = createWorld();

const R3FStepper = () => {
  useFrame((_, delta) => {
    R.step(delta);
  });

  return null;
};

class Transform extends Component {
  group!: Group;

  construct() {
    this.group = new Group();
  }
}

class JSXElement extends Component {
  jsx!: JSX.Element | JSX.Element[];

  construct(jsx: JSX.Element | JSX.Element[]) {
    this.jsx = jsx;
  }
}

class Collider extends Component {
  body!: P2.Body;

  construct(body: () => P2.Body) {
    this.body = body();
  }
}

class PhysicsSystemState extends Component {
  physicsWorld!: P2.World;
  stepSize!: number;
  bodies!: Map<string, P2.Body>;

  construct(params: { gravity?: [number, number]; stepSize?: number }) {
    this.physicsWorld = new P2.World();
    if (params?.gravity) {
      this.physicsWorld.gravity = params.gravity;
    }

    this.stepSize = params.stepSize ?? 1 / 60;

    this.bodies = new Map();
  }
}

class PhysicsSystem extends System {
  systemStateQuery!: Query;
  bodiesQuery!: Query;

  onInit() {
    this.systemStateQuery = this.query([PhysicsSystemState]);
    this.bodiesQuery = this.query([Collider]);
  }

  onUpdate(delta: number) {
    const state = this.systemStateQuery.first
      ? this.systemStateQuery.first.find(PhysicsSystemState)
      : undefined;
    if (!state) return;

    const { bodies, physicsWorld: world, stepSize } = state;

    for (const added of this.bodiesQuery.added) {
      const body = added.get(Collider).body;
      bodies.set(added.id, body);
      world.addBody(body);
    }

    for (const removed of this.bodiesQuery.removed) {
      const body = bodies.get(removed.id)!;
      world.removeBody(body);
      bodies.delete(removed.id);
    }

    world.step(stepSize, delta, 30);

    for (const entity of this.bodiesQuery.all) {
      const transform = entity.find(Transform);
      if (transform === undefined) continue;

      const { body } = entity.get(Collider);
      transform.group.position.set(body.position[0], body.position[1], 0);
    }
  }
}

const Renderer = () => {
  const { all: entities } = R.useQuery([JSXElement, Transform]);

  return (
    <>
      {entities.map((entity) => {
        const { jsx } = entity.get(JSXElement);
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

const Physics = () => (
  <>
    <R.System system={PhysicsSystem} />
    <R.Entity>
      <R.Component
        type={PhysicsSystemState}
        args={[{ gravity: [0, -9.81], stepSize: 1 / 60 }]}
      />
    </R.Entity>
  </>
);

const Plane = () => (
  <R.Entity>
    <R.Component
      type={Collider}
      args={[
        () => {
          const plane = new P2.Plane();
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
    <R.Component type={Transform} />
    <R.Component type={JSXElement}>
      <mesh>
        <meshNormalMaterial />
        <boxBufferGeometry args={[0.5, 0.5, 0.5]} />
      </mesh>
    </R.Component>
    <R.Component
      type={Collider}
      args={[
        () => {
          const box = new P2.Box({ width: 0.5, height: 0.5 });
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

      {/* render jsx components */}
      <Renderer />

      {/* physics system and physics state */}
      <Physics />

      {/* create the ground */}
      <Plane />

      {/* falling boxes */}
      <Repeat seconds={3}>
        <Box position={[0, 0]} />
        <Box position={[-0.2, 1]} />
        <Box position={[0.2, 2]} />
      </Repeat>
    </>
  );
};

export const Example = () => {
  return (
    <Canvas camera={{ position: [0, 0, -5] }}>
      <R.World>
        <App />
      </R.World>
    </Canvas>
  );
};

export default {
  title: '2D Physics',
};
