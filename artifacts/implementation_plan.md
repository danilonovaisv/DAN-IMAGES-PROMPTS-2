# Cognitive Layer Implementation Plan

## Objective

Establish a portable agent-first cognitive layer for DAN IMAGES PROMPTS with persistent project context, stack-specific skills, repeatable workflows, specialist ownership, and least-privilege MCP connectivity.

## Audit Summary

The verified stack is TypeScript, React 19, Vite 6, Tailwind CSS 4, Motion, Express 4, Multer, and server-side Gemini through `@google/genai`. Persistence is local JSON and filesystem uploads. Firebase, authentication, OpenAI, external databases, tests, ESLint, CI, and declarative deploy configuration are not implemented.

Existing agentic configuration was absent except for `assets/.aistudio/.gitignore`, which is valid but limited to Google AI Studio. No conflicting or redundant agent rules were found. `/graphify`, Google Developer Knowledge MCP, Exa, and Firecrawl were unavailable during discovery; Context7 was available and used for current `@google/genai` guidance.

## Implemented Structure

```text
AGENTS.md
.context/{project-context.md,conventions.md}
.agents/skills/<five stack-specific skills>/SKILL.md
.agents/workflows/{test.md,quality.md,release.md}
.agents/agents/<five specialist profiles>.md
.mcp.json
artifacts/{implementation_plan.md,task_list.md}
```

## Design Decisions

- `.agents/` is canonical; `.agent/` is intentionally not created.
- `AGENTS.md` holds global invariants; skills contain only task-specific decision guidance.
- Exactly five skills cover frontend, API contracts, Gemini cataloging, current filesystem persistence, and application security.
- Exactly three workflows map `/test`, `/quality`, and `/release`.
- Personas have explicit ownership and handoff boundaries.
- MCP connectivity is limited to Context7 and GitHub. Google Developer Knowledge remains excluded until its endpoint and schema can be verified in the target IDE.
- pnpm is canonical because `pnpm-lock.yaml` and a local pnpm store are present; `bun.lock` is treated as legacy until the team decides otherwise.

## Follow-Up Architecture Work

Application-code risks discovered by the audit are intentionally not modified in this phase: synchronous JSON writes, ephemeral Cloud Run storage, weak upload inspection, missing auth/rate limiting, hardcoded Gemini model, lack of runtime schema validation, and absent automated tests/CI.
