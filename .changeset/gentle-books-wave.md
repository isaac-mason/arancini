---
"@arancini/core": minor
"arancini": minor
---

feat: function query definition

```ts
world.query((entities) => entities.with(Position, Velocity).and.not(Dead));
```
