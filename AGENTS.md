# AGENTS.md

Repository-specific instructions for AI assistants.

- Unless the user asks otherwise, treat `src/docs/` as reference material, not a routine edit target.
- Treat archived or historical documents under `src/docs/achived/` and similar folders as read-only.
- Keep request and API logic in `src/services/`; avoid scattering network calls across views.
- Do not move state into Pinia unless the state is actually shared across screens or features.
- Preserve the existing route structure unless the task requires route changes.
- Avoid adding new dependencies unless they are clearly needed.
- No error handling for impossible scenarios.
- Unless the user explicitly asks for it, do not add data type compatibility branches or defensive handling for alternate payload shapes; assume the agreed contract is correct.
- If you write 200 lines and it could be 50, rewrite it.
- Minimum code that solves the problem. Nothing speculative.
