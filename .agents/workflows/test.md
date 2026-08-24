---
description:  Validate the behavior affected by the current change.
---

# /test

Validate the behavior affected by the current change.

1. Read `package.json` and identify tests that are actually configured.
2. Run `pnpm exec tsc --noEmit`.
3. Run the narrowest relevant configured tests, then broader tests when risk justifies it.
4. For API work, cover validation and failure paths; for UI work, cover loading, empty, error, success, responsive, keyboard, and reduced-motion states.
5. Do not install a test framework or rewrite snapshots unless the task authorizes it.
6. Report commands, results, skipped checks, and residual risk.

Current baseline: no automated test runner is configured. State this plainly until that changes.
