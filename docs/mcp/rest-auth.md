# REST authentication and authorization — current state

The current backend exposes REST endpoints under `/api`. Management endpoints
are workspace-scoped by `workspaceGuid`, while public quiz-taking endpoints
use integer IDs for quizzes, questions, and attempts.

The current API has these important security gaps:

- No authentication layer is configured for the backend.
- Workspace create, read, update, and delete operations are available to anyone who knows or guesses the URL.
- Public quiz and question reads return full `QuestionResponse` objects, including correct answers and explanations.
- Attempt updates trust client-provided score counters and timestamps.
- The AI assistant endpoint can be called by any client and may trigger paid upstream requests.
- Swagger/OpenAPI metadata is available unless blocked at deployment.

The MCP server is wired to send `Authorization: Bearer ${QUIZMASTER_AUTH_TOKEN}`
when configured, but the backend has no filter to validate it.

Acceptance scenarios for the target auth model are tracked as `@skip`-ed
scenarios in `specs/features/mcpserver/RestApi.SecurityFoundation.feature`.
