# Fiscus

A private personal finance app for one owner: a ledger with quick entry,
pay-cycle budgets in rupiah and an afford check, replacing Money Manager.

**Status: an empty workspace.** The Nx workspace and its tooling are set up,
but there are no projects yet. The code and the database are being designed
around an offline-first Flutter phone app
([ADR-0002](docs/architecture/decisions/0002-offline-first-mobile-app.md)).
The [implementation plan](docs/implementation-plan.md) shows the stage the
build is in and what comes next.

| Path | What it holds |
| --- | --- |
| [docs/](docs/README.md) | The spec: the PRD, user stories, the implementation plan and architecture, and the app flow with the web and phone designs |
| `apps/`, `libs/`, `modules/`, `tools/` | Empty for now. Projects go here as [PRD 5.4](docs/prd/5.4-repository-layout.md) lays out |
| `nx.json`, `tsconfig.base.json` | The Nx workspace and the shared TypeScript settings |
| `biome.json` | Linting and formatting |
| `.husky/`, `commitlint.config.mjs` | Git hooks: Biome on staged files, Conventional Commits |
| `.github/workflows/ci.yml` | The `verify` job, run on every push |
| `.claude/skills/` | `apple-design` and `mobile-native`, the skills the phone design was made with |

## Development

You need Bun 1.4.2 (the version in `packageManager` in `package.json`) and
Node 24, which runs Nx.

```bash
bun install
```

```bash
bun run check
```

```bash
bun x nx affected -t typecheck test
```

`bun install` also sets up the Git hooks. `bun run format` fixes what
`bun run check` reports.
