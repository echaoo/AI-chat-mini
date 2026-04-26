# AGENTS.md

Repository-specific instructions for AI assistants.

- Unless the user asks otherwise, treat `src/docs/` as reference material, not a routine edit target.
- Treat archived or historical documents under `src/docs/achived/` and similar folders as read-only.
- Keep request and API logic in `src/services/`; avoid scattering network calls across views.
- Do not move state into Pinia unless the state is actually shared across screens or features.
- Preserve the existing route structure unless the task requires route changes.
- Keep new UI and visual changes consistent with the existing design language; do not introduce a disconnected style unless the user explicitly asks for it.
- Default to a dark theme. Page backgrounds should use `rgba(26, 18, 26, 0.46)` or a dark gradient; do not add new beige, off-white, or light large-area backgrounds unless the user explicitly asks for them.
- For new pages and new top navigation bars, use `src/components/common/OverlayHeader.vue` instead of descriptive hero headers. Pages like “我的” should use the shared header directly without extra eyebrow/description copy.
- Use `14px` as the default border radius for new UI. Do not introduce new 20px / 22px / 24px / 28px rounded corners unless the user explicitly asks for them.
- For entry-style areas and navigation hubs, use list rows instead of separate cards for each action.
- For settings/forms, keep layout spacing on the 8px / 16px / 24px scale; if a screen must match an existing UI like the chat header, reuse that existing spacing exactly.
- Avoid adding new dependencies unless they are clearly needed.
- No error handling for impossible scenarios.
- Unless the user explicitly asks for it, do not add data type compatibility branches or defensive handling for alternate payload shapes; assume the agreed contract is correct.
- If you write 200 lines and it could be 50, rewrite it.
- Minimum code that solves the problem. Nothing speculative.
