# Architecture

How Fiscus's code is shaped, from the whole repository down to one use case.
The [PRD](../prd) says what to build; this says where each piece goes. The
decisions behind it, and the alternatives weighed, are in
[ADR-0001](decisions/0001-module-internal-architecture.md) for the inside of a
module and [ADR-0002](decisions/0002-offline-first-mobile-app.md) for the
phone app and sync. The libraries and infrastructure, installed and proposed,
are in [tech-stack](tech-stack.md).

## In short

Fiscus is a **modular monolith** in TypeScript: one server and one web app.
Modules are the bounded contexts: each owns its data and talks to the others
only through its `contracts` package.

The **phone app** is a separate Flutter app in the same repository (Q-07).
It keeps a copy of the data, works offline and syncs through the API
(ADR-0002). It shares no code with the TypeScript side. The rules it needs
are written again in Dart and kept equal by shared test cases (Q-01).

Inside a module it is **not full hexagonal architecture**. Modules use a
**functional core with an imperative shell**:

- **`domain` is the core.** Business rules are pure functions over plain data,
  with no I/O, no clock, no randomness and no framework.
- **`api` is the shell.** It loads the data a decision needs, calls the rules,
  saves the result and speaks HTTP, jobs and events.

Hexagonal ports and adapters appear only at real edges: the clock, email,
files, the job queue, backups and other modules. How much of this structure a
module gets depends on how many rules it has.

## Why not full hexagonal

The full comparison is in the ADR. The short version:

- Hexagonal pays off when infrastructure might be swapped, or when the domain
  must be tested without it. Fiscus runs on one PostgreSQL with one framework,
  and nothing in the PRD swaps them. A repository interface per aggregate would
  have exactly one implementation.
- The code that most needs protecting is calculation, not I/O: pay cycles and
  budget math (BR-10 to BR-22), the afford check, the duplicate rule (BR-07)
  and the lifecycles in PRD 4.3. Pure functions protect that better than
  ports, because their tests need no mocks.
- There is one maintainer, so every layer of indirection costs the same person
  time. PRD 5.4 already says a folder becomes a project only when it needs its
  own boundary.

We keep hexagonal's core rule: dependencies point inward. `domain` knows
nothing about Nest, Drizzle, pg-boss or React, and `bun run boundaries` fails
the build if it tries.

## Level 1: the repository

An arrow means "may import".

```text
apps/api ───────► modules/<m>/api ──► modules/<m>/domain ──► modules/<m>/contracts
   │                 │  │                                                  ▲
   │                 │  └──► modules/<other>/contracts                     │
   │                 └─────► libs/api ──► libs/db                          │
   └──► libs/api                                                           │
                                                                           │
apps/fiscus-web ──► modules/fiscus/web ────────────────────────────────────┘
   │                  └─────► libs/ui
   └──► libs/ui

apps/fiscus-mobile (Dart)   imports nothing above. Its tests read
                            modules/fiscus/domain/cases/ and
                            modules/fiscus/contracts/fixtures/
```

- **Apps compose.** They wire modules together and nothing imports them.
  `apps/api` is the server runner and `apps/fiscus-web` the web runner. Each
  lists its modules by hand until the module registry (FR-07) builds the lists
  from manifests.
- **The phone app stands apart.** `apps/fiscus-mobile` is a Flutter project.
  It reaches the server only over HTTP, through the sync and REST endpoints,
  and reads the repo only for its tests (see [The phone app](#the-phone-app)).
- **Core is a platform that modules plug into.** It lives in `libs/`. Core
  defines the shapes: the manifest type, guards, the job queue, the event bus,
  audit and settings. Modules implement those shapes or call them, and core
  never names a module. If most module changes also edit `libs/`, core is
  doing module work, and that logic moves back into the module (PRD 5.4).
- **Modules meet only at `contracts`.** Because the coupling is there and not
  inside the module, a module could later be moved out (PRD 5.4) by putting a
  network adapter behind its contracts.

| Rule | Enforced by |
| --- | --- |
| Nothing imports an app | `bun run boundaries` |
| Modules import each other only through `contracts` | `bun run boundaries` |
| `contracts` imports no workspace project and no framework package, because contracts reach the browser | `bun run boundaries` |
| `domain` imports only `contracts` and no framework package | `bun run boundaries` |
| Core (`libs/`) imports no module | `bun run boundaries` |
| Browser code imports no server project or package | `bun run boundaries` |
| A module reads and writes only its own PostgreSQL schema | Code review |
| The phone app imports no TypeScript project. Its tests read only the shared cases and the contract fixtures | Code review; it is Dart, so no import can cross |
| A rule both apps run changes its TypeScript, its Dart and its shared cases in one commit | CI: both test suites run the cases |

## Level 2: the module

| Package | Holds | Runs in |
| --- | --- | --- |
| `contracts` | The module's published language: HTTP request and response types, event names and payloads, token scope ids, rule-violation shapes, query interfaces that other modules call | Server, browser |
| `domain` | Business rules as pure functions: validation, calculations, state transitions | Anywhere; no I/O |
| `api` | The shell: the Nest module, controllers, use-case services, the Drizzle schema, migrations and queries, pg-boss job handlers and event handlers | Server |
| `web` | Screens, data fetching and client-only state such as form drafts | Browser, loaded on demand |

The `fiscus` module's token scopes, events and schema are `fiscus:*`,
`fiscus.*` and `fiscus`.

Not every module needs all four:

| Module | How many rules | Shape |
| --- | --- | --- |
| `fiscus` | Many: BR-01 to BR-38 and the lifecycles in PRD 4.3 | All four packages. This is the reference shape |
| `core` | Platform plumbing and security | Layered (controller → service → Drizzle), with ports for external systems |

### Where does this code go?

| If the code… | It goes in |
| --- | --- |
| decides something from data (a rule, a calculation, a state change) | `domain` |
| is a type that another module or the browser must share | `contracts` |
| touches the database, files, email or the queue, or handles HTTP | `api` |
| is needed by two or more modules and is not about any one of them | core, in `libs/` |
| renders, or holds UI state | `web` |

### Reference layout: `fiscus`

```text
modules/fiscus/
├── contracts/
│   ├── src/
│   │   ├── transactions.ts   request and response types (FR-24, FR-26)
│   │   ├── sync.ts           mutations, push results and pull pages (FR-39, FR-40)
│   │   ├── events.ts         fiscus.cycle.opened, fiscus.transaction.ingested
│   │   ├── scopes.ts         fiscus:read, fiscus:write, fiscus:settings, fiscus:ingest
│   │   └── violations.ts     the rule-violation shape behind 400 and 422 responses
│   └── fixtures/             sample sync bodies, checked by the zod schemas and the Dart models
├── domain/
│   ├── src/
│   │   ├── transaction.ts    BR-01 to BR-08, transaction lifecycle (4.3)
│   │   ├── duplicates.ts     BR-07
│   │   ├── pay-cycle.ts      BR-10, BR-11, BR-13, pay-cycle lifecycle
│   │   ├── budget.ts         BR-12, BR-14 to BR-18
│   │   ├── afford.ts         BR-19 to BR-22
│   │   ├── categorise.ts     BR-32
│   │   └── import/           TSV parsing and preview, BR-05, BR-27, batch lifecycle
│   └── cases/                shared JSON test cases, run by Vitest and by the Dart tests
├── api/src/
│   ├── fiscus.module.ts
│   ├── manifest.ts       server half of FR-07: scopes, migrations, jobs, settings
│   ├── schema/           Drizzle tables, one file per table group
│   ├── migrations/
│   ├── transactions/     private API and ingest controllers, service, repository
│   ├── imports/
│   ├── cycles/           pg-boss handlers: open and close cycles, recurring rules
│   ├── budget/           budget status and afford check
│   ├── rules/            categorisation and recurring rule settings
│   └── sync/             sync/push and sync/pull; push calls the same services as REST
└── web/src/
    ├── index.tsx         default export, loaded when the module opens
    ├── manifest.ts       nav and palette entries, loaded with the web runner
    └── quick-entry/      amount first, last-used defaults and the save timer (FR-18)
```

Folders inside `api` are features, not technical layers. Everything about
imports lives in `imports/`, rather than in `controllers/` + `services/` +
`repositories/`.

## Level 3: inside a use case

```text
HTTP request / pg-boss job / event
        │
        ▼
controller or handler      adapter: parse input, check scopes, map to contract types
        │
        ▼
service (the use case)     shell: load → decide → save, in one database transaction
        │         │
        │         ▼
        │    domain function      core: pure, all inputs passed in
        ▼
repository (Drizzle)       adapter: this module's schema only
```

Example: confirming a reviewed transaction (PRD 4.3, FR-22, EC-04).

```ts
// modules/fiscus/domain/src/transaction.ts: the core
export function confirm(transaction: Transaction): Decision<Transaction> {
  if (transaction.status !== 'Unreviewed') {
    return reject('status', 'Only unreviewed transactions can be confirmed');
  }
  return accept({ ...transaction, status: 'Confirmed' });
}

// modules/fiscus/api/src/transactions/transactions.service.ts: the shell
async confirm(id: string, loadedVersion: number): Promise<TransactionDto> {
  return this.db.transaction(async (trx) => {
    const current = await this.transactions.get(trx, id);
    if (current.version !== loadedVersion) {
      throw new ConflictException('Changed elsewhere. Review both versions.');
    }
    const decision = confirm(current);
    if (!decision.ok) throw new UnprocessableEntityException(decision.violations);
    await this.transactions.save(trx, decision.value, { previous: current });
    return toTransactionDto(decision.value);
  });
}
```

### Rules for `domain`

- **Every input is a parameter**, including `now`, the timezone (BR-34) and
  settings such as the afford buffers (BR-22). Domain code never calls
  `Date.now()`, `crypto.randomUUID()` or `process.env`. Ids are generated in
  the shell.
- **Plain data in, plain data out.** Prefer functions over classes. A small
  value type is fine when it guards an invariant.
- **Expected rule violations are returned, not thrown.** A violation names the
  field, a code and the PRD's message, and its shape lives in `contracts`. The
  shell maps it to 400 or 422, or to a per-item list for ingest (AC-12.2).
  Throw only for bugs.
- **Money is a whole number of rupiah in a `number`** (BR-18). 10 miliar
  (BR-01) and the sum of a 50,000-row ledger both stay well inside
  `Number.MAX_SAFE_INTEGER`. Projections are rounded half up, once, as BR-18
  says.
- **Tests name the rule.** For example, `describe('BR-19 one-off purchase')`,
  so a PRD change points straight at its tests.

### Rules for `api`

- **One service method per user action.** It owns the database transaction,
  calls the domain, appends history (FR-22), writes audit (FR-13) and enqueues
  follow-up jobs.
- **Controllers are thin.** They parse input, declare scopes and map results.
  They hold no rules.
- **Reads skip the domain.** Lists, search and reports (FR-24, FR-33) query
  Drizzle directly and return contract types. Only the budget figures go
  through the domain, because they are rules (BR-12 to BR-18).
- **Repositories are concrete classes, not interfaces.** Nest's testing module
  can already replace a provider, so an interface with one implementation adds
  a file and nothing else.
- **Load first, then decide.** If a rule seems to need a query halfway through,
  run the query in the shell and pass the result in. Domain never gets a
  repository.

## Ports: where hexagonal does apply

A port is justified when the thing behind it lives outside the process, is
slow or nondeterministic, or must be faked in tests.

| Port | Why it is a port | Defined in | Adapter |
| --- | --- | --- | --- |
| Clock | Cycle opening, BR-06, the 30-day purge and the 7-day rollback all depend on "now" in the BR-34 timezone | `libs/api` | System clock; a fixed clock in tests |
| Mailer | Alerts (PRD 5.2); the relay is still open (Q-04) | `libs/api` | SMTP; in-memory in tests |
| File store | Streamed uploads (NFR-05), import files, exports, the 85% disk check (EC-17) | `libs/api` | `/srv/fiscus/data` |
| Job queue | Schedules, retries, durable follow-up work | `libs/api` | pg-boss |
| Event bus | In-process notifications between modules (PRD 5.2) | `libs/api` | In memory |
| Backup target | B2 is an assumption (A-06) | `libs/api` | restic |
| Another module's data | Keeps modules separable | The provider's `contracts` | The provider's `api` |

**In Nest, a port is an abstract class, not an interface.** Interfaces vanish
at runtime and cannot be DI tokens. For the same reason, an injected class must
never be imported with `import type`.

```ts
export abstract class Clock {
  abstract now(): Date;
}

// provided as { provide: Clock, useClass: SystemClock }
// tests:     .overrideProvider(Clock).useValue(fixedClock)
```

## Between modules

Prefer these in order:

1. **Don't.** Most features stay inside one module. Today no module needs
   another module's data.
2. **Events, for "this happened".** The PRD names two:
   `fiscus.cycle.opened` and `fiscus.transaction.ingested`. The name and
   payload type live in the publisher's `contracts`. Payloads carry ids and
   small facts, never notes or file names, because handlers may log them
   (NFR-11).
   - **The in-process bus is not durable.** Publish after the transaction
     commits, and use the bus only for things that get recomputed anyway, such
     as badges and banners.
   - **Work that must happen goes through pg-boss.** Enqueue it on the same
     database transaction as the change that caused it, so both commit or
     neither does.
3. **Query interfaces, for "I need your data now".** The provider declares an
   abstract class in its `contracts`, implements it in its `api` and exports it
   from its Nest module. The consumer injects it. The consumer never imports
   the provider's `api` and never queries its schema.

## Data

- **One PostgreSQL schema per module** (PRD 5.1): `fiscus`, and `core` for
  platform tables. The Drizzle tables use `pgSchema('<module>')` in the
  module's `api`. Migrations sit beside them in `migrations/` (Biome already
  ignores that folder), and the module's manifest hands them to `libs/db`
  (FR-07).
- **No SQL or foreign keys across modules.** A module may keep ids of core
  rows, such as the token that created a transaction. It copies anything it
  must still show if the source changes, such as the token's name (PRD 2.2).
- **Settings live in the core settings store**, namespaced by module id, never
  in code. Nothing personal goes in the repo. The exception is Fiscus's payday
  rule and afford buffers, which live in `fiscus.budget_settings` so the phone
  can work out cycles and afford checks offline (ADR-0002).
- **The tables themselves** are in the [database design](../database/README.md):
  the `core` and `fiscus` schemas, their conventions, and the sync columns.

## Cross-cutting concerns live in core

Modules declare these per route and never reimplement them.

| Concern | PRD | Mechanism in `libs/api` |
| --- | --- | --- |
| Session and token auth, scopes (401, 403) | FR-03, FR-06, 2.2 | A guard plus a scope decorator |
| `Idempotency-Key` | BR-09, NFR-13 | An interceptor replays stored responses. The key is saved on the create's own database transaction, so a crash cannot leave one without the other. A duplicate sent while the first is running waits for it, then gets its response |
| Rate limits | BR-31, NFR-14 | A guard, with its counters in memory (`@nestjs/throttler`) |
| Sign-in lockout | BR-29 | Read from the audit log, so it survives a restart. Passkey challenges stay in memory |
| Audit log | FR-13, NFR-12 | An audit service called inside the use case's transaction |
| Database down (503, Retry-After) | EC-16 | An exception filter |
| Logs without file names or notes | NFR-11 | Logger configuration and redaction |

## The web side

- **The runner owns the router, palette and layout.** `apps/fiscus-web`
  (Money Manager-style tabs) builds on the shell kit in `libs/ui` and mounts
  the platform screens from it. Modules provide screens.
- **Each `web` package has two entry points:**
  - `.` holds the screens. It is a lazy chunk (NFR-22).
  - `./manifest` holds data only: the module's id, name, icon name, routes,
    nav and palette entries. The runner imports it eagerly, so the palette
    can find a page before its module has ever loaded (AC-04.1).
- **The server half of the manifest is in `api`:** migrations, jobs and
  settings. Values both halves need, such as the module id and token scopes,
  live in `contracts`.
- **The same core-and-shell split applies in the browser.** Parsing and field
  checks are pure functions with their own tests, and components stay thin.
- **Budget figures and afford results always come from the API.** That way
  the web app and the private API give one answer (FR-28). `fiscus/web` may
  import its `domain` only for instant field checks such as BR-01 and BR-08.
- **The web app is online only** (Q-08). It keeps no queue and no copy of
  the data. Offline, it shows what it loaded, read-only (NFR-16).

## Sync on the server

ADR-0002 is the design. This is where its server half goes.

- **The endpoints live in `modules/fiscus/api/src/sync/`** (FR-39, FR-40).
- **Push holds no rules.** Each mutation names an entity and an operation.
  The sync service calls the same use-case method that the REST controller
  for that entity calls, with the mutation's id as the idempotency key. Each
  mutation gets its own database transaction, in the order sent (BR-35,
  BR-38). A REST change and a pushed change therefore write the same
  history, audit and jobs.
- **Pull is a read**, so it skips the domain like other reads. It runs in
  one REPEATABLE READ transaction per page run, takes the watermark, and
  reads every synced table in `(sync_txid, id)` order, about 1,000 rows a
  page, so memory stays flat (NFR-24). The table list, the cursor query and
  the tombstones are in the [database design](../database/README.md#sync).
- **The response is versioned and only gains fields** (NFR-25). Its types
  are in `contracts/src/sync.ts`, and each version has a sample body in
  `contracts/fixtures/`.
- **Pairing lives in core** (`libs/api`), beside tokens, because it makes a
  token (FR-34, BR-37). The web app asks for a code with the owner's
  session, and the phone exchanges the code on a route whose only
  credential is that code. Core never names a module, so each module's
  manifest lists the scopes a paired device gets (FR-07).

## The phone app

`apps/fiscus-mobile` is a Flutter project (Q-07), Android first (Q-06). It
keeps a full copy of the `fiscus` data, works offline and syncs (ADR-0002).
It draws the [phone design](../design/mobile/README.md) with the same
tokens.

```text
apps/fiscus-mobile/
├── pubspec.yaml          the Flutter version and packages, pinned
├── project.json          Nx targets analyze, test and build-apk; tags scope:fiscus, type:app
├── lib/
│   ├── main.dart
│   ├── domain/           the rules in Dart, pure: validation, duplicates, pay cycles, currency values (FR-37),
│   │                     then budget and afford (FR-43)
│   ├── data/             the drift database: the copy's tables, queries and migrations (FR-35)
│   ├── sync/             outbox, push, pull, merge and pairing (FR-19, FR-34, FR-39 to FR-42)
│   ├── remote/           the HTTP client: sync, pairing and the online-only calls
│   ├── theme/            Dart tokens generated from docs/design/web/tokens.json
│   └── screens/          one folder per app-flow group: transactions, stats, accounts, settings
└── test/
    ├── cases_test.dart   runs every file in modules/fiscus/domain/cases/
    └── …
```

The app has the same split as a module: `domain` is the core, and `data`,
`sync`, `remote` and `screens` are the shell. The [rules for
`domain`](#rules-for-domain) apply as written, in Dart.

- **Screens read the copy, never the network.** Drift's query streams
  redraw a screen when its rows change, whether the owner or a pull changed
  them. Only the actions that need a connection (FR-36), and Budget and the
  afford check until US-23 ships, call the API directly.
- **A change and its mutation commit together.** A write updates the row
  and appends its mutation in one SQLite transaction, so the copy never
  shows a change the queue does not hold (FR-19). An update also keeps the
  row as it was before the edit, which the merge needs (FR-42).
- **Push first, then pull.** A sync sends the queue in order, up to 100
  mutations at a time (BR-35), then pulls until it reaches the watermark.
  A pulled row that still has a waiting change on the phone is kept as the
  server's version for the merge. It never overwrites the phone's row.
- **One sync at a time.** Opening the app, a change and the connection
  coming back each start a sync, unless one is already running (PRD 5.1).
- **Ids are made in the shell.** New rows and mutations get UUIDv7s there;
  `domain` never makes ids, as on the server.
- **Secrets stay in secure storage.** The paired token and the database key
  live in the phone's secure store. The key is made on the first run and
  never leaves the phone (NFR-23).

**In CI** the `verify` job stays as it is, and a second job, `phone`,
installs the Flutter version pinned in `pubspec.yaml` and runs `analyze` and
`test`. The app's `project.json` names the `fiscus` domain and contracts
projects as implicit dependencies. A change to either, the shared cases
included, runs the Dart tests too, and a server-only change skips the job
(NFR-21). The `build-apk` target signs a release APK with a key kept as a CI
secret (NFR-10). You install it by hand.

## Shared test cases

The rules that both apps run are tested from one set of JSON files in
`modules/fiscus/domain/cases/` (ADR-0002 §6, Q-01). Vitest runs them against
the TypeScript `domain`, and `cases_test.dart` runs them against the Dart
one. A rule change that passes one suite and fails the other fails CI.

```json
{
  "function": "affordOneOff",
  "cases": [
    {
      "name": "BR-19 capacity exactly at price × 1.15 is AMAN",
      "input": { "capacity": 1150000, "price": 1000000, "buffer": 1.15 },
      "expected": { "status": "AMAN", "capacityAfter": 150000 }
    },
    {
      "name": "BR-19 capacity one rupiah under price × 1.15 is KETAT",
      "input": { "capacity": 1149999, "price": 1000000, "buffer": 1.15 },
      "expected": { "status": "KETAT", "capacityAfter": 149999 }
    }
  ]
}
```

- **One file per domain function**, named after it (`afford-one-off.json`).
  `function` is the name both languages export.
- **`input` is the function's parameters as one object of plain JSON.**
  Money is in whole rupiah (BR-18), dates are `YYYY-MM-DD`, and date-times are
  ISO 8601 with an offset (BR-04). `now`, the timezone and settings are
  inputs like any other.
- **`expected` is the whole result.** A refusal is
  `{ "violations": [{ "field": "amount", "code": "amount_out_of_range" }] }`,
  with the code from `contracts`. Message text is never compared, because
  it belongs to the screens.
- **Each `name` starts with its BR or AC id**, so a failure in either
  language points at the rule.
- **Every threshold gets a case exactly on it and one on each side.**
  Thresholds such as price × 1.15 are where the two languages' rounding
  could part.
- **No case is skipped in one language.** Either language may add tests of
  its own on top.
- **What has cases:** field validation (BR-01 to BR-08), duplicates (BR-07),
  pay cycles (BR-10, BR-11, BR-13) and the base-currency value of other
  currencies (A-11, BR-18), which the phone runs from Stage 9;
  and budget (BR-12, BR-14 to BR-18) and afford (BR-19 to BR-22), which it
  runs once US-23 ships. All of them are written in Stage 4.

`modules/fiscus/contracts/fixtures/` works the same way for the sync format.
It holds sample `sync/push` and `sync/pull` bodies. The zod schemas must
accept each one, and the Dart models must read it and write it back
unchanged. A new field goes into the fixtures first (NFR-25).

## Testing by layer

| Layer | Tests | Runs against |
| --- | --- | --- |
| `domain` | Unit tests, one `describe` per BR or AC id, and the shared cases. This is most of the suite | Nothing |
| `api` | Use cases and HTTP: lifecycles, idempotency, 401, 403, 422, 429 | A real PostgreSQL in CI, with Clock and Mailer faked |
| Sync | The Stage 8 suite: a script client that pulls, pushes, retries, conflicts and expires its cursor | A real PostgreSQL in CI, and the deployed server |
| `web` | Component tests | jsdom |
| Phone `domain` | The shared cases, plus Dart unit tests | Nothing |
| Phone `data` and `sync` | Queue order, the merge, paging and `410 cursor_expired` | An in-memory drift database and a fake server |
| Phone screens | Widget tests | `flutter_test` |
| Repository | Boundary rules | The Nx project graph |

## Adding a module

1. Create `modules/<name>/` with only the packages it needs (see Level 2).
   Give each `package.json` one `scope:<name>` tag and one `type:` tag.
2. Add the folders to `workspaces` in the root `package.json`, then run
   `bun install` and `bunx nx sync`.
3. Give it its own PostgreSQL schema and `migrations/` folder.
4. Register it: its Nest module in `apps/api/src/app.module.ts`, and its web
   package in `apps/fiscus-web`, until the registry (FR-07) does both from
   manifests.
5. Run `bun run boundaries` before pushing.
