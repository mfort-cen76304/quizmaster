# AI Assistant — Service refactor and failure visibility

## Issues

### 1. Overload sprawl in `AiAssistantService`

Currently:

```java
generateQuestion(prompt, type)
generateQuestion(prompt, type, workspaceGuid)
generateQuestion(prompt, type, workspaceGuid, excludedQuestionId)
generateQuestions(prompt, type)
generateQuestions(prompt, type, workspaceGuid)
```

A caller that misses an overload silently turns dedup off. The first two-arg variants
exist only to keep older tests compiling — production now always passes all four.

The same applies to `AiAssistantRequest`'s convenience constructors
(`backend/.../AiAssistantRequest.java:4-10`).

### 2. Service file size / inline prompt assembly

`AiAssistantService.java` is ~490 lines. A meaningful chunk of that is
`embeddingUniquenessRule` (text-block prompt augmentation) and dual single/batch paths
that share most of their logic but live as separate methods.

### 3. Embedding failures are invisible

`QuestionMakeController.embedBestEffort` catches every `RuntimeException`, clears the
embedding columns, and continues. Operationally this means a misconfigured token,
a 5xx from OpenRouter, or a JSON shape change all degrade dedup to "no comparison" with
no log line and no signal to the user. The same pattern is repeated in
`AiAssistantService.findDuplicate` / `findBatchDuplicate` (catching `RuntimeException` to
`return null`).

## Approaches

**Collapse overloads.** One `generateQuestion(AiAssistantRequest req)` /
`generateQuestions(AiAssistantRequest req)`. Inline the existing convenience constructors at
the test call sites (or replace them with a tiny test builder in `TestFixtures`). Drop the
no-arg / three-arg variants.

**Extract a `UniquenessPrompt` helper.** Move `embeddingUniquenessRule` and
`appendQuestionList` into a dedicated `UniquenessPrompt` class (or static helper). The
service becomes shorter and the prompt-engineering text gets a stable home for future
tweaks.

**Surface embedding failures.**

- `embedBestEffort` should `WARN` log with workspace + question id and the embedding model.
- Promote the result to a structured signal: `IdResponse` becomes
  `IdResponse(id, embeddingStatus)` (or wrap it). FE can then show "AI dedup unavailable"
  the next time Robin opens for that workspace.
- `findDuplicate` / `findBatchDuplicate` catching `RuntimeException` is acceptable
  (we'd rather not block generation), but it should also `WARN` so silent degradation is
  observable in logs.

## Files in scope

- `backend/src/main/java/cz/scrumdojo/quizmaster/aiassistant/AiAssistantService.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/aiassistant/AiAssistantRequest.java`
- `backend/src/main/java/cz/scrumdojo/quizmaster/question/QuestionMakeController.java`
  (`embedBestEffort`)
- `backend/src/main/java/cz/scrumdojo/quizmaster/common/IdResponse.java` (if extending)
- `backend/src/test/.../AiAssistantServiceTest.java` and the dedup tests — call sites for
  the collapsed signature.

## Notes

- Independent of every other concern; can land alone.
- The collapse and the failure-surface changes can be split into two PRs (refactor first,
  then observability) but they share the file, so one commit per change is fine.
- The fix is also a prerequisite for the MCP `excludedQuestionId` plumbing (see
  `mcp-refinements.md`) — once the service has one canonical entry point, threading that
  field through is trivial.
