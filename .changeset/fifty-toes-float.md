---
"@arancini/core": minor
"arancini": minor
---

feat: stop using bitsets for query evaluation, evaluate queries using object keys

The bitset implementation as-is is slower than just checking object keys, even for large numbers of component types.

This may be revisited in the future, but for now, arancini will use object keys for query evaluation to improve performance and simplify the library.
