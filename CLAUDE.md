# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Fiscus is a private personal finance app for one owner. The app, the project
and the code are all called Fiscus (`fiscus` in code).

The Nx workspace holds the 9 TypeScript projects of PRD 5.4, scaffolded in
Stage 1 with **no features yet**: `apps/api` (Nest on Fastify) answers
`/health` (503 while PostgreSQL is down), and `apps/fiscus-web` (React on
Vite) shows a placeholder. `libs/db` holds the pool, Drizzle and the
migration runner; `libs/api` reads the configuration. The
code and the database are designed around an offline-first Flutter phone
app with sync (ADR-0002), which arrives in Stage 9 as
`apps/fiscus-mobile/`. The server and the web app stay TypeScript (Q-01), so
the budget and cycle rules exist in TypeScript and Dart, kept equal by shared
test cases.

## Commands

Bun installs packages and runs scripts; Nx itself runs on Node 24. pnpm and
npm are not used.

- `bun install`: install, and set up the Husky hooks.
- `cp .env.example .env` and `docker compose up -d postgres`: PostgreSQL 18
  for development. Database tests run when `DATABASE_URL` is set, each in a
  throwaway database from `@core/db/testing`, and are skipped without it.
- `bun run check`: Biome lint and format check. `bun run format` fixes.
- `bun run boundaries`: the module rules of PRD 5.4 over the Nx graph.
  Every project needs one `scope:` and one `type:` tag.
- `bun run secrets`: no env files or secrets in tracked files (NFR-10). The
  pre-commit hook runs it on staged files.
- `bun x nx affected -t typecheck test build`: what CI runs after Biome.
- `bun x nx run @app/api:serve` and `bun x nx run @app/fiscus-web:dev`: the
  API on 127.0.0.1:3000, and the web app on localhost:4200 with a proxy to
  the API.
- `bun add -d <pkg> --cwd <project>`: add a library only when its
  `docs/architecture/tech-stack.md` row is Chosen or Accepted. A new
  server-only package also goes in `SERVER_PACKAGES` in
  `tools/boundaries/rules.mjs`. Bun gives each project only the packages it
  declares, and the API bundle keeps third-party packages external, so
  `apps/api` also declares every runtime package its libraries import.

Commits follow Conventional Commits (commitlint), with the stage and the
requirement IDs in the footer, such as `Refs: Stage 2, BR-09`.

## Where things are

- `docs/` is the spec. `docs/README.md` says which file holds each kind of ID
  (`US-`, `AC-`, `FR-`, `BR-`, `EC-`, `NFR-`, `A-`, `Q-`, `UI-`, `J-`, `BG-`,
  `FD-`). Look a rule up there before changing anything it governs.
- `docs/implementation-plan.md` is the build order and where the project
  stands: stages 0 to 9, their work items, the sign-offs and Gates A to C. A
  commit that ticks a work item or a sign-off item also updates the plan's
  stage table and "Where the project is". Task ids (`T-`) were retired with
  `docs/tasks/` on 11 Oct 2026.
- IDs were made contiguous on 11 Oct 2026. From now on, never renumber or
  reuse one: a removed requirement leaves a gap.

## Design files

`docs/design/ui/*.pen` are pen.dev files. They are encrypted, so edit them
with the `pen` CLI (`pen interactive --app desktop --in <file>`) and never
Read or Grep them. `fiscus.pen` imports `design-system.lib.pen` by a relative
path, so keep the two side by side.

## Writing the docs

Match the existing docs: plain sentences, tables, and IDs cited inline. Call
the app Fiscus; "Expense" as a transaction type (BR-02) keeps its name.
Nothing personal goes in the repo: salary and budget amounts live in
settings, never in docs or code.
