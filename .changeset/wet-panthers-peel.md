---
"@arancini/react": major
"arancini": major
---

feat(react)!: `useQuery` now only supports query instances

It was previously possible to pass a query description to `useQuery`. This is no longer supported. Instead, you must create a query instance and pass that to `useQuery`.

Before:

```ts
const Example = () => {
  const entities = useQuery((e) => e.has('position', 'velocity'))

  // ...
}
```

After:

```ts
const query = world.query((e) => e.has('position', 'velocity'))

const Example = () => {
  const entities = useQuery(query)

  // ...
}
```
