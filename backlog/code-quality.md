# Code Quality Backlog

## Oxlint rule expansion

`.oxlintrc.json` currently enables `eslint`, `unicorn`, `typescript`, `oxc`,
`import` plugins with two explicit rules. No category-level config and no
React plugin.

- Enable `suspicious` and `perf` rule categories for broader bug detection.
- Enable `react` plugin (frontend is React 19 — currently zero hooks-rules
  coverage). Likely turns up `react-hooks/exhaustive-deps` issues; budget
  cleanup time.

## `#fe/` alias is a catch-all

`#fe/*` resolves the entire frontend source root and is used in 26 imports
across `helpers.ts`, `urls.ts`, `app.tsx`, `assets/`, `format/`. Two
sub-issues:

- The alias hides where things live. `#fe/helpers.ts` and `#fe/urls.ts`
  could move under a proper directory (`#fe/lib/`) so the alias points at
  a directory, not a grab-bag of root-level files.
- A boundary rule between `pages/make/**` and `pages/take/**` (see
  `frontend-bundle-split.md`) is harder to enforce while everything is one
  flat alias.

Worth doing alongside the bundle split, not before.

## Wait-on-tooling

- oxfmt member sorting within import braces (`{ b, a }` → `{ a, b }`) — not
  yet supported. Recheck on oxfmt updates.
- IntelliJ oxc plugin — verify and document for IntelliJ/WebStorm users
  once the plugin is mature.

## Removed from this backlog

- ~~Upgrade `concurrently` 9.1.2 → 9.2.1~~ — trivial dep bump, do it as a
  one-liner when convenient; not backlog-worthy.
