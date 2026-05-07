# Workspace routing — consolidate helper and document the dual scheme

## Issues

### 1. Helper duplicated across four controllers

After the dual-route work, every "make" controller carries this method verbatim:

```java
private String workspaceGuid(String pathWorkspaceGuid, String workspaceKey) {
    return pathWorkspaceGuid == null
        ? WorkspaceKey.require(workspaceKey)
        : WorkspaceKey.require(pathWorkspaceGuid);
}
```

Found in `QuestionMakeController`, `QuizMakeController`, `WorkspaceHeaderController`, and
`AiAssistantController` (under a different name). `WorkspaceKey.require` is centralised but
the path-or-header fallback is not.

### 2. Dual route scheme is undocumented

Most controllers map two paths:

```java
@RequestMapping({"/api/workspace/...", "/api/workspaces/{workspaceGuid}/..."})
```

`/api/workspace` (singular, header-driven via `X-Workspace-Key`) is the legacy frontend
path. `/api/workspaces/{guid}` (plural, path-driven) is the MCP / RESTful path. Drop the
wrong one and either the FE or MCP breaks. Neither `CLAUDE.md` nor `WorkspaceKey.java`
explains this — a contributor reading either route alone will not see the constraint.

### 3. Ambiguous 404 from `AiAssistantController`

`requireCanUseAiAssistant` returns plain `404` for missing header, blank header, AND
unknown workspace. The REST auth spec already calls for distinguishing 401/403/404; this
is also annoying during day-to-day debugging.

## Approaches

**Consolidate the helper.** Add to `WorkspaceKey`:

```java
public static String from(String pathGuid, String headerGuid) {
    return require(pathGuid != null ? pathGuid : headerGuid);
}
```

Replace the four duplicates. Each controller drops ~5 lines.

**Document the dual scheme.**

- Add a Javadoc block to `WorkspaceKey` explaining: `/api/workspace` (header) is the FE
  contract, `/api/workspaces/{guid}` (path) is the MCP / external contract, both must work,
  neither is removable without coordinated changes on the corresponding client.
- Add a one-paragraph note under `CLAUDE.md` → "API Endpoints" to the same effect.

**Distinguish 404 vs 400 in AI assistant.**

- Missing/blank header *and* missing path = `400 Bad Request` ("workspace identifier
  required").
- Unknown workspace = `404`.
- Anything that should later be `401/403` per `rest-auth-spec.md` is annotated with a
  `// TODO(rest-auth)` so the security pass can find it.

**Regression test for the dual route.** Pick `WorkspaceHeaderController` and parameterise
one passing test over `(/api/workspace, header)` and `(/api/workspaces/{guid}, no header)`.
Ensures a future "drop the legacy form" PR breaks visibly.

## Files in scope

- `backend/src/main/java/cz/scrumdojo/quizmaster/workspace/WorkspaceKey.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/question/QuestionMakeController.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/quiz/QuizMakeController.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/workspace/WorkspaceHeaderController.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/aiassistant/AiAssistantController.java`
- `CLAUDE.md` (one paragraph)
- `backend/src/test/.../workspace/WorkspaceControllerTest.java` (parameterised case)

## Notes

- Independent of other concerns. Pairs naturally with `quiz-take-api-hardening.md`
  (both touch controller-layer surface) but does not block it.
- Do **not** drop either route family in this concern — that's a separate, larger
  decision tied to the auth foundation in `rest-auth-spec.md`.
