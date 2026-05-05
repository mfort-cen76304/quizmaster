# Quizmaster MCP Server Configuration

This document explains how to configure the Quizmaster MCP server for a local Quizmaster development environment and for MCP hosts that connect over stdio.

## Prerequisites

- Install repository dependencies:

```bash
pnpm install:all
```

- Start the Quizmaster backend. The default MCP configuration expects the REST API at `http://localhost:8080`.

```bash
pnpm start
```

For backend-only work, `pnpm start:be` is enough because the MCP server calls the Spring Boot REST API directly.

## Runtime Configuration

The MCP server reads its configuration from environment variables.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `QUIZMASTER_BASE_URL` | No | `http://localhost:8080` | Base URL of the running Quizmaster Spring Boot REST API. A trailing slash is accepted and normalized away. |
| `QUIZMASTER_MCP_TRANSPORT` | No | `stdio` | MCP transport. The current implementation supports only `stdio`. |
| `QUIZMASTER_MCP_LOG_LEVEL` | No | `info` | Log level. Allowed values are `debug`, `info`, `warn`, and `error`. |
| `QUIZMASTER_MCP_REQUEST_TIMEOUT_MS` | No | `10000` | Positive integer timeout for Quizmaster REST calls, in milliseconds. |

The stdio transport reserves stdout for MCP JSON-RPC messages. Logs and diagnostics must go to stderr.

## Local Smoke Run

From the repository root, run:

```bash
QUIZMASTER_BASE_URL=http://localhost:8080 pnpm --silent --dir mcp start
```

This starts the MCP server and waits for an MCP host to speak JSON-RPC over stdin/stdout. For normal use, start it from an MCP host configuration instead of typing JSON-RPC manually in a terminal.

## Generic MCP Host Configuration

Use this shape for MCP hosts that support an `mcpServers` JSON configuration:

```json
{
  "mcpServers": {
    "quizmaster": {
      "command": "pnpm",
      "args": ["--silent", "--dir", "/workspaces/quizmaster/mcp", "start"],
      "env": {
        "QUIZMASTER_BASE_URL": "http://localhost:8080",
        "QUIZMASTER_MCP_TRANSPORT": "stdio",
        "QUIZMASTER_MCP_LOG_LEVEL": "info",
        "QUIZMASTER_MCP_REQUEST_TIMEOUT_MS": "10000"
      }
    }
  }
}
```

Adjust `/workspaces/quizmaster/mcp` to the absolute path of the local `mcp` package when running outside this workspace.

Use `--silent` so the package manager does not write lifecycle output to stdout before the MCP server starts.

## Available Capabilities

After the MCP host connects, the Quizmaster server exposes:

- tools for health checks and workspace, question, quiz, statistics, and AI draft operations,
- resources under the `quizmaster://` URI scheme,
- prompts for creating questions, reviewing workspaces, and creating quizzes from tags.

Useful first checks from an MCP host:

- call `quizmaster_health` to confirm that the backend is reachable,
- read `quizmaster://domain-language` to load Quizmaster terminology,
- create or provide a workspace GUID before using workspace-scoped tools.

## Authentication Notes

The current MCP implementation does not add an authorization header to REST calls.

When REST authentication from `rest-auth-spec.md` is implemented, configure these additional variables:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `QUIZMASTER_AUTH_TOKEN` | Yes for protected calls | none | Bearer token used by the MCP server when calling protected REST endpoints. |
| `QUIZMASTER_AUTH_MODE` | No | `bearer` | `bearer` for authenticated REST calls, `none` only for legacy local development. |

Token values must never be written to stdout, stderr, MCP tool results, MCP resources, or error messages.

Example future authenticated host configuration:

```json
{
  "mcpServers": {
    "quizmaster": {
      "command": "pnpm",
      "args": ["--silent", "--dir", "/workspaces/quizmaster/mcp", "start"],
      "env": {
        "QUIZMASTER_BASE_URL": "http://localhost:8080",
        "QUIZMASTER_AUTH_MODE": "bearer",
        "QUIZMASTER_AUTH_TOKEN": "replace-with-local-token",
        "QUIZMASTER_MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| MCP host reports invalid JSON or protocol startup failure | Confirm the command uses `pnpm --silent` and that nothing writes to stdout except the MCP server. |
| `quizmaster_health` returns unreachable | Confirm the backend is running and `QUIZMASTER_BASE_URL` points to the backend port, normally `http://localhost:8080`. |
| Startup fails with unsupported transport | Set `QUIZMASTER_MCP_TRANSPORT=stdio` or remove the variable. |
| REST calls time out | Increase `QUIZMASTER_MCP_REQUEST_TIMEOUT_MS` or check backend/database startup. |
| Tools cannot find a workspace | Provide an existing workspace GUID or create one with `quizmaster_create_workspace`. The current REST API has no workspace index endpoint. |

## Verification Commands

Run these commands before sharing a configured MCP setup:

```bash
pnpm code:mcp:tsc
pnpm test:mcp
QUIZMASTER_BASE_URL=http://localhost:8080 pnpm --silent --dir mcp start
```

The final command is expected to keep running until the MCP host disconnects or the process is stopped.
