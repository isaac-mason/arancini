export const addRemove = {
  name: 'Add/Remove',
  iterations: 5000,
  setup(ctx) {
    ctx.setup();
  },
  perform(ctx) {
    const entity1 = ctx.createEntity();
    const entity2 = ctx.createEntity();

    ctx.addPositionComponent(entity1);
    ctx.addVelocityComponent(entity1);

    ctx.addPositionComponent(entity2);
    ctx.addVelocityComponent(entity2);

    ctx.updateMovementSystem();

    ctx.removePositionComponent(entity1);

    ctx.updateMovementSystem();

    ctx.destroyEntity(entity1);
  },
};
