---
"arancini": major
---

feat: move Systems functionality out of @arancini/core, into @arancini/systems

Systems are no longer part of the core functionality of arancini, and are now a separate package `@arancini/systems`.

This makes arancini much better for users who BYO systems.

This is a breaking change, but updating is straightforward.

**Migrating**:

In arancini v4, you would create a world, register systems, and then call `world.step` to run systems.

```ts
import { World, System } from 'arancini'

class ExampleSystem extends System {}

const world = new World({
    components: [/* ... */]
})

world.registerSystem(ExampleSystem)

world.init()

world.step(1 / 60)
```

In arancini v5, you create a world, create an executor, add systems to the executor, and then call `executor.update` to run systems.

```ts
import { World } from 'arancini'
import { Executor, System } from 'arancini/systems'

class ExampleSystem extends System {}

const world = new World({
    components: [/* ... */]
})

const executor = new Executor(world)

executor.add(ExampleSystem)

executor.init()

executor.update(1 / 60)
```

