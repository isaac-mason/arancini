---
"@arancini/core": minor
"arancini": minor
---

feat: remove query 'reference' tracking

Previously arancini would do reference counting/tracking for queries to support automatic query removal when all usages of a query are removed. This logic is vestigal from the since removed @arancini/systems package.

Reference tracking for queries can be easily re-implemented if needed. But for most use cases, queries are created once and never removed.
