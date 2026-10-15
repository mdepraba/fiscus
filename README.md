# Fiscus

A private personal finance app for one owner: a ledger with quick entry,
pay-cycle budgets in rupiah and an afford check, replacing Money Manager.

**Status: scaffolded, with no features yet.** The 9 TypeScript projects of
[PRD 5.4](docs/prd/5.4-repository-layout.md) are in place: the API answers
`/health`, and the web app shows a placeholder. The code and the database
are designed around an offline-first Flutter phone app
([ADR-0002](docs/architecture/decisions/0002-offline-first-mobile-app.md)),
which arrives in Stage 9.
The [implementation plan](docs/implementation-plan.md) shows the stage the
build is in and what comes next.

| Path | What it holds |
| --- | --- |
| [docs/](docs/README.md) | The spec: the PRD, user stories, the implementation plan and architecture, and the app flow with the web and phone designs |
| `apps/` | `api`, the server runner (Nest on Fastify), and `fiscus-web`, the web runner (React on Vite) |
| `libs/` | Core: `api`, `db` and `ui`, the platform every module plugs into |
| `modules/fiscus/` | The Fiscus module: `contracts`, `domain`, `api` and `web` |
| `tools/` | `boundaries/` and `secrets/`, the checks CI and the pre-commit hook run, and the esbuild plugin that keeps Nest's decorator metadata |
| `nx.json`, `tsconfig.base.json` | The Nx workspace and the shared TypeScript settings |
| `compose.yaml`, `.env.example` | PostgreSQL 18 for development, and the settings the API reads |
| [deploy/](deploy/README.md) | The host runbook, the systemd unit and the PostgreSQL limits, drafted and not yet run on the host |
| `biome.json` | Linting and formatting |
| `.husky/`, `commitlint.config.mjs` | Git hooks: Biome and the secrets scan on staged files, Conventional Commits |
| `.github/workflows/ci.yml` | The `verify` job, run on every push |
| `.claude/skills/` | `apple-design` and `mobile-native`, the skills the phone design was made with |

## Development

You need Bun 1.4.2 (the version in `packageManager` in `package.json`),
Node 24, which runs Nx, and Docker for the development database,
PostgreSQL 18.

```bash
bun install
```

```bash
cp .env.example .env
```

```bash
docker compose up -d postgres
```

```bash
bun run check
```

```bash
bun run boundaries
```

```bash
bun x nx affected -t typecheck test build
```

```bash
bun x nx run @app/api:serve
```

```bash
bun x nx run @app/fiscus-web:dev
```

`bun install` also sets up the Git hooks. `bun run format` fixes what
`bun run check` reports. The API listens on 127.0.0.1:3000, and the web app
on localhost:4200 proxies `/api` and `/health` to it. `/health` answers 503
while PostgreSQL is down. The database tests run when `.env` sets
`DATABASE_URL`, each in a throwaway database, and are skipped without it. CI
runs them against its own PostgreSQL 18.
