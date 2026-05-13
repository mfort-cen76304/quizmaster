# Collapse question stats into one `attempt_question` table

## Why

Question stats currently live in three overlapping pieces of state:

- **`Attempt.questionIds: int[]`** — the questions drawn for this attempt
  (matters under random subsets).
- **`Attempt.correctAnswers / partiallyCorrectAnswers / incorrectAnswers`** —
  scalar counters, denormalised cache of `AttemptQuestionScore.score`.
  `AttemptScoreService.applyRecomputedCounters` recomputes them from
  scratch on every submit.
- **`AttemptQuestionScore`** — one row per *answered* `(attempt, question)`
  with `score: ScoreOutcome` and `answered_at`.
- **`QuestionStatsLog`** — one row per `(attempt, question)` from attempt
  start, mutated through `ABANDONED → VIEWED → ANSWERED / SKIPPED /
  TIMEOUT`, with a free-form `event_detail: JSONB` blob that re-encodes
  `correct` and `answered_at`.

Three of these encode the same fact ("was this answer correct?") in three
representations: a typed enum (`AttemptQuestionScore.score`), a JSON
string field (`QuestionStatsLog.event_detail.correct`), and three integer
counters on `Attempt`. Every submission writes all three.

The funnel breakdown that `QuestionStatsLog` enables
(`shown / skipped / timeout / abandoned`) is finer-grained than the
domain actually wants. The user-facing need is per-question
**% correct / % partial / % incorrect**, plus attempt-level status
(in-progress / finished / timeout / abandoned) which is already implied
by `started_at / finished_at / timed_out_at`.

## What we'd lose

- The `shown` vs `viewed` vs `skipped` vs `timeout` vs `abandoned`
  funnel — collapses into `answered` vs `unanswered`. This is what
  triggered the simplification: it was always finer-grained than the
  domain needs.
- The free-form `event_detail` JSONB — currently used only to read
  `correct` back out, which `AttemptQuestionScore.score` already encodes.
- The Czech-text `question_event_type` lookup table introduced in V00054.

## Target shape

One row per `(attempt, question)`, created at attempt start, mutated as
the taker progresses:

```
attempt(
  id, quiz_id, cohort_id,
  started_at, finished_at, timed_out_at,
  is_dry_run
)

attempt_question(
  id,
  attempt_id,
  question_id,
  position,            -- preserves draw order (replaces int[] semantics)
  status,              -- enum: UNANSWERED, CORRECT, PARTIAL, INCORRECT
  answered_at NULL,
  UNIQUE(attempt_id, question_id)
)
```

Status starts at `UNANSWERED` for every drawn question; flips to
`CORRECT` / `PARTIAL` / `INCORRECT` on submit. Skip, timeout, and
abandoned all collapse into `UNANSWERED`.

Attempt-level status derives from timestamps:

| `started_at` | `finished_at` | `timed_out_at` | status      |
|---|---|---|---|
| set          | null          | null           | in-progress |
| set          | set           | null           | finished    |
| set          | set           | set            | timeout     |
| set          | null          | set            | abandoned   |

Per-question and per-attempt counts become trivial:

```sql
-- Per attempt
SELECT count(*) FILTER (WHERE status = 'CORRECT')   AS correct,
       count(*) FILTER (WHERE status = 'PARTIAL')   AS partial,
       count(*) FILTER (WHERE status = 'INCORRECT') AS incorrect
FROM attempt_question WHERE attempt_id = ?;

-- Per question across a quiz
SELECT count(*) FILTER (WHERE status = 'CORRECT') * 100.0 / count(*)
FROM attempt_question
WHERE question_id = ? AND status != 'UNANSWERED';
```

## Approach

1. **Migration.** New `Vxxxxx__collapse_attempt_question.sql`:
   - Rename `attempt_question_score` → `attempt_question`.
   - Add `position INT`, `status VARCHAR(16)`. Backfill `status` from
     `score` (`CORRECT / PARTIAL / INCORRECT`); add `UNANSWERED` rows
     for each `(attempt, question)` in `attempt.question_ids` that has
     no existing score row; backfill `position` from the array index.
   - Drop `attempt.question_ids`, `attempt.correct_answers`,
     `attempt.partially_correct_answers`, `attempt.incorrect_answers`.
   - Drop `question_stats_log`, `question_event_type`.

2. **Entity & repo.** `AttemptQuestion` (rename from
   `AttemptQuestionScore`) with `status: AnswerStatus` enum
   (`UNANSWERED / CORRECT / PARTIAL / INCORRECT`). Delete
   `ScoreOutcome`, `QuestionStatsLog`, `QuestionStatsLogRepository`,
   and the per-event string constants in `QuizTakeController:42-46`,
   `QuizStatsService:85-87`, `WorkspaceQuestionController:65-72`.

3. **Controllers.**
   - `QuizTakeController.createAttempt` writes N `attempt_question`
     rows with `status=UNANSWERED` and sequential `position`. No more
     `Attempt.questionIds` array, no more `QuestionStatsLog` seed loop.
   - `submitAttemptQuestion` updates one row's `status` and
     `answered_at`. The `try { saveAttemptQuestionLog(...) } catch
     (Exception ignored)` workaround at lines 350-354 disappears
     because there's only one write.
   - `skipAttemptQuestion`, `recordTimeout`, and the
     `finalizeUnansweredQuestion` helper all become no-ops or trivial
     state transitions — most of the question lifecycle bookkeeping in
     this controller goes away.
   - `evaluateQuiz` no longer writes `attempt.correctAnswers / ...`.

4. **Services.**
   - `AttemptScoreService.applyRecomputedCounters` and the cached
     counter fields it maintains: delete.
   - `QuizStatsService.toQuestionRecord` becomes a `count() FILTER`
     query against `attempt_question` instead of a two-source merge
     between `QuestionStatsLog` logs and `AttemptQuestionScore` scores.
   - `WorkspaceQuestionController.getWorkspaceQuestions` reads correct
     counts from `attempt_question.status` instead of parsing
     `event_detail.correct` JSON.

5. **DTOs.** `AttemptResponse` no longer needs the three counter
   fields — derive on read. `QuizEvaluationResponse.attempt` shrinks
   accordingly; FE consumers update.

6. **Specs.** Collapse `Quiz.Stats.feature` per-question table columns
   from `Shown | Answered | Skipped | Timeout | Abandoned | Correct |
   Partially Correct | Incorrect` to `Answered | Unanswered | Correct
   | Partially Correct | Incorrect` (or just the last three percentages
   if "unanswered" is implicit). Delete the
   `WorkspaceQuestionStatsCalculationTest` standalone unit — its
   behaviour is covered by the new SQL.

## Sequencing

- **Independent of** `quiz-take-storage-cleanup.md` and
  `quiz-take-api-hardening.md`, but lands in the same neighbourhood;
  doing both in the same week reduces churn on the take pipeline.
- **Resolves several items from
  `cohort-week-2026-05-13-review.md`**: the swallowed exception in
  `submitAttemptQuestion`, the magic-string event types, the duplicate
  `toQuestionStats` helpers, the hand-built `event_detail` JSON, and
  the `WorkspaceQuestionStatsCalculationTest` controller-with-nulls
  anti-pattern all disappear.
- Not a one-day slice — budget a week of cohort time. Net effect is
  fewer LOC, fewer tables, fewer write paths per submission.

## Out of scope

- Per-question timing ("average time spent on this question"). The
  current schema can't compute it either (no per-question start
  timestamp); if the feature is wanted, add a `viewed_at` column to
  `attempt_question` as a follow-up — but don't add it speculatively.
- User identity. `QuestionStatsLog.user_id` exists today but is never
  populated. Anything cross-attempt-per-user can wait until auth is
  a real feature (see `docs/mcp/rest-auth.md`).
