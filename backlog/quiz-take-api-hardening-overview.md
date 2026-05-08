# Quiz Take API — Current Surface

## Take endpoints (read, pre-submit)
- **`GET /api/question/{id}`** — `QuestionTakeController` → returns `QuestionTakeResponse` (stripped: no correct answers / explanations / tolerance).
- **`GET /api/quiz/{id}`** — `QuizTakeController` → returns `QuizTakeResponse` (stripped).
- **`GET /api/quiz/{id}/attempts/{attemptId}`** — same response shape, scoped to attempt's question selection.

## Attempt lifecycle (write)
Two coexisting create paths:
- **`POST /api/attempt`** (`AttemptController`) — body-supplied `quizId`, no ownership check beyond `QuizAvailability.isAvailable`, accepts client-supplied state via `AttemptRequest.toEntity()`.
- **`POST /api/quiz/{id}/attempts`** (`QuizTakeController`) — server derives `selectedQuestionIds`, zeroes counters, only takes `startedAt` from request.

State updates:
- **`PATCH /api/attempt/{id}`** — accepts `correctAnswers`, `incorrectAnswers`, `partiallyCorrectAnswers`, `timedOutAt`, `finishedAt` straight from client into the entity (`AttemptPatchRequest` has all five).
- **`GET /api/attempt/{id}`** — read.

## Submit / score (write)
- **`POST /api/question/{id}/submit`** — single-question submit; refuses if question belongs to a quiz.
- **`POST /api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit`** — per-question. In **EXAM** mode: server scores and increments counters, returns `204`. In **LEARN** mode: returns `QuestionEvaluationResponse`.
- **`POST /api/quiz/{id}/attempts/{attemptId}/submit`** — final submit; server recomputes counters, sets `finishedAt`, returns `QuizSubmitResponse` with per-question feedback via `QuestionResponse.feedbackFrom`.

## Frontend usage
- `frontend/src/api/stats.ts:7-13` — uses the new `POST /api/quiz/{id}/attempts` for create, but still calls `PATCH /api/attempt/{id}`.
- `frontend/src/pages/take/quiz-take/quiz-play.tsx:108-121` — in EXAM mode, fires `recordQuizQuestionAnswer` (server-scored) **and** `patchAttempt` with client-side counters from `answerCounts.current`. The patch is redundant with what the server already computed.
- `quiz-play.tsx:52` — also patches `timedOutAt` on timeout.

## `QuestionResponse` factories
- `from(q)` — full author view (everything).
- `feedbackFrom(q)` — strips `workspaceGuid`, keeps correct answers + explanations; used by `QuestionScoringService.evaluate` (LEARN per-question) and `submitQuiz` (EXAM end).
- `draft(...)` — AI suggestion shape.

No naming convention prevents a future caller from picking `feedbackFrom` for a pre-submit response.

---

# Backlog Suggestions Summary

1. **Collapse attempt creation to one path.** Remove `AttemptController.createAttempt` (`POST /api/attempt`); migrate `frontend/src/api/stats.ts` and specs to `POST /api/quiz/{id}/attempts` only.
2. **Move scoring fully server-side.**
   - Make `POST .../questions/{questionId}/submit` the only writer of EXAM counters.
   - Drop `correctAnswers`/`incorrectAnswers`/`partiallyCorrectAnswers` from `AttemptPatchRequest`; keep only `timedOutAt`/`finishedAt` (or split into dedicated `/timeout` and `/finish` endpoints that recompute server-side).
   - Frontend: drop the `answerCounts` ref and the `patchAttempt` counter-write in `handleAnswerSubmitted`.
3. **Tighten `feedbackFrom` semantics.** Rename to `postSubmitFeedbackOf`; add a class-level comment on `QuestionResponse` documenting the three factories (`from` / `feedbackFrom` / `draft`) so new methods must pick a category.
4. **Add a serialisation contract test.** A MockMvc test over pre-submit endpoints in `QuizTakeController` and `QuestionTakeController` asserting the response JSON never contains `correctAnswers`, `explanations`, `questionExplanation`, or `tolerance`.

## Sequencing & scope notes (from the doc)
- Must precede `frontend-bundle-split.md` so the take bundle ships without the patch-counter writes.
- Independent of Robin UX, AI service refactor, MCP refinements, foreign-concept docs.
- Soft pairing with `workspace-routing-cleanup.md`; touches disjoint controllers.
- Authorisation (`@skip` scenarios in `RestApi.SecurityFoundation.feature`) is **out of scope** — this is about *what* the surface returns/accepts, not *who* may call it.
- Once landed: cross the score-counter gap off `specs/features/mcpserver/rest-auth-spec.md`.
