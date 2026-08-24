---
description: Run a repository quality gate without silently changing files.
---

# /quality

Run a repository quality gate without silently changing files.

1. Inspect the working tree and preserve unrelated changes.
2. Run `pnpm exec tsc --noEmit`.
3. Run configured lint/tests only when they exist; note that the current `lint` script is type-checking, not ESLint.
4. Validate build inputs, API contract consistency, accidental secrets, runtime data, lockfile drift, and unsupported roadmap claims.
5. Review changed uploads, AI, persistence, and auth surfaces for focused security risk.
6. Summarize actionable findings by severity and identify checks unavailable in the repository.

Do not auto-fix, update dependencies, or clean generated files unless explicitly requested.
