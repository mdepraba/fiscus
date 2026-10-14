# Tech stack

What Fiscus runs on and builds with, and why. The server and the web app are
TypeScript (Q-01), and the phone app is Flutter (Q-07,
[ADR-0002](decisions/0002-offline-first-mobile-app.md)). The projects are
scaffolded (Stage 1), with Nest and Fastify in `apps/api`, React and Vite in
`apps/fiscus-web`, and the test and build tooling installed. Every other row
waits for the work item that first needs it, which runs `bun add`, or
`flutter pub add` for the phone app. Every row has a status:

- **Chosen**: picked for the design, with its version pinned.
- **PRD**: named by the [PRD](../prd) but not installed yet.
- **Proposed**: this doc's pick for a slot nothing else has decided. Get the
  owner's sign-off before `bun add`.
- **Accepted**: signed off by the owner, with its cost measured (see
  [Measured cost](#measured-cost)). The task that first needs it pins the
  version.

How the pieces fit together is in [the architecture guide](README.md).

## How a library gets picked

- **Use platform built-ins first.** Bun, Web Crypto, `Intl` and PostgreSQL 18
  already cover hashing, random values, ids, dates and money formatting.
- **One library per job.** When two candidates overlap, keep one.
- **Weigh server dependencies against memory.** The RSS target is 180 MB
  (NFR-01), and anything loaded at startup holds memory for the life of the
  process.
- **Weigh shell dependencies against size.** The app's first load must stay
  at or under 200 KB gzipped (NFR-22). `reportCompressedSize` in the web
  runner's `vite.config.mts` prints sizes on every build. A library that only
  one module needs goes in that module's chunk.
- **Avoid runtime CSS-in-JS and third-party origins.** The CSP is
  `default-src 'self'` (NFR-09), so Fiscus builds and serves its own styles
  and fonts. The phone app bundles its fonts too, and fetches nothing but
  Fiscus's own API.
- **Prefer the Dart and Flutter teams' packages on the phone.** Each extra
  package is code that one maintainer must keep current across Flutter
  releases.
- **Put Bun-only APIs behind a core port.** Vitest runs on Node, so tests
  cannot call `Bun.password` or other Bun-only APIs. They are handled like the
  clock and the mailer.

## Runtime and language

| Technology | Status | Used for | Why |
| --- | --- | --- | --- |
| Bun 1.4.2 | Chosen | Running the API (`bun --smol`), installing packages, workspace scripts | Low idle memory. It was Apion's runtime, so the deploy carries over (PRD 1.1). `packageManager` in the root `package.json` pins the version for development, CI and the host |
| Node 24 | Chosen | Running Nx, Vite, Vitest and esbuild | The build tools expect Node. Only CI and development machines need it, because the host never builds (NFR-20) |
| TypeScript ~6.0 | Chosen | Every project, in `strict` mode | There are two setups: `nodenext` for server and shared code, `bundler` for web code |

## Server

| Technology | Status | Used for | Why |
| --- | --- | --- | --- |
| NestJS 12.1 (`common`, `core`, `platform-fastify`) | Chosen | Modules, DI, guards, interceptors, pipes, filters | Apion's stack (PRD 5.1). DI gives ports their seams without an extra library |
| Fastify 5.12 | Chosen | HTTP under Nest | Lighter than Express. The body cap is set in `apps/api/src/main.ts` (NFR-05) |
| reflect-metadata, rxjs | Chosen | Nest peer dependencies | Nest requires them. Module code uses `async`/`await`, not rxjs |
| `@fastify/multipart` | Proposed | Uploads: the Money Manager TSV | Streams files to disk, so no request holds a 10 MB file in memory (NFR-05, BR-27) |
| `@fastify/static` | Accepted | Serving the built SPA from the API, at `/` | Keeps one origin in production, as `vite.config.mts` assumes. CSP and security headers come from one core hook (NFR-09) |
| `@nestjs/throttler` | Accepted | Rate limits | In-memory storage is enough for one process. Limits are keyed by token id (BR-31, NFR-14) |
| Nest `ConsoleLogger` with `json: true` | Accepted | Logs to stdout, collected by journald | Needs no new dependency. journald keeps 14 days of logs (NFR-11) |

## Data

| Technology | Status | Used for | Why |
| --- | --- | --- | --- |
| PostgreSQL 18 | PRD | All module data (one schema per module) and the job tables | Listens on localhost only, with 160 MB shared buffers (PRD 5.1, 5.3) |
| Drizzle ORM 0.45 | Chosen | Schemas, queries and transactions in each module's `api` | Typed SQL with no separate engine. `pgSchema()` gives each module its own schema |
| `pg` (node-postgres) 8.23 | Chosen | The driver under both Drizzle and pg-boss | pg-boss v12 already depends on it, so one driver and the PRD's single pool of 5 serve both. pg-boss can create jobs inside an existing Drizzle transaction, which the guide's "enqueue on the same transaction" rule needs |
| pg-boss | Accepted | Schedules, retries and durable follow-up work | Jobs live in PostgreSQL, so no Redis or broker is needed. Jobs get 3 attempts with backoff (PRD 5.1). It supports Bun |
| `drizzle-kit` 0.31 | Chosen, dev only | Generating SQL migrations into each module's `migrations/` folder (`bunx nx run @fiscus/api:db-generate`) | Migrations stay reviewable SQL files. `libs/db` applies them on deploy (FR-07), and the host never installs `drizzle-kit` |
| `uuidv7()` | Proposed | Default primary keys | Built into PostgreSQL 18. Ids are time-ordered, need no library, and come from the database, so `domain` never needs randomness |

## Contracts and validation

| Technology | Status | Used for | Why |
| --- | --- | --- | --- |
| Zod 4.6 via `zod/mini` | Chosen | Request, response and event schemas in each module's `contracts` | One schema validates in both the browser and the server, and the types come from it. `zod/mini` tree-shakes, so the browser pays only for the checks it uses. A core Nest pipe turns failures into the rule-violation shape (400 or 422, AC-12.2) |

Schemas check **shape**: types, lengths, formats and ranges. Rules that need
context, such as whether an account exists (BR-03) or a record is a possible
duplicate (BR-07), stay in `domain`.

## Auth and security

| Technology | Status | Used for | Why |
| --- | --- | --- | --- |
| `@simplewebauthn/server` and `@simplewebauthn/browser` | Accepted | Passkey registration and sign-in (FR-02) | A focused, maintained WebAuthn library. The browser half loads only with the sign-in screen |
| `otpauth` | Accepted | TOTP codes and the enrolment URI (FR-02) | Small, with no dependencies |
| argon2id via `Bun.password` | Proposed | Passwords and recovery codes (FR-02, FR-04) | Built into Bun, with no native module. **Set `memoryCost: 19456` (19 MiB) and `timeCost: 2`**, the OWASP minimum. Bun's default of 64 MiB per hash is about a third of the RSS budget. It sits behind a `PasswordHasher` port because Vitest runs on Node |
| Web Crypto | Proposed | API token values: 32 bytes from `crypto.getRandomValues`, stored as SHA-256 (BR-28, NFR-10) | Built in. A fast hash is safe for 256-bit random values; slow hashing is only needed for secrets a person could guess |

## Web

| Technology | Status | Used for | Why |
| --- | --- | --- | --- |
| React 19.3 | Chosen | The app's shell and every module's screens | Apion's stack (PRD 5.1) |
| Vite 8.3 and `@vitejs/plugin-react` 6 | Chosen | The app's dev server with its API proxy, its production build and per-module chunks | Lazy imports split each module into its own chunk (NFR-22) |
| TanStack Router | Accepted | Routes for the app's shell and its modules | Code-based routes let the registry (FR-07) add each module's routes from its manifest, lazily loaded. Typed search params suit the Fiscus filters (FR-24). `@tanstack/` is already in the boundary rules' framework list |
| TanStack Query | Accepted | Server state: fetching and caching | Saves writing a cache by hand |
| CSS Modules and CSS custom properties | Accepted | Styling in `libs/ui` and module screens | Built into Vite, with no runtime, and safe under the CSP (NFR-09). Custom properties carry the light and dark themes (NFR-18) |
| UI primitives | Proposed: none yet | Dialogs, the command palette, menus | Build them in `libs/ui` first. Adopt a headless library only for a component that proves hard to make accessible (NFR-18) |

## Phone app

The app lives in `apps/fiscus-mobile/` ([architecture guide](README.md#the-phone-app)).
Its packages are signed off in Stage 9, after the spike in ADR-0002 action 5
runs drift with SQLCipher and the shared cases on your phone. That work item
pins their versions in `pubspec.yaml`.

| Technology | Status | Used for | Why |
| --- | --- | --- | --- |
| Flutter and Dart, stable channel | PRD | The native, offline-first app ([ADR-0002](decisions/0002-offline-first-mobile-app.md), A-14), Android first (Q-06) | The owner's choice over Expo, 11 Oct 2026 (Q-07). The server stays TypeScript (Q-01), so shared test cases keep the two sets of rules equal. The version is pinned once, in `pubspec.yaml`, and the CI job reads it from there |
| `drift`, on SQLCipher | Proposed | The encrypted copy of the data: tables, queries, migrations, and query streams that redraw screens (FR-35, NFR-23) | Typed SQL with generated code, like Drizzle on the server. SQLCipher encrypts the whole database file. Drift's row classes read the pulled JSON as is |
| `drift_dev` and `build_runner` | Proposed, dev only | Generating drift's code | Drift needs them. They never ship in the app |
| `flutter_secure_storage` | Proposed | The paired token and the database key (FR-34, NFR-23) | Backed by the Android Keystore, and by the iOS Keychain if an iOS build comes |
| `mobile_scanner` | Proposed | Scanning the pairing QR code (FR-34) | Decodes on the phone, so the code never leaves it |
| `http` | Proposed | Push, pull, pairing and the calls that need a connection | The Dart team's client. Retries and the queue are our own code, so a larger client such as `dio` adds nothing needed |
| `uuid` | Proposed | UUIDv7 ids for new rows and mutations (FR-19, EC-01) | Supports v7. Ids are made in the shell, never in `domain` |
| `intl` | Proposed | "Rp 25.000" and "29 Sep 2026" (NFR-19) | The Dart team's formatting package. Dart has no built-in `Intl` as browsers do |
| `go_router` | Proposed | The tabs and pushed screens of the phone design | The Flutter team's router. Each tab keeps its own stack |
| `local_auth` | Proposed, Should | The biometric lock (FR-44, US-24) | The Flutter team's package for fingerprint, face and PIN |
| State management | Proposed: none yet | Screen state | Drift's query streams and Flutter's own `ChangeNotifier` first. Adopt a library only if they prove too little, as with the web's UI primitives |
| Geist and Geist Mono, bundled | Proposed | The phone design's fonts | Shipped as app assets. `google_fonts` would fetch them at runtime from a third party |
| Own tokens script in `tools/` | Proposed | Dart theme constants generated from `docs/design/web/tokens.json` | The web and the phone keep one source for colours, type and spacing |
| `flutter_lints`, `flutter analyze`, `flutter test` and `dart format` | Proposed, dev only | The phone app's lints, tests and formatting | The Flutter team's defaults. Biome does not read Dart, so Nx runs these through the app's `project.json` |

## Module-only libraries

These load in their module's chunk or process, never in the app's shell.

| Module | Technology | Status | Used for | Why |
| --- | --- | --- | --- | --- |
| Fiscus | Own TSV parser in `domain` | Proposed | The Money Manager import (FR-15) | Eight fixed columns, and errors must name the line (AC-07.4) |
| Fiscus | `Intl` | Proposed | Amounts as "Rp 25.000" through `Intl.NumberFormat('id-ID', …)`, plus dates and timezones (NFR-19, BR-04, BR-34) | No date or money library is needed. Amounts stay integers (BR-18), and calendar dates in `domain` are `YYYY-MM-DD` strings |
| Core | `fflate` | Accepted | The full export ZIP (FR-12) | Small and fast, and streams to disk (NFR-05) |
| Core | `nodemailer` | Accepted | Alert email (PRD 5.2) through the SMTP relay (Q-04) | Sits behind the `Mailer` port. The adapter imports it lazily, because alerts are rare and it need not sit in memory |

## Tooling and quality

| Technology | Status | Used for | Why |
| --- | --- | --- | --- |
| Nx 23.2 | Chosen | The project graph, `affected`, caching, and `nx sync` for TypeScript references | A one-module change finishes CI in 5 minutes or less (NFR-21) |
| esbuild 0.28 and SWC 1.15 | Chosen | Bundling `apps/api` | SWC runs first, because esbuild does not emit the decorator metadata Nest DI needs (`tools/esbuild/swc-decorator-metadata.cjs`). Pinned to 1.15.8 on 15 Oct 2026: SWC 1.16 copies its native binary into a cache folder and refuses to load when that folder's parents grant write access to other accounts, as `%LOCALAPPDATA%` and `E:\` do on the development machine. Revisit when SWC relaxes the check |
| Vitest 4.1, jsdom 30 and `@vitest/coverage-v8` | Chosen | Every project's tests | One runner for server, shared and web code |
| Biome 2.5.15 | Chosen | Linting and formatting | One fast tool for both |
| `tools/boundaries` | Chosen | Module rules over the Nx graph | Biome has no boundary rule |
| `tools/secrets` | Chosen | Rejecting env files and hard-coded secrets in tracked files | NFR-10 |
| Husky 9 and commitlint 21 | Chosen | Conventional Commits, plus the secrets scan before each commit | Catches problems before they reach CI |
| GitHub Actions | Chosen | CI, which builds every artifact | The host never builds (NFR-20) |
| `subosito/flutter-action` in a `phone` CI job | Proposed | Installing Flutter, running the phone app's checks, and building the signed APK | The job runs only when Nx reports the phone app affected, so a server-only change keeps within NFR-21 ([architecture guide](README.md#the-phone-app)) |
| Fastify's `app.inject()` | Chosen | API tests over HTTP without opening a socket | Built into Fastify, so neither supertest nor `@nestjs/testing` is needed yet. Vitest's transform keeps decorator metadata, so Nest injects by type in tests just as it does in the SWC-built bundle |
| Docker Compose with `postgres:18` | Chosen | The development and test database (`compose.yaml`) | The same major version as production, with no install on the dev machine. Production never runs Docker |
| PostgreSQL 18 service in CI | Chosen | Database and `api` integration tests | Tests run on the same database as production, each in a throwaway database from `@core/db/testing`. Clock and Mailer are faked |

## Infrastructure and operations

| Technology | Status | Used for | Why |
| --- | --- | --- | --- |
| VPS: 1 vCPU / 1 GB, LXC | PRD | Hosting everything | Docker does not start on this host (PRD 1.3) |
| systemd | Chosen | The Fiscus unit (MemoryHigh 224 MB, MemoryMax 256 MB) and its migration oneshot, in `deploy/` | NFR-01 |
| Tailscale (`tailscale serve`) | PRD | HTTPS to `127.0.0.1` for the owner, local clients and the phone app | FR-01. The app has no public surface. The phone syncs only while Tailscale is on (A-15) |
| A signed APK from CI, installed by hand | Proposed | Getting the phone app onto your Android phone | One user needs no store listing. The signing key is a CI secret (NFR-10). iOS waits for Q-06 |
| Caddy | PRD | A public reverse proxy for `POST /ingest/v1/transactions` only | FR-26. The domain is still open (Q-02) |
| restic to Backblaze B2 | PRD | Nightly encrypted backups (FR-09) and the monthly restore test (FR-11) | A-06 |
| SMTP relay | PRD | Alert email | Which relay to use is still open (Q-04) |
| journald | PRD | Logs, kept 14 days | NFR-11 |
| `EnvironmentFile=/srv/fiscus/.env` | Chosen | Loading secrets into the systemd unit | The file has mode 0600 (NFR-10). No dotenv library is needed: `loadConfig` in `libs/api` and `readDatabaseUrl` in `libs/db` are the only readers of `process.env`, and in development Bun loads the repo's `.env` |

## Measured cost

The owner signed off the foundations and Phase 1 libraries on 4 Oct 2026,
after these measurements. Phase 2 measures its own libraries in Stage 4 of
the [implementation plan](../implementation-plan.md).

**Server RSS.** Each library is imported in its own `bun --smol` process
(Bun 1.4.2, `oven/bun` Linux container), its main object is built (a
`pg.Pool`, a Drizzle client, a `PgBoss` instance, a transport), and RSS is
read after three forced GCs, as the median of 5 runs. A library measured
alone also pays the first-load cost that any module triggers in a fresh
process, so the single figures are upper bounds; the combined rows are the
ones that count against NFR-01.

| Library | Version | RSS added |
| --- | --- | --- |
| Bare `bun --smol` | 1.4.2 | 16.5 MB total |
| Nest, Fastify and `platform-fastify` (a bare API) | 12.1.2, 5.12.5 | +41.2 MB, 57.6 MB total |
| `pg` | 8.23.1 | +11.0 MB alone |
| Drizzle ORM, over `pg` | 0.45.3 | +3.8 MB |
| pg-boss, over `pg` | 12.36.0 | +14.2 MB |
| `@simplewebauthn/server` | 14.0.3 | +24.3 MB alone |
| `otpauth` | 9.5.2 | +7.6 MB alone |
| `nodemailer` (imported lazily, so 0 at idle) | 10.0.14 | +23.1 MB alone |
| `fflate` (export only, so 0 at idle) | 0.8.3 | +13.6 MB alone |
| `@nestjs/throttler`, over Nest | 6.7.1 | +0.6 MB |
| `@fastify/static`, over Fastify | 10.1.5 | +7.3 MB |
| **All startup libraries together**, over Nest | | **+28.9 MB, 86.8 MB total** |
| Everything above, nodemailer and fflate included | | +33.2 MB, 90.5 MB total |

That leaves about 90 MB of the 180 MB target (NFR-01) for Fiscus's own code,
caches and requests. Re-measure on the host in Stage 1.

**Browser size.** A minified esbuild bundle of the imports a screen really
uses, with React external, gzipped. Vite's `reportCompressedSize` gives the
real figure on every build.

| Library | Version | Loaded by | gzip |
| --- | --- | --- | --- |
| React and React DOM, for scale | 19.3.0 | The app's shell | 67.7 KB |
| TanStack Router | 1.170.41 | The app's shell | 27.8 KB |
| TanStack Query | 5.104.1 | The app's shell | 10.2 KB |
| `zod/mini`, one transaction schema | 4.6.5 | The app's shell, and modules | 6.7 KB |
| `@simplewebauthn/browser` | 14.0.0 | Sign-in chunk | 2.8 KB |
| CSS Modules, Nest `ConsoleLogger` | | | No runtime code |

The shell libraries come to about 112 KB of the 200 KB budget (NFR-22).
`drizzle-kit` (0.31.11, 10 MB unpacked) is a dev dependency, so the host
never installs it.

## Deliberately not used

| Not used | Why |
| --- | --- |
| Docker in production | It does not start on the LXC host (PRD 1.3) |
| Redis or a message broker | There is one process: rate limits fit in memory, and pg-boss keeps jobs in PostgreSQL |
| Microservices | Out of scope (PRD 1.3). A module moves out only on the PRD 5.4 triggers |
| Express | Fastify is lighter and is already the Nest adapter |
| Prisma | The PRD chose Drizzle, which needs no separate engine and stays close to SQL |
| postgres.js or `Bun.sql` | Either would add a second driver and pool next to pg-boss's `pg` |
| class-validator and class-transformer | Decorator DTOs cannot live in framework-free `contracts`, and they cannot be shared with the browser |
| ESLint and Prettier | Biome does both |
| Jest | Vitest is already wired into Nx and Vite |
| Runtime CSS-in-JS | Its injected `<style>` tags break the CSP (NFR-09) |
| Moment, date-fns or Luxon | `Intl` covers formatting and timezones |
| Third-party analytics, fonts or CDNs | NFR-09 |
| A PWA: `vite-plugin-pwa`, a service worker, `idb-keyval` | No PWA (Q-08). The phone app covers offline use, and a browser may clear its storage. Both were Proposed until 12 Oct 2026 |
| A third-party sync engine, such as PowerSync or ElectricSQL | It needs a second service on the host that does not fit in memory (ADR-0002, option C) |
| Sharing code between the server and the phone app | They are TypeScript and Dart. Shared JSON test cases keep their rules equal instead (Q-01) |

## Follow-ups

1. **Add `pg` to the boundary rules** (done, Stage 1). `pg` is in
   `FRAMEWORK_PACKAGES` and `SERVER_PACKAGES` in
   `tools/boundaries/rules.mjs`, and `nodemailer`, `@simplewebauthn/server`
   and `drizzle-kit` are in `SERVER_PACKAGES`. Add every new server-only
   package there in the commit that installs it.
2. **Pin the Bun version** (done). `"packageManager": "bun@1.4.2"` in the
   root `package.json` is the one place the version is written. CI reads it
   through `bun-version-file`, the host runbook installs the same version,
   and the deploy fails if the host's Bun differs.
3. **Check the budget before adopting a Proposed row.** Measure the gzipped
   size for web code or the RSS cost for server code, then update the row's
   status here. Done for the foundations and Phase 1 libraries on 4 Oct 2026 (see
   [Measured cost](#measured-cost)); `@fastify/multipart` and the
   module-only libraries wait for Stage 4.
4. **Sign off the phone app's packages after the spike** (Stage 9,
   ADR-0002 action 5). The spike checks that drift with SQLCipher builds and
   opens on your phone, and that the shared cases run in Dart. The phone has
   no RSS or bundle budget, so record the APK size and a cold start on your
   phone instead.
