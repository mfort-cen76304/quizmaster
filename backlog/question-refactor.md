# Refactoring: `question-form.tsx` — Responsibilities & Abstraction Cleanup

## Problem Analysis

`frontend/src/pages/take/question-take/question-form.tsx` mixes 6 unrelated responsibilities at wildly different abstraction levels:

1. **Keyboard shortcut management** (`question-form.tsx:38-65`) — 27 lines of raw `window.addEventListener` for Enter-to-submit and digit-to-select, with `e.code` parsing and `Numpad`/`Digit` regex matching. The component shouldn't know about any of this.

2. **Numerical input auto-focus hack** (`question-form.tsx:67-86`) — 20 lines using `setTimeout` + `requestAnimationFrame` + `setInterval` polling every 50ms for up to 10 seconds. An environment timing workaround that has nothing to do with taking a question.

3. **Difficulty display-rule engine** (`question-form.tsx:99-107`) — 6-line nested ternary computing whether to show correct-answers count based on `quizDifficulty` and `isEasy`. Domain logic buried in the render tree.

4. **Tag-stripping text formatter** (`question-form.tsx:113`) — `question.replace(/^\[[^\]]+\]\s*/, '')` inline in JSX. Data transformation embedded in rendering.

5. **Parent notification dispatch** (`question-form.tsx:32-35`) — `useEffect` with `props` in deps (new object every render), causing `onAnswerSelected` to fire every render cycle.

6. **Submit-and-notify duplication** — the same `state.submit()` + `props.onSubmitted?.(...)` pattern appears at 3 call sites (lines 43-44, 58-59, 90-91).

### Surrounding module issues

- **`useQuestionFeedbackState`** (`question-feedback-state.ts:14-26`) — contains zero React hooks. It's a pure function disguised as a hook, falsely signaling statefulness.

- **`useQuestionTakeState.onNumericalAnswerChange`** (`question-take-state.ts:45-64`) — does correctness evaluation (`Math.abs(userAnswer - correctAnswer) <= tolerance`) and encodes the result as `selectedAnswerIdxs` = `[0]` (correct) or `[1]` (incorrect). This is correctness logic masquerading as input state management. Index `[1]` is a magic sentinel, not a real answer.

- **`Answer` component** (`answer.tsx:4-15`) — receives 10 props mixing input behavior (checkbox/radio) with feedback display (correctness coloring + explanation). Two different lifecycle states fused into one component.

### External consumers (must not break)

- `quiz.tsx` imports `QuestionForm` (aliased as `StandaloneQuestionForm`) — uses all props
- `quiz-take/components/question.tsx` imports `Answer` and `QuestionExplanation`
- `quiz-score.ts` imports `calculateScore`
- `question-take-page.tsx` imports `QuestionForm`

### Out of scope

The numerical answer correctness encoding (`[0]`/`[1]` in `useQuestionTakeState.onNumericalAnswerChange`) is deeply coupled to quiz scoring via `calculateScore`, `quiz-answers-state`, and `isAnsweredCorrectly`. Decoupling it requires coordinated changes across 4+ files and should be a separate effort.

---

## Completed

### Stage 1: Remove dead `errorCount` prop and simplify score model

Removed `errorCount` from `CorrectnessProps`, deleted `QuestionFeedbackScore` interface entirely, simplified `calculateScore` to return `number` directly. The `totalErrorCount` is still computed internally (drives the 0/0.5/1 logic) but is no longer part of any interface or return value.

**Files changed:**
- `frontend/src/pages/take/question-take/components/correctness.tsx`
- `frontend/src/pages/take/question-take/question-feedback-state.ts`
- `frontend/src/pages/take/question-take/question-form.tsx`
- `frontend/src/pages/take/quiz-take/quiz-score.ts`

---

## Remaining Stages

### Stage 2: Rename `useQuestionFeedbackState` to plain function

**Why:** Zero React hooks inside — it's a pure computation. The `use` prefix falsely signals statefulness.

**Changes:**
- `question-feedback-state.ts` — rename to `computeQuestionFeedback`
- `question-form.tsx` (line 30) — update call site
- `index.ts` — re-export alias for backwards compat (verify no external consumers first, drop alias if none)

---

### Stage 3: Extract `stripTag` and `shouldShowAnswerCount` helpers

**Why:** Domain logic buried in JSX. Tag stripping is an inline regex (line 113). Difficulty display rule is a 6-line nested ternary (lines 99-107).

**Changes:**
- Create `question-display.ts` with:
  - `stripTag(text: string): string`
  - `shouldShowAnswerCount(isMultipleChoice: boolean, quizDifficulty: Difficulty | undefined, isEasy: boolean): boolean`
- `question-form.tsx` — import and call both, removing inline logic

**E2E coverage:** `Question.Take.SeeTag.feature`, `Question.Take.Easy.feature`

---

### Stage 4: Consolidate submit-and-notify + fix parent notification effect

**Why:** Submit+notify duplicated at 3 call sites. The `onAnswerSelected` effect has `props` in deps, firing every render.

**Changes in `question-form.tsx`:**
1. Extract `submitAndNotify(overrideAnswers?: AnswerIdxs)` closure — calls `state.submit()` + `props.onSubmitted?.(overrideAnswers ?? state.selectedAnswerIdxs)`. Override needed for keyboard single-choice path where state is stale after `onSelectedAnswerChange`.
2. Replace all 3 call sites.
3. Fix `onAnswerSelected` effect deps: destructure callback, use `[state.selectedAnswerIdxs, onAnswerSelected]` instead of `[state.selectedAnswerIdxs, props]`.
4. Fix keyboard effect deps similarly — destructure `onSubmitted`.

**Gotcha:** The stale-state issue at line 59 is subtle. After `onSelectedAnswerChange(idx, true)`, `state.selectedAnswerIdxs` hasn't updated yet (React batching). The override parameter preserves this.

**E2E coverage:** `Question.Take.NumKey.feature`, `Question.Take.Feedback.feature`, `Quiz.AnswerState.feature`

---

### Stage 5: Extract `useQuestionKeyboardShortcuts` hook ✅

**Why:** 27 lines of imperative DOM event wiring in the middle of a React component.

**Changes:**
- Created `use-keyboard-shortcuts.ts` with simplified hook (3 params instead of 6):
  ```ts
  useQuestionKeyboardShortcuts(params: {
      enabled: boolean
      answersCount: number
      onDigitPressed: (idx: number) => void
      onEnterPressed: () => void
  }): void
  ```
  Hook only parses keyboard events (Numpad/Digit regex, bounds check) and calls semantic callbacks. The caller composes select+submit behavior.
- `question-form.tsx` — removed keyboard `useEffect`, replaced with hook call

**E2E coverage:** `Question.Take.NumKey.feature`

---

### Stage 6: Replace focus hack with callback ref ✅

**Why:** 20 lines of focus hacks (setTimeout + rAF + setInterval polling every 50ms for 10 seconds) — all unnecessary.

**Changes:**
- Replaced the entire focus `useEffect` + `useRef` with a callback ref:
  `React.useCallback((input) => input?.focus(), [])`
- No separate hook file needed.

**E2E coverage:** `Question.Take.Numerical.feature`

---

### Stage 7: Extract `ChoiceAnswerList` and `NumericalAnswerInput` components

**Why:** The `isNumerical ? ... : ...` branch renders two effectively different forms. Each should be its own component.

**Changes:**
- Create `components/choice-answer-list.tsx` — renders `<ul className="answers">` with `Answer` map
- Create `components/numerical-answer-input.tsx` — renders `<div className="answers"><input type="number">` with callback ref focus
- `question-form.tsx` — replace the branch with `{isNumerical ? <NumericalAnswerInput /> : <ChoiceAnswerList />}`
- Move `useQuestionKeyboardShortcuts` into `ChoiceAnswerList` — this eliminates the `enabled` parameter entirely (the hook simply won't exist for numerical questions)
- Drop `enabled` from `useQuestionKeyboardShortcuts` (2 params: `answersCount` + callbacks)

**E2E coverage:** All take question specs

---

### Stage 8: Final cleanup

**Why:** After all extractions, ensure the main component is clean orchestration-only logic.

**Changes:**
- `question-form.tsx` — remove unused imports, verify ~60-80 lines of clean code
- `index.ts` — add exports for new components/hooks, remove any compat aliases

**E2E coverage:** Full suite

---

## Verification

After each stage run:
1. `pnpm code` — TypeScript + Biome lint/format
2. `pnpm test:e2e` with relevant specs:
   - `Question.Take.NumKey.feature` — keyboard shortcuts
   - `Question.Take.Numerical.feature` — numerical input + focus
   - `Question.Take.Feedback.feature` — correctness, scoring
   - `Question.Take.Easy.feature` — answer count display
   - `Question.Take.SeeTag.feature` — tag stripping
   - `Question.Take.Explanation.feature` — explanations
   - `Quiz.AnswerState.feature` — quiz answer state preservation
   - `Quiz.Mode.feature` — exam/learn mode behavior
   - `Quiz.Score.feature` — quiz scoring
