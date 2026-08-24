---
name: react-vite-frontend
description: Implement or review DAN IMAGES PROMPTS frontend work involving React 19, Vite, Tailwind CSS 4, Motion, responsive behavior, or accessibility.
---

# React Vite Frontend

Read `.context/project-context.md` and `.context/conventions.md` before editing.

## Working Method

- Place domain UI in `src/features/` and reusable primitives in `src/components/`.
- Route server communication through `src/services/api.ts`.
- Preserve the reviewed-draft flow: AI results must remain editable before saving.
- Account for loading, empty, error, success, disabled, and retry states.
- Verify keyboard operation, focus behavior, labels, responsive text/layout, and reduced motion.
- Reuse Lucide and the existing visual language; avoid adding a competing component system without architectural approval.

## Completion

Run `pnpm exec tsc --noEmit`, relevant tests if available, and inspect affected desktop/mobile states. Report missing test or browser tooling rather than implying it ran.
