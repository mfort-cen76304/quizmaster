# Quizmaster MCP Server

A Model Context Protocol server that exposes Quizmaster (workspaces, questions,
quizzes, stats, AI drafts) to AI clients over stdio.

## Where to look

| Topic | Document |
| --- | --- |
| What it is, boundary rule, what's exposed | `../docs/mcp/overview.md` |
| How to configure it (env vars, MCP host JSON, troubleshooting) | `../docs/mcp/configuration.md` |
| Current REST auth state (none — see also workspace-key obscurity) | `../docs/mcp/rest-auth.md` |
| Original specification (goals, full tool/prompt schemas, design history) | `../backlog/mcp-spec.md` |
| Target authentication / authorization design | `../backlog/rest-auth.md` |
| Security gaps still open | `../specs/features/mcpserver/RestApi.SecurityFoundation.feature` (skipped scenarios) |
| Architectural fit (where MCP sits relative to FE / BE / DB) | `../docs/architecture.md` |

## Source layout

```
mcp/
  src/
    index.ts             — server bootstrap, capability registration
    config.ts            — env-driven config + stderr logger
    quizmaster-client.ts — REST client, auth, secret redaction, error mapping
    tools.ts             — tool registrations (one per REST operation)
    resources.ts         — quizmaster:// URI scheme
    prompts.ts           — guided MCP prompts (create question, review workspace, ...)
    schemas.ts           — Zod input schemas + DTO mappers
  test/                  — vitest specs (config, schemas, client, in-process protocol)
```

## Common commands

Run from the repo root:

```bash
pnpm install:mcp     # install dependencies
pnpm code:mcp        # tsc + lint + format
pnpm test:mcp        # vitest
pnpm mcp             # start the server (waits for an MCP host on stdin/stdout)
```

## Boundary rule

The MCP server is a **thin REST shim**. It never reads PostgreSQL directly,
never duplicates backend validation, and uses the same authorization model as
every other REST client. New tools must call existing REST endpoints; if a tool
needs new behavior, that behavior belongs in the Spring Boot backend first.
