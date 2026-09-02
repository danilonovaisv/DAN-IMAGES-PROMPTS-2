---
name: express-api-contracts
description: Implement or review Express 5 endpoints, validation, authentication, Workspace imports, uploads, and TypeScript contracts shared with the React client.
---

# Express API Contracts

Read `.context/project-context.md` and inspect both the affected route and `src/services/api.ts`.

## Invariants

- Validate body, params, query, files, and model output before domain use.
- Distinguish Firebase identity tokens from Google OAuth access tokens and verify the correct token for each trust decision.
- Bound JSON, decoded Base64, upload count, upload size, and AI/Workspace request cost.
- Treat client IDs, MIME types, filenames, and mutable counters as untrusted.
- Keep error responses structured and free of secrets, stack traces, full prompts, and image data.
- Preserve client compatibility or change the server and client contract together.
- Extract transport, operation, and persistence responsibilities when a route grows materially.
- Do not introduce Firebase, Postgres, or another backend under the label of a refactor; that is an architecture migration.

## Completion

Exercise success and failure paths, then run type-check and relevant API tests. Call out the lack of a configured test runner when applicable.
