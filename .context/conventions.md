# Team Conventions

## TypeScript And Modules

- Use ESM-style source imports and the existing TypeScript configuration.
- Prefer explicit domain types and discriminated states over `any` or loosely shaped objects.
- Keep shared interfaces free of React, DOM, Express, and provider SDK dependencies.
- Use English for identifiers and technical names; preserve the product's pt-BR user-facing language.

## React

- Keep feature-specific UI under `src/features/` and reusable primitives under `src/components/`.
- Keep server communication in `ApiService` or a deliberate replacement data layer.
- Model loading, empty, error, success, disabled, and retry states explicitly.
- Maintain keyboard access, visible focus, semantic labels, responsive layout, and reduced-motion support.
- Use Lucide icons already present in the project instead of custom inline SVGs.

## Express And APIs

- Validate request body, query, params, uploads, and AI output at the boundary.
- Return consistent JSON errors without stack traces, secrets, or sensitive payloads.
- Separate transport, domain operation, and persistence when extending `server.ts`.
- Avoid synchronous filesystem work in request paths when changing persistence code.
- Preserve backward compatibility between `src/services/api.ts` and server routes or update both atomically.

## Gemini

- Resolve credentials from server environment only.
- Make model IDs configurable and validate availability before changing defaults.
- Use structured output plus runtime validation; JSON parsing alone is insufficient validation.
- Retain a deterministic, lossless fallback and expose when fallback was used.
- Minimize content in logs and external requests.

## Persistence And Uploads

- Treat all paths and file metadata as untrusted.
- Prefer atomic writes and an adapter boundary for changes to the JSON store.
- Never assume local data or uploads survive a Cloud Run restart or scale-out.
- A future database/storage migration requires a documented data migration and rollback plan.

## Verification

- Baseline: `pnpm exec tsc --noEmit`.
- Use `/test` for behavior checks, `/quality` for repository validation, and `/release` for release readiness.
- Do not claim test, lint, security, or deployment success for tools that are not configured.
- Keep commits and diffs scoped; preserve unrelated worktree changes.
