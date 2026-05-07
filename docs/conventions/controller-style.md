# Controller Style Guide

This is a training app, not an enterprise app. Prefer simplicity over ceremony. These rules exist to establish consistent, readable patterns across controllers — not to enforce architectural purity.

## DTOs

- **Request DTOs**: Java records. One per write endpoint. Include a `toEntity()` method.
- **Response DTOs**: Java records. Never return JPA entities from controllers.
- **Naming**: `XxxRequest`, `XxxResponse`, `XxxCreateResponse`. Place in the same package as the controller.

## Validation

- Use `@NotBlank`, `@NotNull` etc. from `jakarta.validation.constraints` on request record fields.
- Annotate controller parameters with `@Valid @RequestBody`.
- Spring Boot's default 400 response is sufficient — no custom `@ControllerAdvice` needed.

## Annotations

- No `@Autowired` on single-constructor classes (Spring auto-injects).
- No `@Transactional` on single-repository calls (`save`, `findById` — Spring Data wraps these already).
- Use `@Transactional(readOnly = true)` on endpoints that perform multiple queries.

## Error Handling

- Use `ResponseHelper.okOrNotFound()` for single-resource GETs.
- Sub-resource endpoints (`/{id}/children`) should return 404 if the parent doesn't exist, not an empty list.
- No custom exception classes — `ResponseEntity.notFound().build()` is enough.

## URL Conventions

- Plural nouns: `/api/workspaces`, `/api/questions`, `/api/quizzes`.

## Testing

- `@SpringBootTest` + `@AutoConfigureMockMvc` with `MockMvc` — test through HTTP, not direct controller method calls.
- Use `content().json()` with text blocks for response assertions — shows expected JSON as readable JSON, reports per-field diffs on failure.
- Use `jsonPath()` only for dynamic/generated values (e.g. extracting a created ID).
- Test method names in camelCase, no underscores.
- Test cases to include: happy path, 404 for missing resources, 400 for validation failures.

## Reference Implementation

`WorkspaceController` + `WorkspaceControllerTest` are the reference. Follow their patterns when refactoring other controllers.
