# Documentation — foreign concepts introduced this term

## Issue

Four concepts new to this codebase landed in roughly the same week and none of them are
mentioned in `CLAUDE.md` or `docs/architecture.md`:

1. **MCP server** — a separate TypeScript package under `mcp/` that exposes Quizmaster as
   tools/resources/prompts to AI clients over stdio.
2. **Vector embeddings + cosine similarity** — `OpenRouterEmbeddingClient`,
   `EmbeddingSimilarity`, `QuestionEmbeddingService`, the
   `embedding`/`embedding_model`/`embedding_text_hash` columns on `question`. Used for
   AI-assistant duplicate avoidance.
3. **OpenRouter as a second integration surface** — the chat-completions client was
   already there; the embeddings client is new and shares the token but uses a different
   endpoint and different model variable (`ai.embedding.model`).
4. **Robin AI architecture** — the FAB → Sheet → form-binding split, with
   `RobinFormBinding { snapshot, applyPatch }` decoupling Robin from the form's internal
   state. Used in two places (per-question form and workspace) with different
   `generateRequest` plumbing.

The MCP package has *good* in-package docs already (`mcp-spec.md`,
`mcp-server-configuration.md`, `rest-auth-spec.md`). The other three have nothing.

## Approaches

Add short pointers in `CLAUDE.md`. The aim is *not* to duplicate the existing specs —
just give the next contributor a breadcrumb so they know where to look.

Suggested additions, each ~3 bullets:

- **Tech Stack → MCP server.** "TypeScript package at `mcp/`. Spec in
  `specs/features/mcpserver/mcp-spec.md`. Configuration in
  `specs/features/mcpserver/mcp-server-configuration.md`."
- **Architecture → Embedding-based duplicate avoidance.** Two-line description of the
  flow (embed candidate → cosine vs workspace embeddings → retry once with feedback →
  fail). Point at `AiAssistantService` and the migration `V00049`.
- **AI Assistant → OpenRouter.** Note that two endpoints are used (chat completions and
  embeddings) and that both consume the single `ai.token` plus separate model settings.
- **Frontend → Robin AI.** Point at the `robin-ai/` folder. Explain the
  `RobinFormBinding` contract in one sentence so future contributors don't try to import
  form internals.

Add to `docs/architecture.md`:

- Mermaid diagram block: extend the existing component diagram so MCP appears as a
  separate process node calling the REST API alongside the SPA.
- One paragraph on the "MCP is a thin REST shim" rule (already stated in `mcp-spec.md`,
  worth surfacing in the global architecture doc).

Optionally, a short header comment on `AiAssistantService.java` explaining the
duplicate-avoidance flow is the highest-value in-code doc — same scope as suggestion 3
in `ai-assistant-service-refactor.md`.

## Files in scope

- `CLAUDE.md`
- `docs/architecture.md`
- `mcp/README.md` (a one-page README with "see specs/features/mcpserver/" pointers; the
  package currently has none)

## Notes

- This is documentation-only and can ship at any time. It is not a prerequisite for any
  other concern, but doing it first reduces the friction of every other concern's review.
