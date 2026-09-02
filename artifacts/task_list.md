# Cognitive Layer Task List

## Completed

- [x] Audit package metadata, source layout, runtime topology, integrations, tests, and persistence providers.
- [x] Recursively audit rules, context, skills, workflows, personas, hooks, commands, and MCP configuration.
- [x] Classify every existing agentic component as valid, outdated, or incomplete.
- [x] Verify current `@google/genai` and Firebase guidance through Context7.
- [x] Update `AGENTS.md` with Firebase, Firestore, Workspace, and identity boundaries.
- [x] Update project context with current topology, APIs, contracts, tests, and known constraints.
- [x] Update conventions for OAuth, Firebase identity, payload limits, and persistence adapters.
- [x] Keep exactly five stack-specific skills; replace `filesystem-persistence` with `persistence-adapters`.
- [x] Keep exactly three workflows; extend `/release` for Firebase, Firestore, Workspace, and Cloud Run durability.
- [x] Update frontend, API, and release personas; preserve valid Gemini and security personas.
- [x] Review `.mcp.json` and retain only verified, relevant Context7 and GitHub servers.
- [x] Refresh the implementation plan and task list.
- [x] Validate JSON, Markdown structure, skill frontmatter, TypeScript, tests, and final diff.

## Pending Verification

- [ ] Verify Google Developer Knowledge MCP availability, endpoint, schema, and IDE compatibility before configuration.
- [ ] Verify an official Firebase MCP and its least-privilege authentication model before configuration.
- [ ] Decide whether legacy `bun.lock` should be removed in a separately authorized repository-hygiene change.

## Separate Application Phases

- [ ] Add server-side Firebase ID-token verification and per-user authorization.
- [ ] Add runtime validation for Gemini output and imported Workspace data.
- [ ] Add rate limiting and explicit JSON/Base64/upload batch limits.
- [ ] Add upload signature inspection and durable object storage for Cloud Run.
- [ ] Add Firestore emulator/credentialed adapter tests, CI, and real linting.
