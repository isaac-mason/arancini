import { Component, World } from '@recs/core';

export const addition = () => {
  class Position extends Component {}

  class Velocity extends Component {}

  const world = new World();
  
  const space = world.create.space();

  world.init();

  const N = 100_000;

  for (let i = 0; i < N; i++) {
    const entity = space.create.entity();
    entity.addComponent(Position);
    entity.addComponent(Velocity);
  }
};
