---
"@arancini/core": minor
"arancini": minor
---

feat: rename `world.find` to `world.filter` for getting multiple query results, `world.find` for getting a single result

```ts
// get all entities with ExampleComponent
const entities = world.filter([ExampleComponent]);

// find the first entity with ExampleComponent
const entity = world.find([ExampleComponent]);
```
