export const destroy = {
  name: 'Destroy',
  iterations: 100000,
  setup(ctx) {
    ctx.setup();
  },
  perform(ctx) {
    const entity = ctx.createEntity();

    ctx.addPositionComponent(entity);
    ctx.addVelocityComponent(entity);

    ctx.destroyEntity(entity);
  },
};
