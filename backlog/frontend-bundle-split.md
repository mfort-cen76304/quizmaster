# Frontend — separate quiz making and quiz taking, split the bundle

## Why

Today `frontend/` ships a single SPA that mixes:

- **Quiz making:** workspace, question/quiz CRUD, Robin AI helper (FAB + sheet + chat),
  AI assistant client, MCP-aware shapes, quiz-stats page.
- **Quiz taking:** quiz welcome / play / score, standalone question take, attempt API.

A learner who opens `/quiz/123` to take a quiz currently downloads the entire authoring
surface — Robin AI, the OpenRouter prompt-form, the quiz-edit forms,
`crazy-background.tsx` (1k lines of canvas), the make-side API clients. There is zero
runtime need for any of that.

This isn't only about bundle size: the two halves have *different security postures*.
The make surface needs a workspace key; the take surface should be reachable by anyone
with a quiz link and must never leak correct answers (see
`quiz-take-api-hardening.md`). Mixing them in one bundle obscures that boundary.

## Issues

### 1. Routes already cleanly split, code does not

`app.tsx` already separates `/quiz/:id*` and `/question/:id` (take) from
`/workspace/...` (make). The source tree splits along the same line —
`frontend/src/make/` and `frontend/src/take/` — and `frontend/src/shared/`
already exists as a third root. The remaining problem is module-graph
discipline: nothing prevents a take page from importing a make module, and
shared API helpers aren't split by side.

### 2. `crazy-background.tsx` is on the critical path

1061 lines of canvas animation. Loaded eagerly. Has nothing to do with either making or
taking — it's chrome.

### 3. Shared component library is fine; shared *pages* are not

`Form`, `TextArea`, `Button`, `QuestionTypeRadioSet` are reusable primitives — keep
shared. But `frontend/src/make/...` and `frontend/src/take/...` should be
separate import roots, with no `take/` file ever importing from `make/` (and vice-versa).

A spot check on the recent renames found that `take/quiz-take/quiz-play.tsx` does **not**
import `make/`, which is good. Need to verify there's no leak the other way.

## Approaches

The work splits into three stages. Stage 1 enforces the boundary in code; Stage 2 makes
it physical at the bundle level; Stage 3 is the optional separate-build escalation.

**Stage 1 — Enforce the boundary.**

- `frontend/src/shared/` already exists; audit it for content that really
  belongs to one side, and pull anything mistakenly cross-cutting back to
  the right side. Audit `#api/*` and `#shared/*` aliases for the same.
- Add an oxlint / TypeScript boundary rule: nothing under `src/take/**` may
  import from `src/make/**`, and vice-versa. Both can import from
  `src/shared/**`.
- Audit the take side specifically — confirm it doesn't pull authoring code.

**Stage 2 — Lazy-load and code-split.**

- Convert the make-side route subtree to `React.lazy` — `app.tsx` only loads
  `src/make/workspace/*` etc. when the user navigates to a `/workspace/...`
  route.
- Same for `crazy-background.tsx` — `React.lazy` + `<Suspense fallback={null}>`. It's
  decoration; latency is irrelevant.
- Vite chunking inherits naturally from the dynamic imports; verify with
  `pnpm build:fe:prod` and `vite-bundle-visualizer` that take routes ship a small chunk.

**Stage 3 (optional) — Two physical bundles.**

- `frontend-take/` (or `frontend/take-entry.tsx`) and `frontend-make/` as independent
  Vite entry points, served from two separate HTML files
  (`/take.html`, `/make.html` or similar), with the backend's `WebMvcConfig`
  dispatching `/quiz/...` and `/question/...` to the take HTML, everything else to
  make.
- Justified only if Stage 2's bundle savings aren't enough or if the ops team wants to
  cache the take bundle aggressively / behind a CDN.

Default plan: do Stage 1 + 2; revisit Stage 3 after measuring.

## Files in scope

- `frontend/src/app.tsx` — route declarations to lazy.
- `frontend/src/shared/**` — already exists; audit content for misplacement.
- `frontend/src/crazy-background.tsx` (or wherever it now lives) —
  lazy-loaded under a `shared/decoration/` or sidelined path.
- `.oxlintrc.json` (root) — boundary rule.
- `frontend/src/make/api/*.ts` and `frontend/src/take/api/*.ts` already
  split; verify nothing reaches across.

## Notes

- **Sequencing:** must follow `quiz-take-api-hardening.md`. The boundary should be drawn
  along a finalised API surface; doing the split before the take API is locked down means
  redoing the API client when it changes.
- **Independent of:** Robin UX, AI service refactor, MCP refinements, workspace routing,
  foreign-concept docs.
- If REST auth is ever introduced, the make bundle is the natural place for the auth
  code; the take bundle stays light.
