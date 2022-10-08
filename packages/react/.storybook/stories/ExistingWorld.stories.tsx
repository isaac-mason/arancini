import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { World } from '@recs/core';
import React, { useEffect, useState } from 'react';
import { Delay, Lifetime, Repeat } from 'timeline-composer';
import { createECS } from '../../src';
import { Setup } from '../Setup';

export default {
  title: 'Existing World',
};

const world = new World();

const R = createECS(world);

const R3FStepper = () => {
  useFrame((_, delta) => {
    R.step(delta);
  });

  return null;
};

export const ExistingWorld = () => {
  const [worldStats, setWorldStats] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const nSpaces = world.spaceManager.spaces.size;

      let nEntities = 0;
      for (const [_, space] of world.spaceManager.spaces) {
        nEntities += space.entities.size;
      }

      setWorldStats(
        `world with id ${world.id} has ${nSpaces} space${
          nSpaces !== 1 ? 's' : ''
        } and ${nEntities} ${nEntities === 1 ? 'entity' : 'entities'}`
      );
    }, 1 / 10);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <Setup cameraPosition={[0, 0, 2]}>
        <R3FStepper />

        <R.World>
          <R.Entity />
        </R.World>

        <Repeat seconds={4}>
          <Lifetime seconds={2}>
            <R.Space>
              <R.Entity />
            </R.Space>
          </Lifetime>
        </Repeat>

        <Text color="white">{worldStats}</Text>
      </Setup>
    </>
  );
};
