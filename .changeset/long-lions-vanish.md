---
"@arancini/react": major
"arancini": major
---

feat(react)!: remove "where" prop from `<Entities />`

It was previously possible to pass a query description to `<Entities />`. This is no longer supported. Instead, you must create a query instance and pass that to `<Entities />`.

Before:

```tsx
const Example = () => (
  <Entities where={(e) => e.has('position', 'velocity')}>
    {/* ... */}
  </Entities>
)
```

After:

```tsx
const query = world.query((e) => e.has('position', 'velocity'))

const Example = () => (
  <Entities where={query}>
    {/* ... */}
  </Entities>
)
```
