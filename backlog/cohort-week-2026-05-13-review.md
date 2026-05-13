# Code Review: This week's cohort additions (2026-05-07 → 2026-05-13)

**Scope:** ~113 files, +2730 LOC. Concentrated on three streams: (1) **Cohorts** — entity, migration V00057/V00058, request/response DTOs, frontend cohorts section, cohort welcome URL; (2) **Per-question stats** — `question_stats_log` table (V00054), event logging in `QuizTakeController`, workspace-page stats; (3) **Cohort leaderboard** — `/api/quiz/{id}/leaderboard`, leaderboard panel on welcome page.

## Good Patterns

- **Cohort entity carries a public `guid` separate from the internal `id`** (`Cohort.java:21,33-35`) — same pattern as Workspace. Good: the URL-facing identifier doesn't leak DB rows.
- **`QuizTakeControllerTest` covers the cohort happy path, cross-quiz rejection, and the dry-run exclusion from the leaderboard** (`QuizTakeControllerTest.java:92-145, 186-245`). The leaderboard expectation uses `content().json(text block)` per the convention.
- **`findByGuidAndQuizId` enforces that a cohort guid is only resolvable against its own quiz** (`CohortRepository.java:10`, used at `QuizTakeController.java:204`). Prevents cross-quiz cohort spoofing in attempt creation.
- **Migration V00054 models `question_event_type` as a referenced lookup table** rather than a check-constraint enum — extending it later (e.g. V00056 adds `TIMEOUT`) is a one-line insert.
- **Welcome page degrades gracefully** when leaderboard is empty (`quiz-details.tsx:63` — conditional render), so older quizzes without cohorts still render.

## Issues

### Clarity / Simplicity

- **`GlobalExceptionHandler` directly violates `controller-style.md`** (`backend/src/main/java/cz/scrumdojo/quizmaster/config/GlobalExceptionHandler.java`). The convention says *"Spring Boot's default 400 response is sufficient — no custom `@ControllerAdvice` needed"*, but this advice introduces three handlers including a generic `Exception` catch-all that returns the raw `ex.getMessage()` in the 500 response (`GlobalExceptionHandler.java:38-46`). That leaks internal exception messages to clients and overrides Spring's own logging-and-suppression of unexpected errors. **Convention deviation + security smell.**

- **Swallowed exceptions in `submitAttemptQuestion`** (`QuizTakeController.java:350-354`):
  ```java
  try { saveAttemptQuestionLog(...); } catch (Exception ignored) { /* ignore logging error */ }
  ```
  If stat logging fails silently, per-question stats quietly diverge from reality. Either don't catch (let the transaction fail visibly) or log at `WARN`. The same controller's `embedBestEffort` pattern (logging the failure) is the right precedent.

- **Question stats are calculated twice in `WorkspaceQuestionController`** — inline in `getWorkspaceQuestions` (`WorkspaceQuestionController.java:62-79`) and in the helper `toQuestionStats` (`WorkspaceQuestionController.java:137-150`). The endpoint and the unit test exercise different copies of nearly-identical logic. One will drift from the other.

- **`QuizTakeController` has grown to 432 LOC and 10 collaborators.** Leaderboard ranking, cohort resolution, attempt creation, scoring, stats logging, and unanswered-question finalization are all inline. The new pieces (`buildLeaderboard`, `calculateAttemptScore`, `findTimedOutQuestionId`, `finalizeUnansweredQuestion`) belong in a service — `QuizService` already exists. The controller pattern in `WorkspaceQuizController` keeps the controller thin and delegates to `QuizStatsService`.

- **`Quiz.cohorts` uses `FetchType.EAGER`** (`Quiz.java:53`). Every `quizRepository.findByWorkspaceGuid` now triggers a join even when cohorts aren't needed (e.g. the workspace listing). Default LAZY is the conventional choice.

- **Manual `@PrePersist` for `Cohort.guid` duplicates the DB default** (`Cohort.java:31-36` vs `V00057...:3` `DEFAULT gen_random_uuid()`). Workspace does only the JPA side. Pick one; right now the DB default is dead.

- **Two cohort projections on `QuizResponse`** — `cohortNames: String[]` *and* `cohorts: QuizCohortResponse[]` (`QuizResponse.java:19-20`). The names array is redundant with `cohorts[i].name`. The TS type carries both as well (`shared/types/quiz.ts:35-36`). One field will silently rot.

- **`event_detail JSONB` is hand-built JSON strings** — `"{}"`, `objectMapper.writeValueAsString(Map.of(...))` (`QuizTakeController.java:185, 408-414`). A typed record would prevent the kind of "what fields go in here" archaeology we already see between `correct`/`answeredAt`/`score`.

- **Czech comments and Czech migration descriptions** — `V00054...:8-11` (`'Otázka nebyla zobrazena ani zodpovězena'` and three more), `V00054...:20` (`-- volitelné detaily`), `WorkspaceQuestionController.java:70` (`// Úspěšnost…`). The domain vocabulary in `docs/domain-language.md` is English. Mixing languages here makes the table data look like UI copy when it's really just developer notes.

### Domain language drift

- **`QuizAttemptStartResponse` has no cohort echo.** A cohort was selected but the FE has no way to confirm the server resolved it correctly — it just knows it got a 200. Not a bug today, but the API surface lies a little: `cohortGuid` is accepted, never returned. (`QuizAttemptStartResponse` was not extended.)

- **Magic strings for event types** — `"ABANDONED"`, `"VIEWED"`, `"ANSWERED"`, `"SKIPPED"`, `"TIMEOUT"` are local `static final String` constants in `QuizTakeController.java:42-46` *and* literal strings in `QuizStatsService.java:85-87` and `WorkspaceQuestionController.java:65-72`. The migration's `question_event_type` table is the source of truth — an enum mirroring it would tie them all together and is more idiomatic than three sets of string constants.

### Test coverage

- **`WorkspaceQuestionStatsCalculationTest` instantiates the controller with `null` collaborators** (`WorkspaceQuestionStatsCalculationTest.java:9-16`) and calls `toQuestionStats` directly. This violates `controller-style.md`'s testing rule ("test through HTTP, not direct controller method calls") *and* it tests the duplicate helper, not the path the production endpoint actually runs. The two scenarios (`timeoutCountsAsAskedAndSkipped`, `correctAnswerStillUsesAskedCountIncludingSkippedAndTimeout`) should be MockMvc tests that seed `question_stats_log` rows.

- **No backend test for the cohort edit round-trip.** `WorkspaceQuizController.updateQuiz` (`WorkspaceQuizController.java:107-141`) does the tricky `clear → saveAndFlush → re-add` dance — there's a multi-line comment explaining a uniqueness-constraint workaround, but no test exercising "edit a quiz, rename a cohort, keep the others". The Gherkin in `Quiz.Edit.feature` covers add/duplicate/discard but not edit-then-re-add.

- **Cohort URLs become invalid after any edit.** `QuizRequest.cohortNames: List<String>` (`QuizRequest.java:20`) carries no guid, and `updateQuiz` clears and re-inserts every cohort (`WorkspaceQuizController.java:128-137`). Any shared cohort URL (`/quiz/:id/cohort/:cohortGuid`) breaks the next time a maker saves the quiz. The `Quiz.Share.feature` scenario is `@skip`, so this isn't covered yet. Recommend `QuizRequest` carry `List<{guid?, name}>` instead.

- **Leaderboard rounding is asserted via the cohort test but not documented.** `score = Math.round(earnedPoints / totalQuestions * 100)` (`QuizTakeController.java:131`) — `Retro Masters` lands on `63%` (2 + 0.5 ×1 = 2.5/4 → 62.5, rounded). The spec asserts `50` (`Quiz.Welcome.feature:65`) but the controller test asserts `63` (`QuizTakeControllerTest.java:141`). Two scenarios, different rounding expectations for the same arithmetic. **One of them is wrong.**

- **`pnpm test:be:local` is broken locally** by a Flyway checksum mismatch on `V00058`. The dev DB has a prior checksum from when `V00058` was a different file (the cohort-FK migration that got reordered in `61958789`). This is local-state, not a code defect, but it means the contributor wasn't running the suite — and it indicates a process gap: simultaneous Flyway numbers landed on master and were renumbered after the fact. Worth a one-liner in `team/definition-of-done.md` or `team/working-agreement.md`.

### Documentation drift

- **`docs/domain-language.md` mentions cohorts only in passing** ("optional cohorts used to group takers", "optional selected cohort"). The new welcome leaderboard and cohort URL share are not described. Per `CLAUDE.md`'s sync rule, this should be updated in the same change.

- **`CLAUDE.md` REST surface section** does not list `/api/quiz/{id}/leaderboard` or `POST /api/quiz/{id}/attempts` (cohort variant). Per the CLAUDE.md rule "If you change the public REST surface or routes, check `CLAUDE.md`", this is drift.

- **Cohort name 30-char limit duplicated** in three places without a shared constant (`Cohort.java:23 length=30`, `V00057...:5 VARCHAR(30)`, `cohorts-section.tsx:9 MAX_COHORT_NAME_LENGTH`). Either share via `/shared/defaults/` or accept the duplication and document it.

## Test Coverage

- **Strong, mostly:** `QuizTakeControllerTest` got 9 new methods covering cohort attempt creation (happy path + cross-quiz rejection + dry-run exclusion), timeout, and evaluation. `WorkspaceQuizStatsTest` got 4 new methods.
- **Gap:** Cohort edit round-trip (renames, reorderings, guid preservation across saves) — not tested.
- **Gap:** "Reject malformed UUID in `cohortGuid`" — current behavior returns the "doesn't belong to this quiz" message even for non-UUID strings (`QuizTakeController.java:202-207`). Not asserted; arguably wrong message.
- **Gap:** Leaderboard with mixed quiz states (in-progress attempts, timed-out attempts) — the test only seeds finished ones. The code skips them (`QuizTakeController.java:93`) but it's not asserted.
- **Anti-pattern:** `WorkspaceQuestionStatsCalculationTest` uses `new WorkspaceQuestionController(null, null, ...)` — violates the controller-test convention.

## Suggestions

1. **Delete `GlobalExceptionHandler`** — `backend/src/main/java/cz/scrumdojo/quizmaster/config/GlobalExceptionHandler.java`. The convention says don't add one, and the 500 handler leaks `ex.getMessage()`. *Plan: remove the file, run `pnpm test:be:local`, fix any test that depended on the custom `{"status","error","message"}` shape — the new cohort-rejection test (`QuizTakeControllerTest.java:242`) reads `$.message`, so that response should switch from `ResponseEntity.badRequest().body(Map.of(...))` to plain `ResponseEntity.badRequest().build()` *or* a small typed record like `ErrorResponse(String message)`.*

2. **Collapse the two `toQuestionStats` implementations.** *Plan: remove the inline body in `WorkspaceQuestionController.getWorkspaceQuestions:62-79`, group logs by question id, call `toQuestionStats(logs)` once per question. Then convert `WorkspaceQuestionStatsCalculationTest` into a `@SpringBootTest` MockMvc test that seeds `question_stats_log` directly via repository.*

3. **Resolve the leaderboard rounding mismatch.** Either the spec or the BE test is wrong. `Math.round(0.625 × 100) = 63`, not `50`. *Plan: decide whether half-credit counts (probably yes — partial answers are real domain). Fix `Quiz.Welcome.feature:65` to expect `63`, OR change the formula if the workshop wants integer-correct only. Document the choice in `docs/domain-language.md` since the "score" formula is now load-bearing.*

4. **Move cohort guids into `QuizRequest`** so edits preserve identity. *Plan: change `QuizRequest.cohortNames: List<String>` → `cohorts: List<CohortInput { String guid?; String name; }>`. In `updateQuiz`, match incoming cohorts to existing by guid; delete unmatched; insert ones without a guid. Update FE form state to carry guids alongside names. Then unskip `Quiz.Share.feature` and add a Gherkin scenario that edits a quiz and re-asserts the shared URL still resolves.*

5. **Stop swallowing logging errors in `submitAttemptQuestion`.** *Plan: remove the try/catch at `QuizTakeController.java:350-354`. If `saveAttemptQuestionLog` can fail, fix the underlying cause (likely a serialization issue with the `eventDetail` map); otherwise let the transaction surface the failure.*

6. **Replace event-type magic strings with an enum.** *Plan: introduce `QuestionEventType { ABANDONED, VIEWED, ANSWERED, SKIPPED, TIMEOUT }` in `cz.scrumdojo.quizmaster.question`. Annotate `QuestionStatsLog.eventType` with `@Enumerated(EnumType.STRING)`. Drop the local string constants in `QuizTakeController`, `QuizStatsService`, `WorkspaceQuestionController`. The `question_event_type` lookup table can stay as a FK target (the names line up).*

7. **Move leaderboard ranking out of the controller.** *Plan: add `QuizService.buildLeaderboard(Quiz)` returning `QuizLeaderboardResponse`. Move `calculateAttemptScore`, `averageScore`, and `CohortLeaderboardRow` with it. `QuizTakeController.getQuizLeaderboard` becomes the same two-line `okOrNotFound` shape every other GET uses.*

8. **Switch `Quiz.cohorts` to LAZY** and add a dedicated `findByIdWithCohorts` for endpoints that need them. *Plan: change `FetchType.EAGER` → `LAZY` in `Quiz.java:53`. Run `pnpm test:be:local` — any `LazyInitializationException` indicates a call site that needs an explicit fetch-join or `@Transactional` boundary. Most read paths (workspace listing, `getTakeQuiz`) don't need cohorts.*

9. **Drop the redundant `cohortNames` field on `QuizResponse` and the TS `Quiz`** — keep only `cohorts: QuizCohortResponse[]`. *Plan: remove from `QuizResponse.java:19`, `QuizService.toQuizResponse:47-49,66`, and `shared/types/quiz.ts:35`. Update callers (`addCohortToQuizViaRest` in `specs/src/steps/shared/api.ts:189` derives from `cohortNames` — switch to `cohorts.map(c => c.name)`; `quiz-form-state.ts:34` too).*

10. **Update docs in the same PR as the cohort/leaderboard slice.** *Plan: extend `docs/domain-language.md` "Quiz" section with cohort URL + leaderboard semantics. Add the two new endpoints (`GET /api/quiz/{id}/leaderboard`, `POST /api/quiz/{id}/attempts { cohortGuid }`) to the REST API section in `CLAUDE.md`. Per the project's stated sync rule this should ride with the code, not as a follow-up.*

11. **Clean the local Flyway state to unblock tests.** *Plan: ask the user to drop and recreate their local dev DB (or `flyway repair`) — `V00058` was modified after first apply during the cohort renumber. This is a local-state cleanup, not a code change; record a note in `docs/devenv/` so the next pair through hits less friction.*
