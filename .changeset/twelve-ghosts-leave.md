---
"arancini": minor
"@arancini/core": minor
---

feat: class components are no longer object pooled by default, they must opted in with the `@objectPooled` annotation, or by setting the `objectPooled` property on the component definition

```ts
@objectPooled()
class MyComponent extends Component { /* ... */ }

// or

class MyComponent extends Component { /* ... */ };
MyComponent.objectPooled = true;
```
