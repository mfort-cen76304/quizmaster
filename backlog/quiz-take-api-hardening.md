# Quiz Taking API — harden the surface, no answer leaks

## Why now

The take surface is *almost* clean — `QuestionTakeResponse` and `QuizTakeResponse` strip
correct answers, explanations, tolerance, and `questionExplanation` for pre-submit reads.
The two-attempt-paths and client-controlled-score-counter problems from the original
review are already resolved: `AttemptController` is gone, the only attempt-create path is
`POST /api/quiz/{id}/attempts`, and counters are recomputed server-side. What's left is
the contract drift risk around `QuestionResponse.feedbackFrom` and the absence of a
regression guard.

This should be locked down before the bundle split (see `frontend-bundle-split.md`) so
the split can be drawn along a stable, audited line.

## Current take surface (2026-05-15)

- **Reads (pre-submit):**
  - `GET /api/question/{id}` — `QuestionTakeController` → `QuestionTakeResponse` (stripped).
  - `GET /api/quiz/{id}` — `QuizTakeController` → `QuizTakeResponse` (stripped).
  - `GET /api/quiz/{id}/leaderboard` — `QuizLeaderboardResponse`.
- **Attempt lifecycle (write):**
  - `POST /api/quiz/{id}/attempts` — server derives `selectedQuestionIds`, zeroes counters.
  - `POST /api/quiz/{quizId}/attempts/{attemptId}/timeout` — server-side state change.
  - `POST /api/quiz/{quizId}/attempts/{attemptId}/evaluate` — final submit; recomputes counters.
  - `POST /api/quiz/{quizId}/attempts/{attemptId}/questions/{questionId}/submit` — per-question.
  - `POST /api/question/{id}/submit` — single-question (non-quiz) submit.

There is no longer a `POST /api/attempt`, `PATCH /api/attempt/{id}`, or `GET
/api/attempt/{id}`. The package `cz.scrumdojo.quizmaster.attempt` contains no controller.

## Remaining issues

### 1. `feedbackFrom` is the right idea but applied inconsistently

`QuestionResponse.feedbackFrom` strips `workspaceGuid` but otherwise returns the full
question (including correct answers + explanations). Used post-submit only today; nothing
prevents a future endpoint from reusing it pre-submit and silently leaking. Make the
contract explicit at the name.

### 2. No DTO contract test

There is no test that asserts "no take endpoint serialises `correctAnswers` or
`explanations` before submission." A regression here is the kind of bug nobody notices
until somebody scrapes the API.

## Approaches

**Tighten `feedbackFrom` semantics.**

- Rename to `postSubmitFeedbackOf` to make intent obvious at every call site.
- Add a short class-level comment on `QuestionResponse` explaining: `from` = full author
  view, `feedbackFrom` = post-submit, `draft` = AI suggestion. New methods need a
  category.

**Add a serialisation contract test.** A single MockMvc test that walks every
`@RequestMapping` under `QuizTakeController` and `QuestionTakeController` (pre-submit
endpoints), parses the response JSON, and asserts none of `correctAnswers`,
`explanations`, `questionExplanation`, or `tolerance` appears. Reflection over the
controllers, or just a curated list — both fine.

## Files in scope

- `backend/src/main/java/cz/scrumdojo/quizmaster/question/QuestionResponse.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/quiz/QuizTakeController.java` — call sites.
- `backend/src/main/java/cz/scrumdojo/quizmaster/question/QuestionTakeController.java` — call sites.
- `backend/src/test/.../quiz/QuizTakeControllerTest.java` (or a new
  `TakeApiNoLeakContractTest`) — the contract test.

## Notes

- **Sequencing:** must precede `frontend-bundle-split.md`. The boundary should be drawn
  along a finalised API surface.
- **Independent of:** Robin UX, AI service refactor, MCP refinements.
- Authorisation (the `@skip` scenarios in `RestApi.SecurityFoundation.feature`) is a
  larger effort and explicitly **out of scope** for this concern. This concern is about
  *what* the take surface returns, not *who* may call it.
