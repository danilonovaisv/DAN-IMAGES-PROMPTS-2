---
name: app-security
description: Audit or harden DAN IMAGES PROMPTS security around uploads, mutable APIs, Gemini usage, secrets, privacy, authentication, and authorization.
---

# Application Security

Use a threat-focused review and prioritize exploitable findings over generic hardening advice.

## Review Areas

- Authentication and per-user authorization for every read and mutation.
- Upload size, decoded size, real file signature, allowed formats, generated names, and serving policy.
- Rate limits and abuse controls for Gemini, upload, reset, and mutation endpoints.
- Request limits, CORS, security headers, error disclosure, and dependency exposure.
- Secret handling in environment, logs, builds, MCP configuration, and browser bundles.
- Privacy of prompts, images, model responses, and analytics.

Do not add live credentials, deploy security controls, or mutate external systems without explicit authorization. Provide file/line evidence and focused verification for each material finding.
