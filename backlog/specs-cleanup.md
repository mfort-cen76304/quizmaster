## Code Review: `specs/` — BDD Spec Quality

### Good Patterns

- **Clear 4-layer architecture** (pages → ops → expects → steps) is consistently followed
- **Declarative data setup** via `Given workspace ... with questions` tables is well done — scenarios read cleanly
- **Bookmark system** for referencing questions across steps is a smart abstraction
- **Background sections** used effectively in `Quiz.Delete`, `Quiz.Navigation`, `Quiz.Mode`, `Quiz.SkippedQuestions`
- **Scenario Outlines** used well for parameterized testing in `Quiz.Score`, `Quiz.Welcome`, `Question.Take.Feedback`

---

### Issues

#### 1. Exact duplicate feature file
- **What**: `Quiz.Statistics.feature` is a **byte-for-byte copy** of `Quiz.MarkQuestions.feature` — same Feature title, same scenarios, same examples. The file name says "Statistics" but the content is about marking questions.
- **Why it matters**: Runs the same test twice, wastes CI time, and the statistics scenarios presumably never got written.

#### 2. UI language leaking into Gherkin steps
- **What**: Several steps use UI/browser language instead of domain language:
  - `I click the start button` — UI action (`quiz.ts:39`, unused but exists alongside domain `I start quiz`)
  - `I should see answer {string} is checked` / `is unchecked` — DOM state (`quiz.ts:70-75`, unused)
  - `I should not see the answer` / `I should see the answer` — vague, UI-level (`quiz.ts:78-83`, unused)
  - `I see the submit button as active/inactive` — UI state instead of domain concept
  - `I check answer` / `I uncheck answer` — UI mechanics (toggling a checkbox) rather than domain intent
  - `I should see the countdown timer after delay is less then {string}` — implementation detail (`quiz.ts:98`, unused)
  - `I should see the text "Game over time"` — raw UI text assertion
  - `I should see the results table` — UI structure, not domain outcome
  - `I see the "Game over" dialog` / `I confirm the "Game over" dialog` — UI chrome
  - `I use the browser back button` / `I use the browser forward button` — browser mechanics
- **Why it matters**: BDD specs should express domain behavior. UI language makes scenarios fragile and harder for non-developers to read.

#### 3. 30 unused step definitions
- **What**: `bddgen export --unused-steps` reports 30 unused steps. Key groups:
  - **quiz.ts**: 8 unused steps (`I click the start button`, `I should see answer ... is checked/unchecked`, `I should not/see the answer`, `I should see the countdown timer after delay...`) — these are leftover from older scenario phrasing
  - **quiz-score.ts**: 6 unused steps (`I finish the quiz`, `I see the correct number of questions`, `I see the original result`, `I don't see the original results`, `I see explanation for question`, `I see corresponding response for answer for question`)
  - **quiz-create-new.ts**: 4 unused (`I start editing a quiz`, `I select difficulty`, `I see workspace with N available questions`, `I clear time limit`)
  - **workspace**: 2 unused (`I saved the workspace`, `I see workspace title`)
  - **question**: 5 unused (`I do not see numerical answer field`, `I see AI section`, `I see answer N text...with explanation`, `request to AI assistant contains question`, `I see N delete buttons disabled`)
  - **question-take.ts**: 3 unused (`I submit question`, `I see the {string} question for the quiz`, `I see that question has number of correct answers displayed`)
  - **question-feedback-numerical.ts**: 1 unused (`number input is focused`)
  - **quiz-stats.ts**: 2 unused (`I take quiz which I do not complete in time limit`, `I see stats table`)
- **Why it matters**: Dead code creates confusion about what's supported and adds maintenance burden.

#### 4. Duplicate step patterns expressing the same intent
- **What**:
  - `I start the quiz` (`quiz.ts:17`) vs `I start quiz {string}` (`quiz.ts:13`) vs `I click the start button` (`quiz.ts:39`) — three ways to start a quiz
  - `I see the workspace {string}` (`question-edit-gui.ts:73`) vs `I see the {string} workspace page` (`workspace.ts:14`) vs `I see workspace title {string}` (`workspace.ts:38`) — three ways to assert workspace is visible
  - `I submit question` (`question-take.ts:64`, unused) vs `I press enter to submit` (`question-take.ts:45`) — two ways to submit
  - `I proceed to the score page` (`quiz.ts:51`) vs `I evaluate the quiz` (`quiz.ts:47`) — both call `this.questionPage.evaluate()`, identical implementation
  - `I answer the question` (`quiz-take.ts:7`) vs `I answer correctly` (`quiz-take.ts:11`) — identical: both call `answerCorrectly(this)`
  - `I proceed to the next question` (`quiz.ts:31`) vs `I skip the question` (`quiz.ts:35`) — both call `this.questionPage.next()`
- **Why it matters**: Multiple phrasings for the same operation make the step catalog ambiguous. Writers don't know which to use, readers can't tell if different phrasing implies different behavior.

#### 5. Quiz.Stats.feature — massive repetition
- **What**: `Quiz.Stats.feature` has **18 scenarios** (plus 2 skipped) that all follow the same pattern: create workspace, create quiz, take quiz with specific answers, open stats, assert one cell in the stats table. Each scenario tests exactly one column of the stats table (Duration, Points, Correct Answers, Incorrect Answers, Score, Status) at one data point (full, half, zero).
- **Why it matters**: These 18 scenarios could be consolidated. The pattern is identical — only the answers and the asserted column differ. A single Scenario Outline with `<answers>` and `<expected_column>` parameters would cover this, or the scenarios could be grouped (e.g., one scenario testing all columns for "full correct" in one go).

#### 6. Quiz.ScorePage.feature — near-duplicate setup across scenarios
- **What**: All 4 scenarios in `Quiz.ScorePage.feature` (lines 1-61) share identical setup: create workspace with Sky/France questions, create quiz, start quiz, answer Blue + Marseille, evaluate. Each scenario then asserts one small thing (question visible, options visible, explanation visible, user selection visible).
- **Why it matters**: These could be a single scenario with multiple Then assertions, or use a Background. The repeated setup is boilerplate that obscures the tested behavior.

#### 7. Convoluted scenarios

- **What — Quiz.AnswerState.feature `After page refresh no answer is selected`** (line 20): The scenario answers "Green" then refreshes, but the prior scenario `After next page is displayed, no answer and explanation is displayed` (line 32) also answers "Green" with no refresh and asserts the same thing (`no answer is selected`). The second scenario's name says "after next page is displayed" but there's no navigation to a next page — it just answers and asserts, making it confusing.

- **What — Question.Create.Validations `Create multiple choice question with all correct answers`** (line ~118): Marks answers 2, 3, 4, and then 1 as correct (all four), but the scenario title says "all correct answers" which is misleading since it's really testing "submit succeeds when enough answers are correct." The ordering 2→3→4→1 seems deliberate but unexplained.

- **What — Timer scenarios** (`Quiz.Timer.feature`): The `Display result table after 1 minute` and `Display score 0 when no answers were given` scenarios are nearly identical (wait for timeout, confirm dialog, see results table) — the second just adds a score assertion. Similarly `Display score 1/2 when answered one correctly and timed out` largely repeats the same flow.

#### 8. Scenario naming uses UI language instead of domain language
- **What**: Several scenario names reference UI elements:
  - "Test backButton" (appears 3 times across `Question.Create.Form`, `Workspace.Create`, `Quiz.Create`)
  - "Submit button is visible as active when answer is checked" / "Submit button is visible as inactive when no answer is checked" (`Quiz.Navigation`)
  - "Validate home page has correct navigation links" (`Home.feature`)
- **Why it matters**: Scenario names should describe the domain behavior being tested, not the UI widget being verified.

#### 9. `Question.Create.Image.feature` is fully duplicated by `Question.Create.Image.Validation.feature`
- **What**: `Question.Create.Image.feature` has two scenarios: "Enter image URL with preview" and "Image URL is optional." Both of these are also covered as scenarios in `Question.Create.Image.Validation.feature` ("Valid image URL is accepted" example with same URL, and "Empty image URL is optional").
- **Why it matters**: Duplicate coverage.

#### 10. `Question.Take.SeeTag.feature` overlaps with `Question.Create.Tag.feature`
- **What**: `Question.Take.SeeTag.feature` has exactly two scenarios that are also present (with slightly different setup) in `Question.Create.Tag.feature`:
  - "Taker does not see tag entered via tag field" (Tag.feature line ~38) vs "Taker does not see the tag in the question title" (SeeTag.feature line 6) — same assertion, different setup
  - "Brackets not at the start are not treated as a tag" — exists in both files
- **Why it matters**: Same behavior specified in two places, with slightly different wording.

#### 11. `Question.Take.Numerical.feature` has a skipped scenario duplicating an active one
- **What**: The `@skip` scenario "Quizmaker-created numerical question uses number input for quiz taker" (line 20) tests the exact same thing as the first scenario "Numerical question with decimal answer sdss" — both create a numerical question, take it, enter values, check feedback. Also note the scenario name has "sdss" — leftover debugging text.
- **Why it matters**: Dead scenario with typo in name.

---

### Suggestions

#### Done

1. **~~Delete `Quiz.Statistics.feature`~~** — Deleted the byte-for-byte copy of `Quiz.MarkQuestions.feature`. *(commit 6aa0990)*

2. **~~Remove 30 unused step definitions~~** — Deleted all 30 unused steps across 9 files. *(commit f1164e2)*

3. **~~Consolidate duplicate step patterns~~** — Unified to canonical phrasings: `I answer correctly`, `I evaluate the quiz`, `I see the workspace {string}`. Kept `I skip the question` / `I proceed to the next question` as distinct domain intents. *(commit 41f1f41)*

4. **~~Collapse Quiz.Stats.feature into Scenario Outlines~~** — Replaced 18 scenarios with 3 focused ones: empty stats, attempt stats (3 attempts asserting full row), and summary stats. Added `a quiz with N questions` step, combined navigation+heading, removed caption row boilerplate, and consolidated 3 identical duration scenarios into 1 with a timing step. *(commits ff2eaa0..e54e9e0, 6 commits)*

#### Remaining

5. **Delete `Question.Create.Image.feature`** — Its two scenarios are already covered by `Question.Create.Image.Validation.feature`. *Plan: Delete the file, verify scenarios still pass.*

6. **Clean up the `@skip`'d scenario in `Question.Take.Numerical.feature`** — `Question.Take.Numerical.feature:34` carries `@skip` on *Note with number of decimal digits* (`I retake with submit button states`). Either implement the missing step and unskip, or delete the scenario as out of scope. The earlier "sdss" typo has already been fixed.

7. **Rename UI-language scenario names** — Replace "Submit button is visible as active when answer is checked" / "Submit button is visible as inactive when no answer is checked" (`Quiz.Navigation.feature:54,61`) with domain-oriented names like "Answer can be submitted only when selection is made". The "Test backButton" scenarios are already gone.

#### Done since the original review

- `Quiz.ScorePage.feature` no longer exists.
- `Question.Take.SeeTag.feature` and `Question.Create.Tag.feature` were reviewed and confirmed complementary, not duplicative.
- Timer scenarios consolidated into a Scenario Outline parameterised by time limit.
- Time-limit specs use clock manipulation (`I finish the quiz in N seconds`, `N seconds pass`); no `@skip` scenarios remain in `Quiz.Stats.feature`.
