# Quizmaster REST Authentication and Authorization Specification

## Purpose

Define how Quizmaster should add authentication and authorization to the existing REST API, including the rules that the MCP server must follow when it calls protected endpoints.

The goal is to fortify the API without turning the MCP server into a privileged side channel. The Spring Boot backend remains the source of truth for identity, permissions, domain validation, scoring, and audit decisions.

## Background

The current backend exposes REST endpoints under `/api`. Management endpoints are workspace-scoped by `workspaceGuid`, while public quiz-taking endpoints use integer IDs for quizzes, questions, and attempts.

The current API has these important security gaps:

- No authentication layer is configured for the backend.
- Workspace create, read, update, and delete operations are available to anyone who knows or guesses the URL.
- Public quiz and question reads return full `QuestionResponse` objects, including correct answers and explanations.
- Attempt updates trust client-provided score counters and timestamps.
- The AI assistant endpoint can be called by any client and may trigger paid upstream requests.
- Swagger/OpenAPI metadata is available unless blocked at deployment.

This specification describes the target state and the minimum staged path to get there.

## Goals

- Require an authenticated principal for all authoring, workspace management, quiz management, stats, and AI assistant endpoints.
- Authorize every workspace-scoped request against workspace membership.
- Preserve public quiz-taking when explicitly enabled for a quiz, but expose only safe take DTOs before evaluation.
- Replace client-controlled attempt scoring with server-side scoring.
- Make MCP server calls use the same REST security model as the frontend and other API clients.
- Keep authorization checks readable in controllers and testable through MockMvc.
- Support local development and automated tests without external identity infrastructure.

## Non-Goals

- Do not implement a full enterprise identity provider in Quizmaster.
- Do not let the MCP server read PostgreSQL directly or bypass REST authorization.
- Do not expose correct answers to anonymous quiz takers before an attempt is submitted.
- Do not solve fine-grained classroom identity, grading rosters, or long-term learner profiles in the first iteration.
- Do not require OAuth/OIDC for local development.

## Recommended Authentication Model

Use Spring Security as the enforcement layer.

Quizmaster should support two credential types:

1. Browser session or bearer JWT for human users.
2. Personal access token or service token for MCP and automation clients.

Both credential types must resolve to the same backend principal model:

```text
AuthenticatedPrincipal
  subject: stable user or service identifier
  displayName: optional human-readable name
  kind: USER | SERVICE
  authorities: global authorities
```

MVP local development may issue signed local JWTs or opaque personal access tokens from a small built-in auth endpoint. Production can later replace token issuance with OIDC while keeping the same authorization checks.

## Authorization Model

Authorization is based on workspace membership plus narrowly scoped public quiz capabilities.

### Workspace Roles

| Role | Meaning |
| --- | --- |
| `OWNER` | Can manage workspace membership and all workspace content. |
| `EDITOR` | Can create, update, and delete questions and quizzes. Can use AI assistant. |
| `VIEWER` | Can read workspace content, answer keys, and stats, but cannot modify content. |

Role hierarchy:

```text
OWNER > EDITOR > VIEWER
```

### Global Authorities

| Authority | Meaning |
| --- | --- |
| `workspace:create` | Can create a workspace. Human users get this by default. |
| `mcp:use` | Can authenticate through the MCP server or automation token. |
| `admin:read` | Can inspect operational metadata such as OpenAPI in protected environments. |

Global authorities must not grant workspace access by themselves. Workspace data still requires membership.

### Public Quiz Capabilities

Public quiz taking uses an explicit capability rather than workspace membership.

Each published quiz may have a generated share token. A valid quiz share token grants only:

- read the safe take representation for that quiz,
- create an attempt for that quiz while it is available,
- submit answers for the created attempt.

It does not grant access to:

- workspace metadata,
- question management endpoints,
- answer keys before submission,
- quiz stats,
- other quizzes in the same workspace.

Share tokens must be high entropy, revocable, and stored hashed at rest.

## Data Model Additions

Add these tables or equivalent entities.

### `user_account`

```text
id UUID primary key
subject VARCHAR unique not null
display_name VARCHAR null
email VARCHAR null
created_at TIMESTAMP not null
disabled_at TIMESTAMP null
```

`subject` is the stable identifier from local auth, OIDC, or service-token issuance.

### `workspace_member`

```text
workspace_guid VARCHAR(36) not null references workspace(guid) on delete cascade
principal_subject VARCHAR not null
role VARCHAR not null check role in ('OWNER', 'EDITOR', 'VIEWER')
created_at TIMESTAMP not null
primary key (workspace_guid, principal_subject)
```

When a workspace is created, the authenticated creator becomes `OWNER`.

### `api_token`

```text
id UUID primary key
principal_subject VARCHAR not null
token_hash VARCHAR not null unique
display_name VARCHAR not null
created_at TIMESTAMP not null
last_used_at TIMESTAMP null
expires_at TIMESTAMP null
revoked_at TIMESTAMP null
```

Only token hashes are stored. Raw token values are returned once at creation time.

### `quiz_share_token`

```text
id UUID primary key
quiz_id INTEGER not null references quiz(id) on delete cascade
token_hash VARCHAR not null unique
created_at TIMESTAMP not null
expires_at TIMESTAMP null
revoked_at TIMESTAMP null
```

### `attempt_access_token`

```text
attempt_id INTEGER primary key references attempt(id) on delete cascade
token_hash VARCHAR not null unique
created_at TIMESTAMP not null
expires_at TIMESTAMP not null
revoked_at TIMESTAMP null
```

Attempt tokens bind public quiz takers to the attempt they created. Authenticated users may also own attempts through their principal subject later.

## Endpoint Authorization Matrix

Existing endpoints may be kept for compatibility, but their security behavior must follow this matrix.

| Endpoint | Required Authentication | Required Authorization | Notes |
| --- | --- | --- | --- |
| `GET /` and static assets | None | Public | Serves the SPA. |
| `GET /api/feature-flag` | None | Public | Keep public unless it reveals sensitive rollout state later. |
| `POST /api/workspaces` | User or service | `workspace:create` | Creator becomes `OWNER`. |
| `GET /api/workspaces/{guid}` | User or service | workspace `VIEWER+` | No access by GUID knowledge alone. |
| `GET /api/workspaces/{guid}/questions` | User or service | workspace `VIEWER+` | May include authoring metadata. |
| `GET /api/workspaces/{guid}/questions/{id}` | User or service | workspace `VIEWER+` | May include correct answers and explanations. |
| `POST /api/workspaces/{guid}/questions` | User or service | workspace `EDITOR+` | Validate body and workspace boundary. |
| `PATCH /api/workspaces/{guid}/questions/{id}` | User or service | workspace `EDITOR+` | Existing question must belong to workspace. |
| `DELETE /api/workspaces/{guid}/questions/{id}` | User or service | workspace `EDITOR+` | Existing question must belong to workspace. |
| `GET /api/workspaces/{guid}/quizzes` | User or service | workspace `VIEWER+` | Authoring list. |
| `GET /api/workspaces/{guid}/quizzes/{id}` | User or service | workspace `VIEWER+` | New recommended authoring read endpoint. |
| `POST /api/workspaces/{guid}/quizzes` | User or service | workspace `EDITOR+` | Ignore body `workspaceGuid`; use path `guid`. |
| `PUT /api/workspaces/{guid}/quizzes/{id}` | User or service | workspace `EDITOR+` | All question IDs must belong to the same workspace. |
| `DELETE /api/workspaces/{guid}/quizzes/{id}` | User or service | workspace `EDITOR+` | Deletes quiz and cascaded attempts. |
| `GET /api/workspaces/{guid}/quizzes/{id}/stats` | User or service | workspace `VIEWER+` | Consider `EDITOR+` if stats are sensitive. |
| `POST /api/ai-assistant` | User or service | workspace `EDITOR+` | Request should include `workspaceGuid` so authorization can be checked. |
| `GET /api/quiz/{id}` | None or authenticated | public share token or workspace `VIEWER+` | Must return safe take DTO for public access. |
| `GET /api/question/{id}` | Deprecated | Deprecated | Replace with safe take DTO or workspace-scoped authoring endpoint. |
| `POST /api/attempt` | None or authenticated | public share token or workspace `VIEWER+` | Returns attempt token for public takers. |
| `GET /api/attempt/{id}` | User, service, or attempt token | workspace `VIEWER+` or matching attempt token | Public taker can read only own attempt summary. |
| `PATCH /api/attempt/{id}` | Deprecated | Deprecated | Replace with submit/evaluate endpoint. |
| `POST /api/attempt/{id}/submit` | User, service, or attempt token | matching attempt token or authenticated owner | Server computes score. |
| Swagger/OpenAPI | User or service | `admin:read` or development profile | Disable or protect outside local dev. |

`VIEWER+` means `VIEWER`, `EDITOR`, or `OWNER`. `EDITOR+` means `EDITOR` or `OWNER`.

## Public Quiz-Taking API Contract

The public take path must not reuse the full authoring DTO.

### Safe Quiz DTO

Public quiz reads return:

```json
{
  "id": 7,
  "title": "Sprint Planning Basics",
  "description": "A short quiz.",
  "startAt": "2026-04-14T10:00:00",
  "endAt": "2026-04-14T23:00:00",
  "mode": "exam",
  "difficulty": "keep-question",
  "passScore": 80,
  "timeLimit": 600,
  "randomQuestionCount": 10,
  "questions": [
    {
      "id": 42,
      "question": "What is a good Definition of Done?",
      "answers": ["A", "B", "C"],
      "imageUrl": null,
      "questionType": "single",
      "tags": ["scrum"]
    }
  ]
}
```

It must not include:

- `correctAnswers`,
- answer explanations,
- `questionExplanation`,
- `workspaceGuid`,
- internal authoring metadata.

### Attempt Creation

Request:

```http
POST /api/attempt
Authorization: Bearer <user-token>
X-Quiz-Share-Token: <share-token>
```

For anonymous public takers, the share token is required. For authenticated workspace members, membership can authorize dry runs and previews.

Response:

```json
{
  "id": 123,
  "quizId": 7,
  "startedAt": "2026-05-05T10:00:00",
  "attemptToken": "raw-token-returned-once"
}
```

The raw attempt token is returned only once. Public clients must use it for later submit/read operations.

### Attempt Submission

Request:

```http
POST /api/attempt/123/submit
X-Attempt-Token: <attempt-token>
Content-Type: application/json
```

Body:

```json
{
  "answers": [
    {
      "questionId": 42,
      "type": "choice",
      "selectedIdxs": [0]
    }
  ],
  "finishedAt": "2026-05-05T10:08:00"
}
```

Backend behavior:

- Verify the attempt token matches the attempt.
- Verify the attempt belongs to the quiz.
- Verify the quiz is still valid for submission or the attempt started during the availability window.
- Compute correct, partially correct, incorrect, score, status, and duration on the server.
- Store immutable submitted answers or enough detail to support stats and result review.
- Return result DTO including explanations only after submission.

Client-provided score counters must be ignored or rejected.

## Backend Implementation Requirements

### Dependencies

Add:

```kotlin
implementation("org.springframework.boot:spring-boot-starter-security")
testImplementation("org.springframework.security:spring-security-test")
```

If JWT is used directly:

```kotlin
implementation("org.springframework.boot:spring-boot-starter-oauth2-resource-server")
```

### Security Configuration

Create a security configuration that:

- permits static frontend assets,
- permits public feature flag reads,
- permits public quiz-taking endpoints only when a valid share token or attempt token is supplied,
- requires authentication for all other `/api/**` endpoints,
- protects Swagger/OpenAPI outside local development,
- sets security headers through Spring Security,
- disables CSRF only for stateless bearer-token APIs, or keeps CSRF enabled for cookie-based browser sessions.

Recommended controller authorization style:

```java
@PreAuthorize("@workspaceAuthorization.canRead(authentication, #guid)")
```

and:

```java
@PreAuthorize("@workspaceAuthorization.canEdit(authentication, #guid)")
```

This keeps controllers readable and makes authorization behavior easy to test.

### Workspace Boundary Enforcement

All workspace-scoped writes must derive `workspaceGuid` from the path, not from the request body.

Quiz create and update must reject any `questionIds` that do not belong to the same workspace:

```text
POST /api/workspaces/{guid}/quizzes
PUT /api/workspaces/{guid}/quizzes/{id}
```

If any referenced question is missing or belongs to another workspace, return `400 Bad Request` with a generic validation message. Do not reveal which foreign question ID exists.

### AI Assistant Authorization

`POST /api/ai-assistant` must become workspace-scoped or include a `workspaceGuid`:

Preferred endpoint:

```text
POST /api/workspaces/{guid}/ai-assistant
```

Required role:

```text
EDITOR+
```

Add rate limiting by principal and workspace. The rate limit should fail with `429 Too Many Requests`.

### Error Semantics

Use consistent HTTP statuses:

| Status | Meaning |
| --- | --- |
| `400` | Invalid request shape or domain validation failure. |
| `401` | Missing, expired, malformed, or revoked credential. |
| `403` | Authenticated principal lacks permission, or public token is valid but not allowed for this action. |
| `404` | Resource is absent or hidden from unauthorized principals when hiding existence is desired. |
| `409` | State conflict, such as submitting an already finished attempt. |
| `429` | Rate limit exceeded. |

Do not include secrets, raw tokens, stack traces, or internal authorization details in error bodies.

### Audit Logging

Log security-relevant events with a principal identifier, but never raw credentials:

- workspace created,
- workspace membership changed,
- question or quiz changed,
- quiz published or share token rotated,
- attempt submitted,
- AI assistant called,
- denied access to protected endpoint,
- revoked token used.

Audit logs should include request path, method, principal subject, workspace GUID when known, and outcome.

## MCP Server Requirements

The MCP server must not have a special bypass credential. It calls the same REST endpoints as other clients.

### Configuration

Add:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `QUIZMASTER_AUTH_TOKEN` | Yes for protected calls | none | Bearer token used by the MCP server. |
| `QUIZMASTER_AUTH_MODE` | No | `bearer` | `bearer` for authenticated REST, `none` only for legacy local dev. |

The token must never be printed to stdout, stderr, tool results, resource contents, or error messages.

### REST Client Behavior

When `QUIZMASTER_AUTH_MODE=bearer`, every protected REST call includes:

```http
Authorization: Bearer ${QUIZMASTER_AUTH_TOKEN}
```

If no token is configured, tools that require authentication must fail before making a REST call.

MCP error mapping:

| REST Status | MCP Behavior |
| --- | --- |
| `401` | Tool/resource error: authentication required or token invalid. |
| `403` | Tool/resource error: insufficient Quizmaster permission. |
| `429` | Tool error: rate limit exceeded. |

### MCP Capability Restrictions

The MCP server must expose tools based on available credentials:

- If unauthenticated, expose only health and public-safe reads.
- If authenticated with workspace read permission, expose workspace read resources and tools.
- If authenticated with workspace edit permission, expose create/update/delete tools.
- If authenticated without AI permission, hide or fail `quizmaster_generate_question_draft`.

If the MCP SDK does not support dynamic tool visibility cleanly, tools may remain listed but must fail with a clear permission error before calling REST.

## Frontend Requirements

The frontend API helpers must support authenticated requests.

If bearer tokens are used:

- store tokens outside source code,
- prefer short-lived access tokens,
- refresh through a secure flow,
- send `Authorization` headers from the API helper layer.

If HttpOnly cookies are used:

- use `SameSite=Lax` or stricter,
- use `Secure` in non-local environments,
- keep CSRF protection enabled for unsafe methods.

The frontend must stop relying on correct answers from initial quiz/question reads. It should receive explanations only in submitted result responses or authenticated authoring views.

## Testing Strategy

### Backend Unit and Integration Tests

Use MockMvc and Spring Security test support.

Required tests:

- unauthenticated workspace read returns `401`,
- authenticated non-member workspace read returns `403` or hidden `404`,
- workspace `VIEWER` can read but cannot write,
- workspace `EDITOR` can create/update/delete questions and quizzes,
- workspace `OWNER` can perform all workspace actions,
- quiz creation rejects question IDs from another workspace,
- public quiz read with share token returns no correct answers,
- public quiz read without share token is denied when quiz is not public,
- attempt submit computes score server-side and ignores client score fields,
- public attempt update with wrong attempt token is denied,
- AI assistant requires `EDITOR+`,
- Swagger/OpenAPI is denied outside development profile,
- revoked API token returns `401`,
- expired share token returns `401` or `403`.

### MCP Tests

Required tests:

- protected tool fails locally when `QUIZMASTER_AUTH_TOKEN` is missing,
- REST client sends `Authorization: Bearer ...` for protected calls,
- token value is redacted from logs and errors,
- `401`, `403`, and `429` responses map to MCP tool errors,
- write tools are unavailable or fail when credentials only grant read permission.

### End-to-End Tests

Required user scenarios:

```gherkin
Scenario: Workspace member edits quiz content
  Given I am authenticated as an editor of workspace "Training"
  When I create a question in the workspace
  Then the question is saved in the workspace
```

```gherkin
Scenario: Non-member cannot read workspace
  Given I am authenticated as a user with no membership in workspace "Training"
  When I open the workspace URL
  Then access is denied
```

```gherkin
Scenario: Public quiz taker cannot see answer key before submission
  Given a published quiz with a share token
  When I open the quiz through the public take link
  Then I see the quiz questions
  And I do not receive correct answers from the API
```

```gherkin
Scenario: Attempt score is computed by backend
  Given a published quiz with a share token
  When I submit answers for the quiz
  Then the backend returns the computed score
  And client-provided score counters are ignored
```

## Migration Plan

### Phase 1 - Security Foundation

- Add Spring Security dependency and deny-by-default `/api/**`.
- Add local token authentication for development and tests.
- Add workspace membership model.
- Create workspace creator as `OWNER`.
- Protect workspace read/write endpoints.
- Protect AI assistant endpoint.

### Phase 2 - DTO Split and Attempt Hardening

- Add authoring DTOs and take DTOs.
- Stop returning answer keys from public take endpoints.
- Add quiz share tokens.
- Add attempt tokens.
- Add server-side attempt submission and scoring.
- Deprecate `PATCH /api/attempt/{id}` for public clients.

### Phase 3 - MCP Integration

- Add `QUIZMASTER_AUTH_TOKEN` support to MCP REST client.
- Update MCP resource and tool documentation with required permissions.
- Add MCP auth failure tests.

### Phase 4 - Production Hardening

- Protect or disable Swagger/OpenAPI.
- Add rate limiting for AI and public attempt creation.
- Add audit logging.
- Add token rotation and revocation UI or admin workflow.
- Optionally replace local auth issuance with OIDC.

## Definition of Done

- All `/api/**` endpoints are either explicitly public or protected by Spring Security.
- Workspace CRUD and quiz/question management require workspace membership.
- Public quiz-taking works only through explicit share capability.
- Public quiz DTOs never include correct answers before submission.
- Attempt scoring happens on the server.
- AI assistant calls require authenticated editor access and are rate limited.
- MCP server forwards configured credentials and never logs secrets.
- Tests cover `401`, `403`, workspace boundary checks, public take DTO safety, and server-side scoring.
- Documentation explains how to create and use local auth tokens for development and MCP.

## Open Questions

- Should first-version auth use only local tokens, or should OIDC be introduced immediately?
- Should `VIEWER` be allowed to read stats, or should stats require `EDITOR+`?
- Should public quiz share tokens live in URLs, headers, or both?
- Should anonymous workspace creation remain possible in local development only?
- Should existing `/api/quiz/{id}` and `/api/question/{id}` stay as compatibility aliases or be replaced by clearer `/api/quizzes/{id}/take` endpoints?
