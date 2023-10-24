---
"@arancini/core": minor
"arancini": minor
---

feat: change api for defining object and tag components, paving the way for future params

```
// before:
const Object3DComponent = Component.object<THREE.Object3D>("Object3D");

// after:
const Object3DComponent = Component.object({ name: "Object3D" });
```
