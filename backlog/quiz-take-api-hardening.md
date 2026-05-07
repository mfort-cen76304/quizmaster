# Quiz Taking API — harden the surface, no answer leaks

## Why now

The take surface is *almost* clean — `QuestionTakeResponse` and `QuizTakeResponse` strip
correct answers, explanations, tolerance, and `questionExplanation` for pre-submit reads.
But the surrounding endpoints around attempts and submission still have leaks and trust
boundaries that the rest-auth spec already flagged. They should be locked down before
the bundle split (see `frontend-bundle-split.md`) so the split can be drawn along a stable,
audited line.

## Issues

### 1. Two attempt-creation paths, one of them anonymous and trusted

- `AttemptController.createAttempt` (`POST /api/attempt`) takes a `quizId` from the body
  and accepts client-supplied state. No quiz ownership / availability check beyond
  `QuizAvailability.isAvailable`.
- `QuizTakeController.createAttempt` (`POST /api/quiz/{id}/attempts`) is the newer path,
  derives `selectedQuestionIds` server-side, and zeroes the counters.

The old endpoint is reachable, undocumented as legacy, and effectively duplicates a
hardened one. Pick one and remove the other.

### 2. Client-controlled scoring on `PATCH /api/attempt/{id}`

`AttemptController.patchAttempt` accepts client-provided `correctAnswers`,
`incorrectAnswers`, `partiallyCorrectAnswers`, `finishedAt`, `timedOutAt` and writes them
straight to the entity. The frontend (`quiz-play.tsx`) actually uses this in EXAM mode to
keep the live counters in sync — but the server has all the data it needs to compute
those itself when each answer is recorded.

This is the "Attempt updates trust client-provided score counters" gap from
`rest-auth-spec.md`. Fix it before the bundle split — the take bundle should not have a
write API that lets it self-score.

### 3. `feedbackFrom` is the right idea but applied inconsistently

`QuestionResponse.feedbackFrom` strips `workspaceGuid` but otherwise returns the full
question (including correct answers + explanations). Used in two places:

- `QuestionScoringService.evaluate` — returned from per-question submit. Correct: the
  user just submitted, feedback is appropriate.
- `QuizTakeController.submitQuiz` — returned in `QuizSubmitResponse.questions`. Correct:
  exam-mode end-of-quiz feedback.

The risk is drift: a future endpoint reusing `feedbackFrom` pre-submit would silently
leak. Make the contract explicit.

### 4. No DTO contract test

There is no test that asserts "no take endpoint serialises `correctAnswers` or
`explanations` before submission." A regression here is the kind of bug nobody notices
until somebody scrapes the API.

## Approaches

**Pick one attempt-create path.** Remove `AttemptController.createAttempt` and direct
all callers to `POST /api/quiz/{id}/attempts`. Migrate the frontend (`#api/stats.ts`) and
specs in the same change.

**Move scoring server-side.** EXAM mode currently `PATCH`es running counters from the
client. Replace with:

- `POST /api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit` already exists
  and updates the counters server-side for EXAM mode. Make it the only writer.
- `PATCH /api/attempt/{id}` shrinks to non-score fields only (`timedOutAt`, `finishedAt`).
  Or, ideally, those move to dedicated endpoints (`/timeout`, `/finish`) that recompute
  state server-side.
- The `AttemptPatchRequest` record loses three fields.

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

- `backend/src/main/java/cz/scrumdojo/quizmaster/attempt/AttemptController.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/attempt/AttemptPatchRequest.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/quiz/QuizTakeController.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/question/QuestionResponse.java`
- `frontend/src/api/stats.ts` — `patchAttempt` shrinks; counter writes go away.
- `frontend/src/pages/take/quiz-take/quiz-play.tsx` — drops the `answerCounts` ref and
  the `patchAttempt` calls in `handleAnswerSubmitted`.
- `backend/src/test/.../quiz/QuizTakeControllerTest.java` — new no-leak contract test.
- `specs/features/mcpserver/rest-auth-spec.md` — once the score-counter gap is closed,
  cross it off the "important security gaps" list.

## Notes

- **Sequencing:** must precede `frontend-bundle-split.md`. The take bundle's API client
  should ship without the patch-counter writes; doing the split first means doing it
  twice.
- **Independent of:** Robin UX, AI service refactor, MCP refinements, foreign-concept docs.
- Pairs with `workspace-routing-cleanup.md` (both consolidate controller-layer surface)
  but the dependency is soft — they touch disjoint controllers.
- Authorisation (the `@skip` scenarios in `RestApi.SecurityFoundation.feature`) is a
  larger effort and explicitly **out of scope** for this concern. This concern is about
  *what* the take surface returns and accepts, not *who* may call it.
