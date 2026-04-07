---
name: rebase
description: "Rebase the current branch and validate each step. Supports two scenarios: on a feature branch (or worktree) runs `git rebase master` against local master; on master itself runs `git pull --rebase`. Use when the user says /rebase, asks to rebase, or sync the branch."
---

# Rebase

Streamlined, reliable rebase with full validation. Run all commands from the project root.

## Preflight

1. `git status` — working tree must be clean. If not, **stop and ask** (never stash or discard silently).
2. Capture the current branch name and HEAD sha for recovery: `git rev-parse --abbrev-ref HEAD`, `git rev-parse HEAD`.
3. Pick the scenario:
   - **On `master`** → `git pull --rebase`
   - **On any other branch** (including a worktree branch) → `git rebase master` (local master — do not fetch, do not use `origin/master`)

## Rebase loop

Run the chosen command. Then loop until complete:

- **Clean apply** → continue.
- **Conflict** → resolve (see below), then validate, then `git rebase --continue`.
- **Cannot resolve** → stop and ask the user. Never `--skip` without permission.

### Resolving a conflict

1. `git status` to list `Unmerged paths`.
2. For each conflicted file: `Read` it, understand both sides, `Edit` to merge intent from both. Never blindly pick one side. Remove all `<<<<<<<`, `=======`, `>>>>>>>` markers.
3. Watch for **migration version collisions** (`backend/src/main/resources/db/migration/V#####__*.sql`). If both branches added the same `V#####`, renumber the local one to the next free version with `git mv` and run `./gradlew clean` (the build cache holds the old name).
4. `git add` each resolved file.

### Validate before `--continue`

After resolving (and before `git rebase --continue`), in this order:

1. **`pnpm install:all`** — only if `pnpm-lock.yaml` or any `package.json` changed in the rebased commits.
2. **`pnpm code`** — TypeScript + lint + format. After it runs, re-check `git status`; auto-formatted files must be staged with `git add`.
3. **`pnpm test:be`** — backend tests.
4. **`pnpm test:e2e`** — full E2E (builds frontend into backend, starts backend, runs Cucumber/Playwright).

If any step fails, fix the root cause and re-run that step. Then `git rebase --continue`.

### Flyway checksum mismatch

If `pnpm test:be` fails with `Migration checksum mismatch` or `Found more than one migration with version`:

1. Read `.env` for `DB_SCHEMA` (always present).
2. The other DB connection values are fixed in `backend/src/main/resources/application.properties` and are **not** overridable via `.env`:
   - host: `postgres`
   - database: `quizmaster`
   - user: `quizmaster`
   - password: `quizmaster`
   - port: `5432`
3. Drop and recreate the schema:
   ```
   PGPASSWORD=quizmaster psql -h postgres -p 5432 -U quizmaster -d quizmaster \
     -c "DROP SCHEMA \"$DB_SCHEMA\" CASCADE; CREATE SCHEMA \"$DB_SCHEMA\";"
   ```
4. Re-run `pnpm test:be`.

### Port collision

If `pnpm test:e2e` fails with "Ports … in use" — **stop and ask the user** to free the ports. Never kill processes automatically.

## Folding post-rebase fixes into the right commit

Fixes discovered after the rebase finishes (like a migration renumber that only surfaced at runtime) belong in the commit that introduced the problem, not as trailing fixups on top:

```
git commit --fixup=<offending-sha>
GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash master
```

Never `git commit --amend`. Never `--no-verify`.

## Recovery

If the rebase becomes unrecoverable, surface the original HEAD sha captured in preflight and ask the user before running `git rebase --abort` or `git reset --hard <sha>`. Both are destructive.

## Done

Report:
- Number of commits rebased
- Conflicts resolved (file count) and any non-obvious merge decisions
- Whether the schema had to be dropped
- Final `git log --oneline` of the rebased commits

Do **not** push. The user pushes.
