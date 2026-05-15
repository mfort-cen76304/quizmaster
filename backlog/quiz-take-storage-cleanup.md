# Quiz take session storage — drop in favour of URL + server fetch

## Why

The take pipeline still leans on `frontend/src/take/quiz-take/quiz-session.ts`
to survive page reloads:

- `quizRunId:<quizId>` — the active attempt id, written when the welcome
  page starts an attempt and read by the take page on every render.
- `quizAnswers` — the in-progress answer arrays
  (`firstAnswers` / `finalAnswers`).

Both exist purely so a refresh mid-attempt does not lose state. They were
defensible when the server did not own the answer trail. That is no longer
true: every per-question submission goes to
`POST /api/quiz/{id}/attempts/{attemptId}/questions/{questionId}/submit`,
and the attempt id is already a stable resource. The session storage is a
remnant of an earlier era and should go away.

It also has a small but real edge case the dry-run unification surfaced:
`quizRunId` is keyed by `quizId` only, so a regular attempt and a dry-run
attempt for the same quiz share a slot. Starting one overwrites the other.
Patching the keying would be a band-aid; the right fix is to remove the
storage.

## Approach

1. **Put `attemptId` in the take URL.** Today the take routes are
   `/quiz/:id/questions/:questionId?` and
   `/workspace/:workspaceId/quiz/:id/dry-run/questions/:questionId?` —
   neither names the attempt. Move to
   `/quiz/:id/attempts/:attemptId/questions/:questionId?` (and the
   workspace-scoped analogue for dry-run). The URL becomes the sole
   source of truth for "which attempt am I in", which makes refresh,
   bookmarking, and sharing trivial.

2. **Add a server fetch for in-progress answers.** Today the FE replays
   `quizAnswers` from `sessionStorage` on reload. Replace with a backend
   read endpoint (e.g. `GET /api/quiz/{id}/attempts/{attemptId}/answers`)
   that returns the answers already submitted on this attempt. The take
   page rehydrates from that on mount.

3. **Delete `quiz-session.ts`** and every call site
   (`getStoredQuizRunId`, `setQuizRun`, `clearQuizRun`,
   `loadQuizAnswers`, `storeQuizAnswers`, `clearQuizTakeSession`).

## Notes

- Out of scope for the dry-run unification (already shipped). That slice
  ships the current `sessionStorage` behaviour unchanged; dry-run and
  regular attempts share the same `quizId`-only key. The collision case
  (interleaved regular + dry-run for the same quiz in the same browser
  profile) is documented as a known limitation that this entry resolves.
- Sequencing: independent of the take API hardening
  (`quiz-take-api-hardening.md`), but a good follow-up to it. Both
  shrink the take surface.
- Cucumber specs already exercise refresh-during-attempt indirectly via
  the timer scenarios; verify those continue to pass after the rewrite.
