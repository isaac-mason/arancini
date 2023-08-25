---
"@arancini/core": major
"arancini": major
---

BREAKING CHANGE: the api for defining components has changed

Object and Tag components are now defined with the `defineComponent` and `defineTagComponent` utilities:

```js
// this
const MyComponent = Component.object<{ x: 0 }>()
const MyTagComponent = Component.tag<{ x: 0 }>()

// has changed to
const MyComponent = defineComponent<{ x: 0 }>()
const MyTagComponent = defineTagComponent()
```
