# DAN IMAGES PROMPTS Agent Guide

## Mission

Treat every prompt as a reusable creative asset composed of source text, visual reference, classification, target model, and reviewed structured metadata. Preserve user control: AI analysis is a draft and must remain editable before persistence.

## Current Architecture

- Frontend: React 19, Vite 8, Tailwind CSS 4, Motion, and Lucide React.
- Backend: Node.js, TypeScript, Express 5, and Multer.
- AI: server-side Gemini integration through `@google/genai`.
- Persistence: `PromptRepository` adapters for local JSON files or Firestore, selected by `PERSISTENCE_PROVIDER`; uploads remain on the local filesystem.
- Google integration: Firebase Auth in the browser and Google Docs/Drive import through server-side Workspace services.
- Development and production are served from the Express entrypoint in `server.ts`.

Read `.context/project-context.md` before architectural work and `.context/conventions.md` before implementation.

## Non-Negotiable Rules

1. Keep API keys and service credentials server-side. Never expose `GEMINI_API_KEY` through Vite client variables or browser code.
2. Preserve `rawPrompt` and image references. Do not replace user input with AI-generated content.
3. Validate untrusted data at HTTP and persistence boundaries. Do not trust filenames, MIME headers, IDs, model output, or client-owned fields.
4. Keep frontend HTTP access in `src/services/api.ts`; do not scatter direct API calls through components.
5. Keep provider-specific AI behavior behind `server/ai/`. New providers require an explicit adapter boundary, not conditionals spread across routes or UI.
6. Treat Firebase sign-in and Google OAuth access as identity/integration inputs, not proof that every API route is authenticated or authorized. Verify Firebase ID tokens server-side before relying on user identity.
7. Avoid new `any` types. Prefer narrow interfaces, `unknown`, type guards, or schema validation.
8. Preserve accessibility, responsive behavior, loading/error/empty/success states, and `prefers-reduced-motion` behavior in UI changes.
9. Do not log complete prompts, images, model responses, tokens, or secrets unless explicitly required for a controlled local diagnostic.
10. Never run destructive cleanup or deployment commands without explicit authorization and resolved targets.

## Package And Quality Policy

- Use pnpm as the canonical package manager. Do not update `bun.lock` unless the package-manager decision is intentionally revisited.
- Before completing code changes, run `pnpm exec tsc --noEmit` and the most relevant available tests.
- The existing `pnpm lint` script is type-checking only; do not claim ESLint coverage.
- Scale verification to risk. API, persistence, upload, and Gemini contract changes require focused failure-path tests once a test runner is introduced.
- Do not modify unrelated user changes or generated data.

## Ownership Boundaries

- `src/features/`: domain UI and feature interactions.
- `src/components/`: reusable presentation and feedback primitives.
- `src/services/api.ts`: browser-to-server contract boundary.
- `src/types/`: shared domain contracts; keep browser-only dependencies out.
- `server/ai/`: Gemini integration, structured output, and fallback.
- `server/prompts/`: persistence implementation.
- `server/repositories/`: persistence contract and filesystem/Firestore adapters.
- `server/workspace/`: Google Docs/Drive import and normalization.
- `server/validation/`: untrusted-input validation.

Use the relevant `.agents/skills/*/SKILL.md`, workflow, and specialist profile when a task crosses one of these boundaries.
