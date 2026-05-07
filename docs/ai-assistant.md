# AI Assistant

Quizmaster generates question drafts on demand for [Quiz makers](domain-language.md#roles).
The feature has three pieces: **Robin AI** in the frontend (the FAB and sheet
the maker interacts with), an AI assistant service in the backend, and
**OpenRouter** as the external LLM provider.

For the user-facing behavior, see [domain-language.md](domain-language.md#ai-assistance-robin-ai).
This document covers the architectural decisions worth knowing before changing
the code.

## Robin AI is decoupled from forms via `RobinFormBinding`

Robin runs on top of two different forms — the per-question form and the
workspace screen. To make that reuse possible, it never imports form
internals. The contract is:

```ts
RobinFormBinding { snapshot, applyPatch }
```

Robin reads current form state through `snapshot()` and writes drafts back
through `applyPatch(patch)`. New surfaces that want Robin only need to
implement that interface; Robin itself is unaware of which form it is editing.

If you find yourself reaching into form state from inside Robin, you are
probably violating this boundary.

## Duplicate avoidance is an embedding round-trip with one retry

The risk Robin solves for is generating a draft that already exists in the
workspace. The mechanism is:

1. Each saved question is embedded once and the vector is cached on the row.
2. When Robin drafts a candidate, the candidate is embedded and compared
   against every cached vector in the same workspace by cosine similarity.
3. If the maximum similarity is above a configured threshold, the assistant
   re-asks the LLM **once**, passing the matched question back as feedback.
4. If the second draft is still over threshold, the request fails with `502`.

The two-shot retry is the deliberate compromise between honoring the user's
prompt and keeping the workspace de-duplicated. Lowering the threshold makes
Robin more conservative and more likely to retry; raising it lets near-duplicates
through.

The cached embedding is invalidated whenever the embedding model or the
canonical question text changes, so swapping the model in configuration
forces re-embedding without manual intervention.

## OpenRouter is reached through two endpoints with one token

Drafting and embedding are different OpenRouter endpoints with different
model settings, but they share a single API token. There is no separate
embedding provider — keeping both behind OpenRouter avoids managing two
credentials.

Configuration lives under the `ai.*` namespace in `application.properties`
(token, chat-completion model, embedding model, similarity threshold,
max-tokens). See [devenv/how-to-develop.md](devenv/how-to-develop.md) for
how to set them up locally.

## Where to look

- Frontend Robin lives under `frontend/src/pages/make/create-question/robin-ai/`.
  The workspace flavor reuses the same sheet from
  `frontend/src/pages/make/workspace/`.
- Backend lives under `backend/src/main/java/cz/scrumdojo/quizmaster/aiassistant/`.
  `AiAssistantService` orchestrates drafting and dedup; the embedding stack
  is in the same package.
