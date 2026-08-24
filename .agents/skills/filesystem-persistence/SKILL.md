---
name: filesystem-persistence
description: Change or review the current JSON and local-upload persistence layer, including integrity, concurrency, path safety, and migration readiness.
---

# Filesystem Persistence

The current store is `server/prompts/storage.ts`; `data/` and `uploads/` are runtime data, not a durable cloud database.

## Invariants

- Prevent path traversal and never derive trusted paths from unchecked client input.
- Avoid partial data writes; prefer atomic temporary-write-and-rename behavior.
- Preserve immutable IDs and creation timestamps during updates.
- Consider concurrent requests and multiple process instances before changing write behavior.
- Keep a persistence adapter boundary when preparing a database or object-storage migration.
- Document migration, backup, rollback, and data ownership before replacing the store.
- Never present local filesystem persistence as durable Cloud Run storage.

Test corrupted files, missing directories, write failure, duplicate operations, and restart behavior when the relevant test tooling exists.
