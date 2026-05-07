# CLAUDE.md

This file provides guidance to AI coding assistants (Claude Code, GitHub Copilot) working with this repository.

## Project Overview

Quizmaster is a training application for Scrum workshops at ScrumDojo.cz. Core features:
- Create and manage questions, workspaces, and quizzes
- Take standalone questions or complete quizzes

Built incrementally using thin slices of functionality — a key learning objective of the training.

## Architecture

**Monorepo with frontend built into backend:**
- Frontend: React 19 SPA (Vite) → builds to `backend/src/main/resources/static/`
- Backend: Spring Boot 3 serves frontend at `/` and REST APIs at `/api/*`
- Database: PostgreSQL (JPA/Hibernate + Flyway migrations in `backend/src/main/resources/db/migration/`)
- Deployment: Single JAR containing both frontend and backend

**Key insight:** Frontend is built into backend — `pnpm test:e2e` handles this automatically.

**`/shared` is the FE↔specs contract zone.** Types, parsers, and defaults that both the React app and the E2E spec layer must agree on live in `/shared/{types,parsers,defaults}/`. Both projects import via the `#shared/*` alias. Everything in `/shared` must be pure TypeScript with no framework dependencies — if something needs React or Playwright, it doesn't belong there. Type names match the backend (`QuestionRequest`, `QuizRequest`, `IdResponse`, …) so FE, specs, and BE share vocabulary. Currently hand-written; migrating to OpenAPI codegen is a viable future step.

## Tech Stack

- **Backend:** Java 21, Spring Boot 3, Gradle (Kotlin DSL), Lombok
- **Frontend:** TypeScript, React 19, Vite, Biome (linting)
- **E2E Testing:** Cucumber + Playwright (separate `specs/` package)
- **Database:** PostgreSQL
- **MCP Server:** TypeScript package at `mcp/` exposing Quizmaster as Model Context Protocol tools/resources/prompts. See `specs/features/mcpserver/mcp-spec.md` and `mcp/README.md`.

## Development Commands

All commands run from the **project root**.

```bash
# First-time setup
pnpm install:all                   # All dependencies + Playwright browsers

# Code quality (run before committing)
pnpm code                          # TypeScript + Biome lint/format (frontend + specs)

# Backend tests
pnpm test:be                       # All backend tests
pnpm test:be:local                 # Local tests only (no API key needed)

# E2E tests — builds frontend, starts backend, runs all specs, then stops backend
pnpm test:e2e
```

**If `pnpm test:e2e` fails with "Ports 8080 and/or 5173 are in use"**, stop the running backend/frontend first. Do NOT attempt to kill the processes automatically — ask the user to stop them.

## Domain Model

**Three entities:**
1. **Question** — `id`, `question`, `answers[]`, `correctAnswers[]`, `explanations[]`, `questionExplanation`, `isEasy`, `imageUrl`, `tolerance`, `workspaceGuid`
   - Questions are edited by numeric `id`, scoped to a workspace
2. **Workspace** — `guid` (UUID), `title`
3. **Quiz** — `id`, `title`, `description`, `questionIds[]` (int array), `passScore`, `timeLimit`, `mode` (EXAM/LEARN), `difficulty` (EASY/HARD/KEEP_QUESTION), `randomQuestionCount`, `workspaceGuid`

**Key concepts:**
- `EXAM` mode = feedback at end; `LEARN` mode = feedback after each question
- `randomQuestionCount` limits quiz to N random questions from the pool

## Backend Structure

Each domain has its own package under `cz.scrumdojo.quizmaster`:
- `question/` — `QuestionMakeController`, `QuestionTakeController`, `QuestionRepository`, `Question`, `QuestionRequest`, `QuestionResponse`
- `quiz/` — `QuizMakeController`, `QuizTakeController`, `QuizService`, `QuizRepository`, `Quiz`, `QuizMode`, `Difficulty`, `QuizRequest`, `QuizResponse`
- `workspace/` — `WorkspaceController`, `WorkspaceRepository`, `Workspace`, `WorkspaceRequest`, `WorkspaceResponse`, `WorkspaceCreateResponse`, `QuestionListItem`, `QuizListItem`
- `attempt/` — `AttemptController`, `AttemptRepository`, `Attempt`, `AttemptStatus`, `AttemptRequest`, `AttemptResponse`
- `common/` — `IdResponse` (shared record for POST/PUT responses), `ResponseHelper`
- `config/` — `FeatureFlag`, `OpenApiConfig`, `WebMvcConfig`, `ResourceResolver`
- `aiassistant/` — `AiAssistantController`, `AiAssistantService`, `AiAssistantRequest`, plus the embedding stack: `OpenRouterEmbeddingClient`, `QuestionEmbeddingService`, `QuestionEmbeddingText`, `EmbeddingSimilarity`

**Style guides:** See `docs/controller-style.md` and `docs/code-style.md`.

## API Endpoints

**Workspaces** (`WorkspaceController`):
- `GET /api/workspaces/{guid}` — get workspace
- `POST /api/workspaces` — create workspace
- `GET /api/workspaces/{guid}/questions` — list questions in workspace
- `GET /api/workspaces/{guid}/quizzes` — list quizzes in workspace

**Questions — editing** (`QuestionMakeController`):
- `GET /api/workspaces/{guid}/questions/{id}` — get question for editing
- `POST /api/workspaces/{guid}/questions` — create question (returns `IdResponse`)
- `PATCH /api/workspaces/{guid}/questions/{id}` — update question
- `DELETE /api/workspaces/{guid}/questions/{id}` — delete question

**Questions — taking** (`QuestionTakeController`):
- `GET /api/question/{id}` — get question for taking

**Quizzes — editing** (`QuizMakeController`):
- `POST /api/workspaces/{guid}/quizzes` — create quiz (returns `IdResponse`)
- `PUT /api/workspaces/{guid}/quizzes/{id}` — update quiz

**Quizzes — taking** (`QuizTakeController`):
- `GET /api/quiz/{id}` — get quiz with questions

**Attempts** (`AttemptController`):
- `GET /api/attempt/quiz/{quizId}` — get attempts for a quiz
- `GET /api/attempt/{id}` — get attempt
- `POST /api/attempt` — create attempt
- `PUT /api/attempt/{id}` — update attempt
- `DELETE /api/attempt/{id}` — delete attempt

**Other:**
- `POST /api/ai-assistant` — AI question generation
- `GET /api/feature-flag` — feature flag status

## Frontend Routes

```
/                                          Home
/question/:id                              Take standalone question
/workspace/new                             Create workspace
/workspace/:workspaceId                    View workspace
/workspace/:workspaceId/question/new       Create question
/workspace/:workspaceId/question/:id/edit  Edit question
/workspace/:workspaceId/quiz/new           Create quiz
/workspace/:workspaceId/quiz/:id/edit      Edit quiz
/workspace/:workspaceId/quiz/:id/stats     Quiz statistics
/quiz/:id                                  Quiz welcome page
/quiz/:id/questions/:questionId?           Take quiz
```

## E2E Testing

BDD specs in `specs/features/`, organized into `make/` (creating) and `take/` (answering).

**Style guide:** See `docs/e2e-style-guide.md` and `docs/code-style.md`.

**Test layers:**
- **Page Objects** (`specs/src/pages/`) — DOM abstraction, queries and actions
- **Ops** (`specs/src/steps/<feature>/ops.ts`) — multi-step workflows
- **Expects** (`specs/src/steps/<feature>/expects.ts`) — domain assertions
- **Steps** (`specs/src/steps/<feature>/*.ts`) — thin Gherkin-to-code glue

## Development Practices

- **Trunk-Based Development** — all work on `master`, frequent pull/rebase/push
- **Test-First** — write Gherkin spec before code
- **Thin Slices** — one scenario at a time, code only what's needed to pass it
- **Mob/Pair Programming** — shared ownership

## AI Assistant

Question generation uses OpenRouter via two endpoints sharing one `ai.token`:

- **Chat completions** (`AiAssistantService`) — generates question drafts from a per-type prompt (`prompts/{single,multiple,numerical}-choice{,-batch}.md`). Single + batch flavors.
- **Embeddings** (`OpenRouterEmbeddingClient`) — used for **duplicate avoidance**: each saved question is embedded (`embedForSave`); on generation, the candidate is embedded and compared against workspace embeddings via cosine similarity (`EmbeddingSimilarity`). On a match above `ai.embedding.similarity-threshold`, the assistant retries once with feedback; second match → 502. Embedding columns: `embedding`, `embedding_model`, `embedding_text_hash` (migration `V00049`); a `model+hash` mismatch invalidates the cached embedding.

Configuration: `application.properties` (`ai.token`, `ai.model`, `ai.embedding.model`, `ai.embedding.similarity-threshold`). See `docs/dev-environment/how-to-develop.md`.

## Robin AI (frontend)

Robin AI is the FAB + sheet UI on top of `/api/.../ai-assistant`. Lives at `frontend/src/pages/make/create-question/robin-ai/`:

- `RobinFab` — floating button (portal).
- `RobinSheet` — drawer with two modes: `'classic'` (single-shot, used by question form) and `'chat'` (used by workspace).
- `useRobinPromptForm` — submit/loading/error/drafts/messages state.
- `useRobinUndoBuffer` — captures the form state before applying a draft so "Previous version" works.
- **`RobinFormBinding { snapshot, applyPatch }`** is the contract between Robin and the form. Robin never imports form internals — it reads via `snapshot()` and writes via `applyPatch(patch)`.

The workspace flavor (`pages/make/workspace/workspace-robin-ai-helper.tsx`) reuses `RobinSheet` in `'chat'` mode with a different `generateRequest`.

## MCP Server

The `mcp/` package exposes Quizmaster as a Model Context Protocol server (stdio transport) so AI clients can read and manage workspaces, questions, quizzes, stats, and AI drafts through the existing REST API.

- **Boundary:** the MCP server is a thin REST shim. It never reads the database directly, never duplicates backend validation, and uses the same authorization model as other clients (see `specs/features/mcpserver/rest-auth-spec.md`).
- **Specs and configuration:** `specs/features/mcpserver/mcp-spec.md`, `mcp-server-configuration.md`, `rest-auth-spec.md`. Local entry point: `mcp/README.md`.
- **Workspace-scoped REST routes** (`/api/workspaces/{guid}/...`) exist alongside legacy `/api/workspace/...` (with `X-Workspace-Key` header) precisely so MCP and the FE can share controllers. Do not drop either family without coordinating with both clients.
