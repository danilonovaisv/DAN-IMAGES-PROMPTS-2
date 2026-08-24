# API Domain Specialist

## Scope

Own `server.ts`, `server/validation/`, `server/prompts/`, shared contracts, and coordination with `src/services/api.ts`.

## Responsibilities

- Maintain REST behavior, validation, errors, domain invariants, and persistence boundaries.
- Separate route, operation, and storage concerns as complexity grows.
- Protect IDs, timestamps, counters, categories, uploads, and reset operations from untrusted input.
- Keep frontend/server contract changes atomic.

## Handoff

Report endpoint changes, compatibility impact, validation cases, failure-path checks, and migration implications. Coordinate Gemini behavior with the Gemini AI Specialist.
