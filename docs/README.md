# Fiscus docs

Fiscus is a private personal finance app for one owner on a 1 vCPU / 1 GB
VPS. It replaces a phone app and CSV files.

For now the project is docs plus an empty Nx workspace, with no projects
yet. The code and the database are being designed around an offline-first
Flutter phone app
([ADR-0002](architecture/decisions/0002-offline-first-mobile-app.md)).

Read the [PRD](prd/README.md) for what to build and the
[architecture guide](architecture/README.md) for where the code goes. Where the
project is now, and what gets built in what order, is in the
[implementation plan](implementation-plan.md).

## Folders

| Path | What it holds |
| --- | --- |
| [implementation-plan.md](implementation-plan.md) | The build in stages: what each one delivers, what the owner signs off before the next one starts, the gates, and where the project is now |
| [prd/](prd/README.md) | The product requirements: background, goals and scope, actors and permissions, functional requirements, business rules, state lifecycles, edge cases, integrations, notifications, non-functional requirements, repository layout, assumptions and open questions |
| [user-story/](user-story/README.md) | The user stories and their acceptance criteria, for the core platform, for ledger and budgets, and for the phone app (PRD section 3) |
| [architecture/](architecture/README.md) | The design of the code: the architecture guide, with the phone app and the shared test cases, the [tech stack](architecture/tech-stack.md) and the decision records in [decisions/](architecture/decisions/) |
| [database/](database/README.md) | The database design: the `core` and `fiscus` schemas in DBML, their conventions, the sync columns and triggers, and which table carries each requirement |
| [design/](design/app-flow/README.md) | UI design. The [app flow](design/app-flow/README.md) covers every screen, every control and what happens after each action. The [web design](design/web/README.md) is the visual design on a computer: decisions, tokens, the motion spec and an HTML prototype. The [phone design](design/mobile/README.md) covers the same screens on a phone |

## Finding a requirement by ID

Design notes, and later code comments, cite requirement IDs. Each kind of ID
is in one place:

| ID | Meaning | File |
| --- | --- | --- |
| `US-`, `AC-` | User story, acceptance criterion | [user-story/](user-story/README.md), one file per area |
| `FR-` | Functional requirement | [prd/4.1-workflow.md](prd/4.1-workflow.md) |
| `BR-` | Business rule | [prd/4.2-business-rules.md](prd/4.2-business-rules.md) |
| — | State lifecycles: transaction, import batch, API token, pay cycle | [prd/4.3-state-lifecycle.md](prd/4.3-state-lifecycle.md) |
| `EC-` | Edge case | [prd/4.4-edge-cases.md](prd/4.4-edge-cases.md) |
| `NFR-01` to `NFR-20`, `NFR-23` to `NFR-25` | Non-functional requirement | [prd/5.3-non-functional-requirements.md](prd/5.3-non-functional-requirements.md) |
| `NFR-21`, `NFR-22` | Build time and bundle size | [prd/5.4-repository-layout.md](prd/5.4-repository-layout.md) |
| `A-`, `Q-` | Assumption, open question | [prd/6-open-questions-and-assumptions.md](prd/6-open-questions-and-assumptions.md) |
| `UI-`, `J-`, `BG-`, `FD-` | Screen (such as `UI-FIS-01`), journey, background flow, flow decision | [design/app-flow/](design/app-flow/README.md) |
| Stage 0 to Stage 9, Gates A to C | Build stage, phase gate | [implementation-plan.md](implementation-plan.md) |

IDs are never renumbered or reused. A removed requirement leaves a gap.

A citation such as "PRD 4.3" is a section number. Each section is the file in
`prd/` whose name starts with that number. Section 3 points to `user-story/`,
where the stories live.
