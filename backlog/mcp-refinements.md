# MCP server — small refinements

## Issues

### 1. `excludedQuestionId` is not reachable from MCP

`AiAssistantRequest` (backend) and the per-question Robin flow already support
`excludedQuestionId` so that "refine existing question" doesn't trip duplicate detection
against the very question being edited.

The MCP path doesn't:

- `mcp/src/schemas.ts:187-191` — `generateQuestionDraftInputSchema` has no field for it.
- `mcp/src/quizmaster-client.ts:192-200` — `generateQuestionDraft` doesn't forward it.

An MCP-driven refine call will see itself as a duplicate and either retry pointlessly or
fail with `backend-error`.

### 2. Over-eager `health()` fallback

`QuizmasterClient.health()` falls back to `GET /` when `/api/feature-flag` returns 404.
The only case where this triggers is "backend up, feature-flag endpoint renamed" — vanishingly
rare and recoverable by editing one line. If the backend is unreachable, both calls fail
and you get `reachable: false`, which is the only actionable signal. Drop the branch.

### 3. `tags` field is structural noise in question drafts

The MCP schema (`mcp/src/schemas.ts:48`) declares `tags: z.array(z.string()).default([])` on
question payloads, and `quizmaster-client.ts:103` strips the field on draft response. But
the AI prompt explicitly tells the model *not* to return `tags`
(`prompts/single-choice.md:10` and the others). The result is that drafts always carry
`tags: []`. Either the field belongs in `QuestionDraft` (then explain why) or it shouldn't
be in the draft transport at all.

## Approaches

**Add `excludedQuestionId`.**

- Schema: `excludedQuestionId: idSchema('excludedQuestionId').optional()` in
  `generateQuestionDraftInputSchema`.
- Client: forward it in `AiAssistantRequest` and through the POST body.
- Test: extend `mcp/test/quizmaster-client.test.ts` with one case asserting the field
  is sent.

**Drop the `health()` fallback.** Five-line simplification; the `feature-flag` probe is
sufficient.

**Decide `tags` in drafts.**

- If we want to keep the door open for AI-suggested tags later: leave the field, add a
  short comment in `QuestionDraft` (or in `prompts/*.md`) explaining the intent and that
  it currently always serialises empty.
- Otherwise: remove `tags` from `questionPayloadShape` for *drafts only* and tighten
  `QuestionDraft` accordingly. Make-side payloads keep the field.

## Files in scope

- `mcp/src/schemas.ts`
- `mcp/src/quizmaster-client.ts`
- `mcp/test/quizmaster-client.test.ts`
- `shared/types/question.ts` (if `QuestionDraft` is tightened)

## Notes

- Fully isolated to the `mcp/` package plus the shared types. No backend change required
  for any of these.
- Sequence with `ai-assistant-service-refactor.md` is not strict, but doing the AI service
  collapse first means there's exactly one signature for `excludedQuestionId` to thread
  through.
