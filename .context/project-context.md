# Project Context

## Product

DAN IMAGES PROMPTS is a visual library for cataloging and reusing image-generation prompts. Its central record is a `PromptItem`: original prompt, image reference, category, target model, structured visual fields, tags, notes, favorite state, usage count, and timestamps.

## Runtime Topology

```text
Browser / React SPA
        |
        | JSON and multipart HTTP under /api
        v
Express server (server.ts)
   |                |                 |
   |                |                 +--> Google Docs/Drive import
   |                +--> Gemini via @google/genai
   |
   +--> PromptRepository
   |      +--> filesystem JSON (default)
   |      +--> Firestore (configured provider)
   |
   +--> uploads/* (local filesystem)
```

In development, Express mounts Vite middleware. In production, Vite builds the SPA and esbuild bundles the server to `dist/server.cjs`.

## Main Data Flow

1. The user enters a raw prompt and may attach an image.
2. The browser sends text and multimodal input to `/api/analyze-prompt`.
3. `server/ai/promptAnalyzer.ts` requests structured JSON from Gemini or uses a local heuristic fallback.
4. The user reviews the draft in the frontend.
5. The approved record is sent to `/api/prompts` and stored through the selected `PromptRepository` adapter.
6. Search and filters currently scan the in-memory prompt array.

## Google Workspace Import Flow

1. The browser obtains Google OAuth access through Firebase Auth or Google Identity Services.
2. `WorkspaceImportModal` sends the access token and selected Docs/Drive identifiers through `ApiService`.
3. `/api/workspace/import` delegates parsing and normalization to `server/workspace/googleWorkspaceService.ts`.
4. Imported records may be analyzed by Gemini and are persisted through `PromptRepository`.
5. OAuth access tokens are integration credentials; they do not replace backend verification of Firebase identity or per-user authorization.

## API Surface

- `GET /api/health`
- `POST /api/analyze-prompt`
- `POST /api/upload`
- `POST /api/upload-base64`
- CRUD under `/api/prompts`
- Prompt actions: `favorite`, `copy`, and `duplicate`
- CRUD under `/api/categories`
- `POST /api/reset-data`
- Workspace configuration/import, direct-text import, and batch-image upload under `/api/workspace/*`

## Integrations And Environment

- Required for real AI analysis: `GEMINI_API_KEY`.
- Firebase Auth is initialized in the browser; Firestore is available through `firebase-admin` when `PERSISTENCE_PROVIDER=firestore`.
- Google Docs/Drive import is implemented with user-provided OAuth access tokens.
- Documented hosting context: Google AI Studio and Cloud Run through `.env.example` and `metadata.json`.
- `APP_URL` is documented but not consumed by the current application code.
- There is no implemented OpenAI, Postgres, Supabase, Vercel, semantic search, or image-generation integration.

## Known Constraints

- Local files are not durable storage on stateless Cloud Run instances.
- Firestore records do not make local uploads durable; object storage remains a separate migration.
- Upload validation trusts client MIME metadata and needs content inspection before production use.
- Routes and server bootstrap are concentrated in `server.ts`.
- The AI model ID is hardcoded.
- Gemini JSON is parsed and normalized but is not validated by a dedicated runtime schema.
- Persistence and HTTP persistence tests exist; ESLint, CI, rate limiting, server-side Firebase token verification, and per-user authorization are absent.

## Roadmap Boundary

Durable object storage, semantic search, image generation, provider comparison, and shared collections remain product direction only. Firebase Auth and Firestore adapters exist, but complete API authentication/authorization must not be inferred from their presence.
