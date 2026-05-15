# Steps Overhaul — Refactor Plan

## Status (2026-05-15)

Partial progress already landed:

- `specs/src/steps/make/{workspace,question,quiz}/` and `specs/src/steps/take/` exist — file-layout Option A is being adopted incrementally.
- `specs/src/steps/shared/{specs.ts,parsers.ts,api.ts}` exist — the shared
  spec types, the canonical answer/row parser, and REST helpers are in place.
- Question builder and bulk paths appear migrated; the "Auto Workspace"
  fallback has been cleaned up (no remaining reference in `specs/src/steps/`).

Still to do, mapped to the original plan:

- **Steps 2–4** — verify Q5 numerical and Q4 standalone-`Given questions`
  migrations are complete in practice (audit, then either close or finish).
- **Step 5** — confirm `Given a question` / `Given a quiz` article-drop is
  done across all features.
- **Step 7** — capability-parity matrix audit and smoke scenario per path.
- **Step 8** — `expectActive()` pilot on the question side.
- **Step 9** — `QuizSpec` + `createQuiz`; quiz builder migration; quiz GUI
  relocation.
- **Step 10** — workspace single-point + delete-empty-legacy-files sweep.

The numbered sections below are the original plan, kept as the source of
truth for design decisions; treat them as the spec, this status block as
the cursor.

## Context

The BDD step layer for creating workspaces, questions, and quizzes has accreted multiple parallel paths over time:

- **Six** ways to create a question (UI form, builder chain, two near-twin bulk DataTables, dedicated numerical steps, AI), with inconsistent capability coverage (tags missing in bulk, per-answer explanations missing in bulk, image missing in standalone, numerical siloed).
- **Three** ways to create a workspace, including an implicit lazy fallback (`'Auto Workspace'`) that hides intent.
- **Two** ways to create a quiz, one of which is phrased as `Given` but actually drives the UI.
- Inconsistent grammar (`Given a question` vs `Given workspace` vs `Given a quiz`).
- Bookmarks are inconsistent (some paths bookmark, some don't, defaults collide silently).
- Step files live flat under `specs/src/steps/<entity>/` with no clear `make` vs `take` separation, while feature files do split that way.
- Answer-string parsing is duplicated across files.

The goal is to consolidate every creation path through a single per-entity spec object and creation function, unify the bulk DataTable format, give builder/bulk parity with the GUI form, mirror the `features/` `make/take` directory layout in the steps tree, and clean up legacy background-workspace usage. This sets us up for a future swap from UI-driven setup to REST-based setup without rewriting scenarios.

**Migration strategy:** keep the existing files in place and *move* code into the new structure piece by piece as it gets refactored. The diff between old and new locations is the progress indicator. The exact final shape of `steps/make/` and `steps/take/` will be discovered along the way, not designed up front.

## Design decisions (locked in)

- **Single point per entity.** A `QuestionSpec` / `WorkspaceSpec` / `QuizSpec` data type plus one `createQuestion(world, spec)` / `createWorkspace` / `createQuiz` function. Every non-GUI path constructs a spec and calls the function. Today these functions drive the UI internally; later they'll switch to REST without touching callers.
- **GUI steps stay literal.** Steps phrased as `When I enter ...` / `When I select ...` / `When I submit ...` keep manipulating the UI directly — they exist precisely to test UI behavior, and some scenarios assert on UI reactions. Only **builder** and **bulk** steps go through the unified pipeline.
- **File layout: Option A** — mirror `specs/features/`:
  ```
  specs/src/steps/
    make/
      workspace/   gui.ts, builder.ts, bulk.ts, ops.ts, expects.ts
      question/    gui.ts, builder.ts, bulk.ts, ops.ts, expects.ts
      quiz/        gui.ts, builder.ts, ops.ts, expects.ts
    take/
      question/    ...
      quiz/        ...
    shared/        world.ts, specs.ts, parsers.ts
  ```
  Take scenarios importing from `make/*/builder.ts` or `bulk.ts` for setup is fine and expected.
- **Grammar:** drop the article everywhere — `Given workspace "X"`, `Given quiz "X"`, `Given question "What is 2+2?"`. Done as a dedicated mechanical rename step late in the sequence.
- **Bookmarks:** every creation path bookmarks. Explicit bookmark wins; default falls back to question text / quiz name / workspace name. **Duplicate bookmark = hard error**, not silent overwrite.
- **Bulk DataTable:** one canonical column set covering every QuestionSpec field (text, choice type, answers with per-answer correct + explanation, question explanation, image, tag, easy, tolerance, bookmark) and one canonical answer notation.
- **Background workspace cleanup:** sort scenarios into "workspace truly irrelevant → keep implicit but rename default to something descriptive" vs "workspace matters → make it explicit with a meaningful name."

## Deferred (explicitly out of scope for this refactor)

- Switching `createQuestion`/`createQuiz` from UI-driven to REST. The single-point design makes this a one-file change later.
- Solving quiz default-value duplication when moving quiz creation to REST (form prefills today; scenarios only specify deltas).
- Bookmarking entire quiz objects (not just IDs) for richer assertions.
- Renaming GUI steps to actor-prefixed form (`When quiz maker creates...` / `When quiz taker answers...`) for future multi-browser scenarios.
- Splitting page objects.
- Fixing `@skip` and `@ai` scenarios — carry forward as-is.

## Critical files

**Will be read/refactored:**
- `specs/src/steps/workspace/workspace-create.ts`
- `specs/src/steps/workspace/ops.ts`
- `specs/src/steps/question/question-create.ts`
- `specs/src/steps/question/question-edit-gui.ts`
- `specs/src/steps/question/ops.ts`
- `specs/src/steps/quiz/quiz-create.ts`
- `specs/src/steps/quiz/quiz-create-new.ts`
- `specs/src/steps/quiz/quiz-edit.ts`
- `specs/src/steps/quiz/ops.ts`
- `specs/src/pages/*` (referenced, mostly not modified)
- `specs/src/world/*` (for `questionWip`, `workspaceGuid`, `questionBookmarks`, `quizBookmarks`)

**Feature files touched (rename / phrasing only) in later steps:**
- `specs/features/make/workspace/*.feature`
- `specs/features/make/question/*.feature`
- `specs/features/make/quiz/*.feature`
- `specs/features/take/**/*.feature`

## Staged execution

Each numbered step is one logical change; most expand into 2–3 small commits per the saved guidance on vertical slices and commit separation. After each step the suite must be green (`pnpm code` + `pnpm test:e2e`). **Pause between steps** to reassess — details will surface that may reorder later steps.

### Step 1 — Introduce `QuestionSpec` + `createQuestion(spec)`; migrate the builder

**Goal:** Establish the target architecture on the smallest possible surface.

- Create `specs/src/steps/shared/specs.ts` with `QuestionSpec` (text, choiceType: 'single' | 'multiple' | 'numerical', answers: `{text, correct, explanation?}[]`, numericalAnswer?, tolerance?, explanation?, image?, tag?, easy?, bookmark?).
- Create `specs/src/steps/make/question/ops.ts` exporting `createQuestion(world, spec)`. Implementation drives the UI exactly like today's `workspace/ops.ts::createQuestionInWorkspace`, but takes a `QuestionSpec` instead of a positional grab-bag.
- Add bookmark bookkeeping: default to `spec.text`, fail loudly on duplicate.
- Move the builder steps (`Given a question "..."` + `* with answers / image / tag / explanation / marked as easy / saved and bookmarked as`) into `specs/src/steps/make/question/builder.ts`. They now accumulate a `QuestionSpec` and call `createQuestion` on save.
- Delete the migrated step definitions from `question/question-create.ts` (leave the file if other steps remain).
- No feature file changes. No semantic change.

**Verification:** `pnpm code && pnpm test:e2e` — full suite green; no scenario phrasing changed.

**Commits:** (a) introduce shared spec + create function, (b) migrate builder steps to new location and pipeline.

---

### Step 2 — Dissolve numerical question (Q5) into the builder

**Goal:** First real cleanup. Validates Step 1's design by removing a whole parallel path.

- Add numerical support to `QuestionSpec` (already there) and ensure `createQuestion` handles `choiceType: 'numerical'` end-to-end via the UI.
- Add builder grammar: `* with numerical answer "3.14"` and `* with tolerance "0.5"` (or fold into one step — TBD when writing it).
- Migrate every scenario using `Given a numerical question ...` to the builder form.
- Delete the three numerical `Given` overloads from `question-create.ts` and `createNumericalQuestionInAutoWorkspace` from `workspace/ops.ts`.

**Verification:** scenarios under `specs/features/make/question/Question.Numerical.feature` (and any others matching `numerical question`) still pass.

**Commits:** (a) add numerical capability to builder, (b) migrate scenarios + delete legacy steps.

---

### Step 3 — Move question GUI steps to `make/question/gui.ts`

**Goal:** Pure relocation, no semantic change. Establishes the `make/` tree.

- Move `question-edit-gui.ts` → `specs/src/steps/make/question/gui.ts`.
- Update imports.
- GUI steps remain literal UI drivers — they do **not** go through `createQuestion`. They continue to mutate `world.questionWip` (or whatever local form state they use).
- Keep `When I ask AI:` here, untouched.

**Verification:** full suite green; reviewable as a diff of mostly-moves.

**Commits:** single commit.

---

### Step 4 — Unify the bulk DataTable format and migrate `Given workspace "..." with questions`

**Goal:** Kill the duplicated answer-parsing logic and establish the canonical bulk shape.

- Create `specs/src/steps/shared/parsers.ts` with one `parseAnswers(cellOrTable)` function and one `parseQuestionRow(row): QuestionSpec` function.
- Define the canonical column set: `bookmark, question, choice, answers, explanation, image, tag, easy, tolerance`. Decide whether per-answer explanations live as a sub-DataTable or use a richer answer-cell mini-syntax — pick when implementing.
- Move workspace creation + the `with questions` variant to `specs/src/steps/make/workspace/builder.ts` and `bulk.ts`. The bulk path builds `QuestionSpec`s and calls `createQuestion` for each.
- Leave the standalone `Given questions` (Q4) alone for now — Step 6 handles it.

**Verification:** existing scenarios using `Given workspace "..." with questions` pass without phrasing changes if old columns still parse; if columns must change, migrate scenarios in the same commit.

**Commits:** (a) shared parsers + spec, (b) move workspace creation + bulk to new location.

---

### Step 5 — Drop the article: `Given a question` → `Given question`

**Goal:** Mechanical rename across features and step regexes. Done as its own step so the diff is purely cosmetic and reviewable.

- Rename in `make/question/builder.ts` and `make/question/bulk.ts` step regexes.
- Sed/Edit across all feature files in `specs/features/`.
- Same for any `Given a quiz` if it exists (audit during this step).
- Workspace was already article-free.

**Verification:** full suite green; diff is pure rename.

**Commits:** single commit.

---

### Step 6 — Migrate `Given questions` (Q4) and sort background-workspace usage

**Goal:** Eliminate the Q3/Q4 duplication and clean up legacy implicit workspaces. This is the most judgment-heavy step.

- Audit every scenario using `Given questions` (standalone bulk) or relying on the implicit `'Auto Workspace'` fallback.
- For each scenario, decide:
  - **Workspace truly irrelevant** → keep implicit, but rename the default workspace from `'Auto Workspace'` to a more descriptive label (e.g., `'Default Workspace'`, or topic-specific). Possibly inject the scenario name.
  - **Workspace matters** → add an explicit `Given workspace "..."` with a meaningful name.
- Migrate `Given questions` callers either to `Given workspace "..." with questions` or to a renamed standalone form that uses the same bulk parser from Step 4.
- Decide whether to keep `Given questions` as a thin wrapper or delete it entirely.
- Delete `ensureWorkspace()` if no longer reachable; otherwise leave it with a clearer name.

**Verification:** scenarios per-area; this step will likely span several commits, one per feature file or small group.

**Commits:** multiple — split by feature area or domain (workspace creation, question creation, take scenarios, etc.) per the commit-separation guidance.

---

### Step 7 — Capability parity audit

**Goal:** Ensure GUI / builder / bulk all support the full `QuestionSpec`.

- Build a checklist matrix: rows = QuestionSpec fields, columns = {gui, builder, bulk}. Mark each cell.
- Fix gaps. Likely fixes:
  - `tag` in bulk (currently missing).
  - per-answer explanation in bulk (currently missing — depends on Step 4 design).
  - `image` in standalone bulk (now folded into unified bulk by Step 4 — verify).
  - any builder grammar gaps for fields only the GUI exposes today.
- Add a small smoke scenario per path that exercises every field, so future regressions are caught.

**Verification:** new smoke scenarios pass; existing scenarios untouched.

**Commits:** one per gap fix, plus one for smoke scenarios.

---

### Step 8 — Page-object precondition guards (pilot on question side)

**Goal:** Replace opaque "10s timeout waiting for `#some-button`" failures with clear "expected to be on workspace page, got `/question/42`" errors. Pilot the pattern on the question side, where Steps 1–7 have just landed everything in its final shape, before propagating to quiz and workspace in Steps 9–10.

- Add `expectActive()` to `WorkspacePage` and `QuestionEditPage`. Check both URL pattern and a signature element being visible — URL alone races mid-navigation, element alone misses ID-bearing distinctions between same-template pages.
- Decide the naming convention here, once: `expectActive` vs `expectVisible` vs `assertActive`. Document the choice in the page-object style guide so Steps 9–10 don't bikeshed.
- Wire the call into every step in `make/question/**` and `take/question/**` that **acts on** the current page. Skip steps that **navigate** to a page (they're establishing the precondition for the next step, not consuming one).
- Pick one pre-existing scenario whose failure mode today is opaque, deliberately break it locally, confirm the new error message reads clearly, then unbreak.
- Decide cost-of-noise: if `expectActive` adds ≥100 ms per step, audit which checks are actually pulling weight and trim.

**Out of scope here (Steps 9 / 10 absorb these):**
- `QuizCreatePage.expectActive()` — added when Step 9 refactors quiz steps.
- Remaining `WorkspacePage` callers in `take/quiz/**`, `quiz/**`, etc. — added when those step files are touched in Steps 9–10.
- Folding the check into action methods on the page object. Keep it explicit at the **step** level. The orchestration layer is where contracts belong; coupling actions to preconditions doubles the cost when steps chain multiple actions and obscures where the check came from.

**Verification:** full suite green. The deliberately-broken scratch scenario produces a clear error and not a Playwright timeout.

**Commits:** (a) add `expectActive` to the two page objects + wire into make/question/** callers, (b) wire into take/question/** callers.

---

### Step 9 — Quiz: introduce `QuizSpec` + `createQuiz(spec)`; migrate `Given a quiz ...`

**Goal:** Apply the same single-point pattern to quizzes.

- Add `QuizSpec` to `shared/specs.ts` (title, description?, questionBookmarks: string[], mode?, passScore?, timeLimit?, randomized?, randomCount?, difficulty?, bookmark?).
- Create `specs/src/steps/make/quiz/ops.ts` with `createQuiz(world, spec)`. Implementation drives the UI like today.
- Move `Given a quiz "..." with N questions` / `with all questions` / `with questions "..."` and the optional properties DataTable into `specs/src/steps/make/quiz/builder.ts`. They build a `QuizSpec` and call `createQuiz`.
- Validate property DataTable keys — unknown keys must error (currently silent failure).
- Move quiz GUI steps to `make/quiz/gui.ts` (relocation only, like Step 3 for question).
- Drop article: `Given a quiz` → `Given quiz` if not already done in Step 5.
- Add `QuizCreatePage.expectActive()` and wire it into the new `make/quiz/**` step files as they're written, following the convention settled in Step 8.

**Verification:** quiz make + take scenarios pass.

**Commits:** (a) introduce QuizSpec + createQuiz, (b) migrate builder, (c) move GUI steps + wire `expectActive`, (d) rename if needed.

---

### Step 10 — Workspace single-point + final tree cleanup

**Goal:** Finish the entity trio and lock in the new layout.

- Add `WorkspaceSpec` (name, optional embedded questions) and `createWorkspace(spec)` if not already done implicitly in Step 4.
- Move workspace GUI steps to `make/workspace/gui.ts`.
- Delete legacy files in `specs/src/steps/{workspace,question,quiz}/` if empty.
- Move `take/` step files to `specs/src/steps/take/<entity>/` mirroring features.
- Update any import paths.
- Wire `expectActive` (Step 8 convention) into any remaining `make/workspace/**` and `take/**` step files touched here that don't already have it.

**Verification:** full suite green; `specs/src/steps/` now mirrors `specs/features/` cleanly.

**Commits:** (a) workspace single-point + GUI move, (b) take/ relocation + remaining `expectActive` wiring, (c) delete-empty-legacy-files.

---

## Risks & details to watch

- **Bookmark collisions** during Step 1 — running scenarios may reveal scenarios that today get away with duplicate question text. Fix per-scenario as they fail.
- **`world.questionWip`** is shared mutable state. Once builder accumulates a fresh `QuestionSpec` per chain, decide whether `wip` is still needed at all (the GUI steps still need form-state tracking).
- **Quiz creation still goes via UI** through Step 10 and beyond. Quiz scenarios depend on form prefilling defaults — do not break this path until the deferred default-value problem is solved.
- **`@skip` and `@ai` scenarios** carry forward untouched.
- **Per-commit hygiene:** check `git status` after every `pnpm code` run — auto-formatted files must land in the same commit.
- **Vertical slices:** every commit must introduce *and use* the new step / spec / function in the same diff — never land infrastructure without wiring.
- **No bundling unrelated changes** across entities or step types.
- **Rebase the WIP branches first** before starting Step 1 — this refactor will touch many of the same files.

## Verification

After every step:

```bash
pnpm code        # TypeScript + Biome lint/format
pnpm test:e2e    # full BDD suite (builds frontend, starts backend, runs specs)
```

If `pnpm test:e2e` reports ports 8080 / 5173 in use, ask the user to stop the running servers — do not kill processes automatically.

End-state success criteria:
- One spec type and one creation function per entity, used by every non-GUI step.
- `specs/src/steps/` mirrors `specs/features/` (`make/` and `take/`).
- Builder, bulk, and GUI paths support the same QuestionSpec fields.
- Every creation path bookmarks; duplicates raise a clear error.
- No `Given a <entity>` phrasing remains; uniform `Given <entity> "..."` everywhere.
- No `'Auto Workspace'` literal; background workspaces are either explicit or use a descriptive default.
- `Given a numerical question`, standalone `Given questions`, and the legacy flat step files are gone.
