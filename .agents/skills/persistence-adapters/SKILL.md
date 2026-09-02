---
name: persistence-adapters
description: Change or review PromptRepository and its filesystem and Firestore adapters while preserving contracts, integrity, and migration safety.
---

# Persistence Adapters

Use this skill for `server/repositories/`, persistence selection, or data migration work.

## Invariants

- Preserve `PromptRepository` behavior across filesystem and Firestore implementations.
- Validate `PERSISTENCE_PROVIDER` on the server; request data must never select the backend.
- Prevent path traversal and partial writes in the filesystem adapter.
- Preserve IDs, creation timestamps, counters, category protections, and duplicate semantics.
- Use Firestore transactions for read-modify-write operations that require atomicity.
- Treat Firestore records and local uploads as separate durability boundaries.
- Document migration, backup, rollback, indexes, credentials, and data ownership before changing providers.
- Never present local filesystem uploads as durable Cloud Run storage.

Test both adapters when behavior shared by the repository contract changes. If Firestore credentials or an emulator are unavailable, report that check as not executed.
