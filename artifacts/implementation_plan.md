# Cognitive Layer Implementation Plan

## Objective

Keep the DAN IMAGES PROMPTS agent-first layer aligned with the implemented React, Express, Gemini, Firebase, Firestore, and Google Workspace architecture while preserving strict security and data-contract boundaries.

## Audit Summary

The verified stack is TypeScript ESM, React 19.2, Vite 8.2, Tailwind CSS 4, Motion, Express 5.2, Multer 2.3, `@google/genai` 2.20, Firebase Auth, Firebase Admin/Firestore, and pnpm. The default persistence provider is filesystem JSON; Firestore is an implemented adapter selected through `PERSISTENCE_PROVIDER`. Uploads remain local filesystem data.

The repository also implements Google Docs/Drive import with OAuth access tokens and has TypeScript persistence and HTTP API regression tests executed through `tsx`. OpenAI, Postgres, Supabase, semantic search, image generation, CI, ESLint, rate limiting, server-side Firebase token verification, and per-user authorization are not implemented.

## Data Contracts

```text
PromptAnalysisRequest
  -> /api/analyze-prompt
  -> AnalyzePromptInput
  -> Gemini responseSchema
  -> StructuredAnalysisResult
  -> PromptAnalysisResponse
  -> human review
  -> PromptItem
  -> PromptRepository
  -> FilePromptRepository | FirestorePromptRepository
```

```text
Firebase/Google OAuth
  -> WorkspaceImportModal
  -> ApiService
  -> /api/workspace/*
  -> GoogleWorkspaceService
  -> PromptRepository
```

The reference types `ExtractedData`, `AnalysisData`, `TutorialData`, and `WorkspaceData` do not exist in this project and are not part of its contracts.

## Agentic Configuration Classification

| Area | Previous state | Resolution |
| --- | --- | --- |
| `AGENTS.md` | Outdated Firebase/persistence description | Updated with Firebase, Firestore, Workspace, and identity boundaries |
| `.context/project-context.md` | Outdated topology and capabilities | Updated with both repository adapters and Workspace flow |
| `.context/conventions.md` | Incomplete token and adapter rules | Added Firebase/OAuth, payload, and provider conventions |
| Frontend/Gemini/security skills | Valid | Preserved |
| Express skill | Incomplete | Added authentication, Workspace, and payload responsibilities |
| Filesystem skill | Outdated | Replaced by `persistence-adapters` |
| `/test` and `/quality` | Valid | Preserved |
| `/release` | Incomplete | Added Firestore, Firebase, Workspace, and durability gates |
| Frontend/API/release personas | Incomplete | Updated ownership and handoffs |
| Gemini/security personas | Valid | Preserved |
| `.mcp.json` | Valid but intentionally limited | Context7 and GitHub retained; no unverified server added |

No duplicate `.agent/`, `GEMINI.md`, hooks, commands, or competing rules were found.

## Implemented Structure

```text
AGENTS.md
.context/{project-context.md,conventions.md}
.agents/skills/{react-vite-frontend,express-api-contracts,persistence-adapters,gemini-multimodal-cataloging,app-security}/SKILL.md
.agents/workflows/{test.md,quality.md,release.md}
.agents/agents/{frontend-specialist,api-domain-specialist,gemini-ai-specialist,security-auditor,release-engineer}.md
.mcp.json
artifacts/{implementation_plan.md,task_list.md}
```

## Design Decisions

- `.agents/` remains canonical; `.agent/` is not introduced.
- Exactly five stack-specific skills and three slash-command workflows are retained.
- `AGENTS.md` owns global invariants; skills own task-specific guidance.
- `PromptRepository` is the persistence contract; provider details stay in adapters.
- Firebase identity and Google OAuth access are separate trust domains.
- AI structured output requires runtime validation even when `responseSchema` is used.
- Context7 and GitHub remain the only configured MCP servers because their endpoints are verified in the existing configuration.
- Google Developer Knowledge and a Firebase MCP must not be added until their exact server identifiers, endpoints, schemas, and IDE support are verified.

## External Research

Context7 was used to verify current `@google/genai` structured-output schema support and Firebase token patterns. The requested Google Developer Knowledge MCP and `/graphify` executable were unavailable in the active environment; those limitations are recorded rather than replaced with invented configuration.

## Separate Application Work

This cognitive-layer update does not implement server-side Firebase ID-token verification, per-user authorization, runtime Gemini schema validation, rate limiting, upload content inspection, object storage, CI, or ESLint. Those changes require separate approval, implementation, and failure-path testing.
