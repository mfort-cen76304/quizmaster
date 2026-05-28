# MCP server — HTTP deploy plan (single container, Railway)

Deploy the MCP server to the same Railway service that already runs the
backend, exposed over HTTP and proxied behind Spring. Chosen over a separate
Railway service because the repo is single-source, CI already validates both
sides, and the Spring perimeter is a natural place to put ingress auth.

## Target topology

- One container, two processes: JVM (Spring Boot) + Node (MCP HTTP server).
- Spring listens on Railway's `$PORT` (the public surface).
- MCP listens on `127.0.0.1:${MCP_HTTP_PORT}` (never `0.0.0.0`).
- Spring proxies `/mcp/**` to the local Node process and enforces the
  ingress bearer.
- MCP calls back into the backend over `127.0.0.1:$PORT` using
  `QUIZMASTER_AUTH_TOKEN` for the existing forwarding header.
- MCP runs in **single-tenant mode**: one shared backend token for every MCP
  host. Multi-tenant per-session tokens are a separate epic.

## Phase 1 — HTTP transport in the MCP server

Goal: `pnpm mcp` runs in either stdio or HTTP mode against a config switch.
No backend or Docker work yet.

- `mcp/src/config.ts`: extend `McpTransport` to `'stdio' | 'http'`; relax
  `parseTransport`; add `httpPort` (default `3000`) and `httpBindAddress`
  (default `127.0.0.1`).
- `mcp/src/index.ts`: branch on transport. For `http`, instantiate
  `StreamableHTTPServerTransport` with `sessionIdGenerator: undefined` and
  `enableJsonResponse: true` (stateless, one-shot JSON per request — keeps
  the Spring proxy trivial because there's no SSE to forward). Wire it into
  a small `node:http` server: `POST /mcp` calls `transport.handleRequest`,
  `GET /health` returns 200.
- `mcp/package.json`: add `build: tsc -b`, change runtime `start` to
  `node dist/index.js`. Keep `tsx` in devDeps only. Add `dist/` to
  `.gitignore`.
- `mcp/tsconfig.json`: confirm emit to `dist/`.
- Tests: extend `mcp/test/protocol.test.ts` with an HTTP case using the
  SDK's `StreamableHTTPClientTransport` against the spun-up server. Existing
  stdio test stays.

## Phase 2 — Spring proxy and ingress auth

Goal: hitting `/mcp` on the backend forwards to `127.0.0.1:3000/mcp`, gated
by a bearer header. MCP started independently via `pnpm mcp` for now.

- New filter in `backend/.../config/`: an `OncePerRequestFilter` on
  `/mcp/**` that checks `Authorization: Bearer ${mcp.ingress.token}`
  against an `application.properties` value backed by `MCP_INGRESS_TOKEN`.
  Reject with `401` on miss. Don't pull in Spring Security — one filter
  bean is enough.
- New `@RestController` (or `RestClient`/`WebClient`) at `/mcp`, handling
  `POST` and `DELETE`. Forwards body, content-type, and MCP-specific
  headers (`Mcp-Session-Id`, `MCP-Protocol-Version`, `Accept`) to
  `http://127.0.0.1:${mcp.http.port}/mcp`. Returns the upstream status,
  body, and headers verbatim. **Strip the inbound `Authorization` before
  forwarding** so the ingress token never leaks to the MCP process. The
  MCP→Spring direction uses `QUIZMASTER_AUTH_TOKEN` separately.
- `application.properties`: add `mcp.ingress.token=${MCP_INGRESS_TOKEN:}`
  and `mcp.http.port=${MCP_HTTP_PORT:3000}`. Fail-fast on empty token in
  prod profile to prevent accidentally exposing an unauthenticated `/mcp`.
- Tests: filter slice test (401 on bad/missing token, 200 passthrough on
  good token + stubbed upstream); integration test against `MockWebServer`
  for the proxy controller.

After phase 2: terminal 1 `pnpm mcp` with `QUIZMASTER_MCP_TRANSPORT=http`,
terminal 2 `pnpm start:be`, then `curl -H "Authorization: Bearer …"
http://localhost:8080/mcp` reaches the MCP server. One real MCP host smoke
test before any container work.

## Phase 3 — Dockerfile with both runtimes

Goal: one image that boots both processes and exposes only Spring's port.

- Builder stage (already `ghcr.io/scrumdojo/dev-quizmaster:v4`, has Node
  and pnpm): add `pnpm install:mcp && pnpm --filter quizmaster-mcp build`.
  The Java JAR build stays as-is.
- Runtime stage: keep `eclipse-temurin:21-jre`, layer Node 24 on via
  NodeSource (`curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  && apt-get install -y nodejs`). Fallback if NodeSource flakes during
  builds: copy the Node binary from a `node:24-slim` builder stage.
- `COPY --from=builder /quizmaster/mcp/dist /app/mcp/dist` plus
  `package.json`; run `npm ci --omit=dev` in the runtime stage to install
  the slim production tree.
- New `scripts/start-container.sh`:
  - `set -euo pipefail`.
  - Start Node MCP in background, capture PID.
  - Wait for `127.0.0.1:${MCP_HTTP_PORT}/health` (curl loop, ~5s budget).
  - Start `java -jar quizmaster.jar` in foreground.
  - `trap` SIGTERM/SIGINT → forward to both children, then exit.
  - If either child dies, kill the other and exit non-zero so Railway
    restarts the container.
- `CMD ["/start-container.sh"]`. Spring already reads `${BE_PORT:8080}`;
  set `BE_PORT=$PORT` in the start script, or change `server.port` to
  read `PORT` directly.
- Image size budget: ~350–400 MB (JRE ~250, Node ~80, app ~50).

## Phase 4 — Railway wiring

Goal: the existing CI-triggered deploy ships MCP alongside the backend
with no per-release dashboard changes.

Service variables (one-time, in the dashboard):

- `MCP_INGRESS_TOKEN` — random 32+ char secret. What MCP hosts present.
- `QUIZMASTER_AUTH_TOKEN` — what MCP forwards to the backend. Today any
  non-empty string works (backend has no auth); set it now so it's wired
  when backend auth lands.
- `QUIZMASTER_MCP_TRANSPORT=http`.
- `QUIZMASTER_MCP_BASE_URL=http://127.0.0.1:${PORT}` — MCP→backend uses
  the in-container port.
- `MCP_HTTP_PORT=3000`.

Healthcheck: keep Railway's existing backend healthcheck path. MCP
readiness is covered by the start script's wait-for-port loop — Spring
won't be up until Node is.

No `railway.json` changes needed if Railway is already using the
Dockerfile. If it's using nixpacks, switch to Dockerfile in the service
settings.

First deploy: bump `mcp/package.json` version from `0.0.0` so logs are
diagnosable, push to `master`, let CI run, let Railway pull.

## Phase 5 — Docs and host config

Goal: someone can hand a workshop participant a URL and a token and their
MCP host connects.

- `docs/mcp/configuration.md`: replace the stdio-launcher block (or add
  alongside) with the HTTP host config — `type: "http"`,
  `url: "https://quizmaster.scrumdojo.cz/mcp"`,
  `Authorization: Bearer <MCP_INGRESS_TOKEN>` header.
- `docs/mcp/rest-auth.md`: there is now an auth boundary at MCP ingress.
  It is not the workspace-level model the spec ultimately wants;
  `RestApi.SecurityFoundation.feature` remains pending for backend auth.
- `docs/mcp/overview.md`: amend the boundary diagram. MCP host talks
  HTTPS to Spring, which proxies to Node, which calls back into Spring's
  `/api`. Note explicitly that the two `/api` directions inside the
  container share a process boundary but no auth state.
- `CLAUDE.md`: short note that MCP is reachable at `/mcp` and the host
  config moved to HTTP.

## Risk register

1. **Streamable HTTP in stateless mode.** Verify with a real MCP host
   before trusting the round-trip without session IDs. SDK supports it;
   open question is whether Claude Desktop / Cursor tolerate it. Fallback:
   enable sessions with an in-memory `Map<sessionId, transport>` — ~30
   lines.
2. **NodeSource availability inside the temurin image.** If
   `apt-get install nodejs` flakes during a deploy, swap to copying the
   Node binary from `node:24-slim`. Simpler, no apt network dep at build.
3. **Shared `QUIZMASTER_AUTH_TOKEN`.** Anyone with the ingress token
   reaches a backend that ignores its bearer header. Pre-existing gap,
   not a regression — flag it in `rest-auth.md` so it isn't forgotten.
4. **Token rotation.** `MCP_INGRESS_TOKEN` lives only in Railway env.
   Document where it lives and who can rotate it before it becomes folk
   knowledge.

## Effort estimate

- Phase 1: half a day.
- Phase 2: half a day.
- Phase 3: half a day (mostly start script + signal handling).
- Phase 4: ~1 hour, mostly waiting for deploys.
- Phase 5: ~1 hour.

~2 focused days end-to-end, single contributor.

## Files in scope

- `mcp/src/config.ts`, `mcp/src/index.ts`, `mcp/package.json`,
  `mcp/tsconfig.json`, `mcp/test/protocol.test.ts`
- `backend/src/main/java/cz/scrumdojo/quizmaster/config/` (filter +
  controller for `/mcp/**`)
- `backend/src/main/resources/application.properties`
- `Dockerfile`, new `scripts/start-container.sh`
- `docs/mcp/configuration.md`, `docs/mcp/overview.md`,
  `docs/mcp/rest-auth.md`, `CLAUDE.md`
