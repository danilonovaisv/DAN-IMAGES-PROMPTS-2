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
   |                |
   |                +--> Gemini via @google/genai
   |
   +--> data/prompts.json
   +--> data/categories.json
   +--> uploads/*
```

In development, Express mounts Vite middleware. In production, Vite builds the SPA and esbuild bundles the server to `dist/server.cjs`.

## Main Data Flow

1. The user enters a raw prompt and may attach an image.
2. The browser sends text and multimodal input to `/api/analyze-prompt`.
3. `server/ai/promptAnalyzer.ts` requests structured JSON from Gemini or uses a local heuristic fallback.
4. The user reviews the draft in the frontend.
5. The approved record is sent to `/api/prompts` and stored in JSON.
6. Search and filters currently scan the in-memory prompt array.

## API Surface

- `GET /api/health`
- `POST /api/analyze-prompt`
- `POST /api/upload`
- `POST /api/upload-base64`
- CRUD under `/api/prompts`
- Prompt actions: `favorite`, `copy`, and `duplicate`
- CRUD under `/api/categories`
- `POST /api/reset-data`

## Integrations And Environment

- Required for real AI analysis: `GEMINI_API_KEY`.
- Documented hosting context: Google AI Studio and Cloud Run through `.env.example` and `metadata.json`.
- `APP_URL` is documented but not consumed by the current application code.
- There is no implemented Firebase, OpenAI, Postgres, Supabase, Vercel, or authentication integration.

## Known Constraints

- Synchronous JSON writes can block and are unsafe for concurrent multi-instance writes.
- Local files are not durable storage on stateless Cloud Run instances.
- Upload validation trusts client MIME metadata and needs content inspection before production use.
- Routes and server bootstrap are concentrated in `server.ts`.
- The AI model ID is hardcoded.
- Automated tests, ESLint, CI, rate limiting, auth, and authorization are absent.

## Roadmap Boundary

Firebase/Auth, durable object storage, semantic search, image generation, provider comparison, and shared collections are product direction only. Agents must distinguish proposed architecture from verified implementation.
