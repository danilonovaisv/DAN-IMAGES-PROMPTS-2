---
description:  Assess release readiness. This command does not deploy without explicit authorization.
---

# /release

Assess release readiness. This command does not deploy without explicit authorization.

1. Confirm the intended environment and package manager.
2. Check worktree state, required environment variables, and secret references.
3. Run `/test` and `/quality` expectations, then `pnpm build` when authorized for the release check.
4. Verify `dist/server.cjs`, static SPA serving, `/api/health`, upload behavior, and Gemini fallback behavior.
5. For Cloud Run, verify that production data and uploads do not depend on ephemeral local storage.
6. Produce go/no-go findings, rollback requirements, and any manual smoke tests.

Stop before publishing, deploying, migrating data, or changing external services unless the user explicitly authorizes that action.
