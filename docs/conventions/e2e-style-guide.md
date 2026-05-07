# E2E Test Style Guide

## Architecture

E2E tests are organized into four layers, each with a single responsibility:

```
Page Objects  →  Model what a user can see and do on a page
Ops           →  Compose multi-step workflows
Expects       →  Assert domain-level outcomes
Steps         →  Translate Gherkin to code (thin glue)
```

## Page Objects (`specs/src/pages/`)

Abstraction over the DOM. Each page class provides:

- **Queries** — read page state, return domain values (string, number, boolean)
- **Actions** — perform user interactions (click, fill, navigate)

Page objects know nothing about test assertions or business workflows. They answer "what's on screen?" and "do this thing."

Reference: `question-edit-page.ts`

## Ops (`specs/src/steps/<feature>/ops.ts`)

Reusable multi-step sequences that combine page object calls into higher-level workflows (e.g., "create a question with answers and save it"). Take `world` as parameter to access multiple page objects.

Reference: `steps/question/ops.ts`

## Expects (`specs/src/steps/<feature>/expects.ts`)

Domain-oriented assertion helpers. Verify business outcomes rather than DOM details. Take a **page object** as parameter (not world) — each expect function asserts against one page.

Reference: `steps/question/expects.ts`

## Steps (`specs/src/steps/<feature>/<name>.ts`)

Thin translation from Gherkin to code. Each step body should be short, delegating to:

- Page object queries/actions via `this.<pageName>.<method>()`
- Ops for multi-step flows
- Expects for non-trivial assertions

Simple value assertions (e.g., `expect(value).toBe('')`) can stay inline in steps.
