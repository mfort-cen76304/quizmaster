---
name: code-review
description: Review the codebase for quality issues, patterns, and improvements. Use when the user asks to "review the code", "code review", "check code quality", or "audit the codebase".
allowed-tools: Read, Glob, Grep, Bash(git diff:*), Bash(git log:*), Bash(git rev-parse:*), Bash(pnpm code:*), Bash(pnpm test:be:local:*), Bash(pnpm test:be:*), Bash(find:*)
argument-hint: [scope] — empty for full codebase, a path relative to project root (e.g. "backend/src/main/java/cz/scrumdojo/quizmaster/workspace/"), or "branch" for current branch changes
---

# Code Review

Perform a read-only code review of this project. Never modify any files.

Quizmaster is a training app for ScrumDojo workshops, not an MVP and not an enterprise system. `docs/conventions/controller-style.md` codifies the bar: **prefer simplicity over ceremony**. Hold the line on four things:

- **Clarity** — names that read true, control flow that shows intent.
- **Simplicity** — no duplication, no abstraction beyond what the convention requires.
- **Test coverage** — every behavior covered by a Gherkin scenario or a backend test.
- **Consistent use of domain language** — Workspace, Question, Quiz, Attempt. Names in code, DTOs, routes, and specs must match `docs/domain-language.md` and the backend vocabulary.

## Step 1: Determine Scope

Parse the invocation argument to decide what to review:

- **No argument** — review the entire codebase (all source and test files).
- **`branch`** — review only changes on the current branch vs `master`. Run `git diff master...HEAD` and `git log --oneline master..HEAD` to identify changed files. Only review those files. Also report which docs should be updated alongside the code changes (per CLAUDE.md: "When you change code, update related documentation in the same change").
- **Any other argument** — treat it as a path relative to the project root (e.g. `frontend/src/pages/`, `specs/src/steps/take/`, `mcp/src/`). Review files under that path.

## Step 2: Read Project Conventions

Read these as the baseline — flag deviations from the project's own standards, not generic best practices:

- `CLAUDE.md` — architecture index, REST surface, doc rules.
- `docs/conventions/controller-style.md` — DTO, validation, transaction, and error-handling rules for backend controllers.
- `docs/conventions/code-style.md` — Java/TS formatting, BDD spec organization.
- `docs/conventions/e2e-style-guide.md` — Page Objects → ops/expects → step glue layering.
- `docs/domain-language.md` — Workspace / Question / Quiz / Attempt vocabulary.

If the scope touches the AI assistant pipeline, also read `docs/ai-assistant.md`. If it touches the MCP server, also read `docs/mcp/`.

## Step 3: Gather Code

Quizmaster is a polyglot monorepo. Read source and test files in scope, prioritizing in this order:

1. **Domain entities and DTOs** in scope (Java records and `@Entity` classes).
2. **Backend layer**: controllers → services → repositories (`backend/src/main/java/.../<domain>/`).
3. **Frontend**: pages, hooks, shared types (`frontend/src/`, `shared/`).
4. **Specs**: page objects → ops/expects → step glue (`specs/src/`).
5. **MCP server** if in scope (`mcp/src/`).
6. **Tests** (`backend/src/test/...`, `specs/features/...`).
7. **Build/config** (`build.gradle.kts`, `package.json`, Flyway migrations under `backend/src/main/resources/db/migration/`).

Relevant extensions: `.java`, `.ts`, `.tsx`, `.scss`, `.feature`, `.kts`.

## Step 4: Run Tests

All commands run from the **project root**.

- `pnpm test:be:local` — fast backend tests, no API key required. Default for a review.
- `pnpm code` — TypeScript + oxlint + oxfmt across frontend, specs, mcp. The project's pre-commit gate.

Do **not** run `pnpm test:e2e` automatically: it builds the frontend, starts the backend on port 8080, and runs the full Cucumber suite. CLAUDE.md forbids auto-killing processes on ports 8080/5173 if they collide — ask the user if e2e coverage matters for the review.

Failures *outside* the scope: one-line note, don't block. Failures *inside* the scope: that's a finding.

## Step 5: Produce the Review

Output the review directly in the conversation using this structure:

```
## Code Review: <scope description>

### Good Patterns
Bullet list of things already done well — established patterns, good abstractions, clean code.

### Issues
Bullet list of problems found. For each issue:
- **What**: describe the problem concretely (reference files/lines)
- **Why it matters**: one sentence on the impact

Categories to check:
- Clarity — misleading names, control flow that hides intent, dead code
- Simplicity — duplication, premature abstraction, ceremony beyond what the convention requires
- Domain language drift — entity, DTO, route, or spec naming that doesn't match `docs/domain-language.md` or the backend vocabulary
- Convention deviations — anything that breaks the rules in `docs/conventions/*`
- Test coverage — missing happy path, missing 400/404/edge cases, untested branches; tests that hide the response contract behind ad-hoc assertions
- Documentation drift — `docs/` or `CLAUDE.md` claims that no longer match the code in scope; completed work still described as planned in `backlog/`

### Test Coverage
- What is tested and how well
- What is missing test coverage
- Quality observations about existing tests (e.g. `jsonPath` chains where `content().json()` text blocks would show the contract; Playwright API leaking into step files instead of staying in Page Objects)

### Suggestions
Numbered list of actionable improvements. Each suggestion:
1. **<Short title>** — <what to change>. <why it matters>. *Plan: <1-3 sentence implementation approach>.*
```

## Rules

1. **Never modify files.** This is a read-only review.
2. **Be proportionate.** Prefer simplicity over ceremony (per `docs/conventions/controller-style.md`). Flag real problems, not theoretical purity issues.
3. **Be specific.** Reference file paths and line numbers. No vague observations.
4. **Every suggestion must be independently actionable.** Each one tackleable as a standalone task.
5. **Keep it concise.** Findings and evidence, not essays.
