---
"@arancini/core": minor
"arancini": minor
---

feat: remove world.id and world.entity

Computing ids based on object identity is easy to do in userland if required. See below:

```ts
let entityIdCounter = 0
const entityToId = new Map<E, number>()
const idToEntity = new Map<number, E>()

const getEntityId = (entity: E) => {
    let id = entityToId.get(entity)

    if (id === undefined) {
        id = entityIdCounter++
        entityToId.set(entity, id)
    }

    return id
}

const getEntityById = (id: number) => idToEntity.get(id)
```
