---
name: gemini-multimodal-cataloging
description: Maintain Gemini text-and-image cataloging, structured output, model configuration, privacy, and fallback behavior in the server AI layer.
---

# Gemini Multimodal Cataloging

Use this skill for `server/ai/`, the analysis API contract, or prompt-structure changes.

## Invariants

- Keep credentials and SDK calls server-side.
- Preserve `rawPrompt`; AI output is a reviewable draft, never authoritative source data.
- Configure model IDs through a validated server setting instead of silently changing a hardcoded model.
- Pair structured response schemas with runtime validation before persistence.
- Preserve user data when provider calls, parsing, or validation fail.
- Keep fallback behavior explicit, deterministic, and testable.
- Do not log complete prompts, images, responses, or credentials.

Consult current `@google/genai` documentation through Context7 when changing SDK calls or model capabilities.
