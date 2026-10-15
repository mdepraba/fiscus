# ADR-0001: Functional core and imperative shell inside modules, not full hexagonal

**Status:** Accepted (4 Oct 2026)
**Date:** 3 Oct 2026
**Deciders:** @Praba (owner)

## Context

Fiscus's top-level shape is already decided. It is a modular monolith with
one Bun process, one PostgreSQL database and one deploy (PRD 1.1). Each module
is split into `contracts`, `domain`, `api` and `web` (PRD 5.4), and
`bun run boundaries` enforces the rules between them. What is still open is
how code is organised **inside** a module. Hexagonal architecture is the usual
candidate.

The forces at play:

- **One maintainer.** Every layer of indirection is paid for by the same
  person.
- **A small host.** It has 1 vCPU and 1 GB, with Fiscus's RSS at or below
  180 MB (NFR-01), so every runtime dependency and framework has to earn its
  memory.
- **Fixed infrastructure.** The stack is PostgreSQL 18, Drizzle, pg-boss, Nest
  on Fastify, Bun and React. Microservices and high availability are out of
  scope (PRD 1.3). No requirement swaps the database or the framework.
- **The valuable logic is calculation.** That means pay cycles and budget math
  (BR-10 to BR-22), the afford check, the duplicate rule (BR-07),
  categorisation (BR-32) and four state lifecycles (PRD 4.3). It must be
  exactly right, and it can be tested without I/O.
- **Modules differ widely.** The `fiscus` module has dozens of rules. Core
  is plumbing and security.
- **A Nest-specific constraint.** DI tokens must exist at runtime, so a
  TypeScript interface cannot be a token.

## Decision

1. **Keep the modular monolith at the top level.** Modules are bounded
   contexts that own their schema and meet only at `contracts`.
2. **Inside a module, use a functional core with an imperative shell.**
   - `domain` holds pure functions over plain data, with no I/O, clock,
     randomness or framework.
   - `api` is the shell. Each use-case service loads, decides and saves in one
     database transaction. Controllers, job handlers and event handlers are
     thin adapters, and Drizzle is used directly.
3. **Use ports and adapters only at real edges.** That means the clock, mail,
   files, the job queue, the event bus, the backup target and other
   modules. In Nest, ports are abstract classes so that they exist at
   runtime as DI tokens.
4. **Match the structure to the module.** `fiscus` gets all four packages.
   `core` gets no `domain` project until it needs one.

[The architecture guide](../README.md) gives the resulting rules and layout.

## Options considered

### Option A: Full hexagonal (ports and adapters throughout)

Domain entities and an application layer, with inbound ports (one use-case
interface per action) and outbound ports (one repository interface per
aggregate). HTTP, Drizzle and pg-boss become adapters.

| Dimension | Assessment |
| --- | --- |
| Complexity | High |
| Cost per use case | About three extra files: a port, an adapter and a mapper between entity, row and DTO |
| Domain testability | Good, but repository-backed tests still lean on mocks |
| Fit with constraints | Poor. It optimises for swapping infrastructure, which nothing requires |

**Pros:** strict isolation; any adapter can be swapped; seams for tests are
explicit.

**Cons:** most interfaces have exactly one implementation; there are three
representations of the same record and mappers between them; tests that mock
repositories mainly test the mocks.

### Option B: Plain layered (controller → service → Drizzle)

The Nest default. Rules live in services next to their queries.

| Dimension | Assessment |
| --- | --- |
| Complexity | Low |
| Cost per use case | Lowest |
| Domain testability | Poor. Budget math is tangled with queries, so testing it needs a database or mocks |
| Fit with constraints | Fine for `core`, but poor for `fiscus` |

**Pros:** least code; familiar; no new concepts.

**Cons:** the `domain` package would stay empty and the boundary check would
protect nothing. Over time, rules leak into controllers and SQL. A BR change
means hunting through services.

### Option C: Functional core, imperative shell, ports at the edges (chosen)

| Dimension | Assessment |
| --- | --- |
| Complexity | Low to medium |
| Cost per use case | One pure function and one service method, plus a controller or handler |
| Domain testability | Best. Rules are plain function calls with no mocks |
| Fit with constraints | Good. It needs no extra runtime dependency and uses Nest as it is |

**Pros:** BR rules are tested by calling functions. A framework-free domain is
already enforced by `bun run boundaries`. The shell is ordinary Nest code that
reads top to bottom. There are no interfaces with only one implementation.

**Cons:** the shell must load everything a decision needs before it decides.
Two code paths exist, because reads skip the domain. Keeping rules out of
services is a convention that reviews enforce, not tooling.

### Also rejected: DDD tactical patterns with CQRS and event sourcing

Aggregates that emit domain events, separate read models and an event store
exceed what one owner's ledger needs. Transaction history (FR-22) and the audit
log (FR-13) already cover "what changed and when".

## Trade-off analysis

What is worth protecting? Hexagonal protects the domain from **infrastructure
changes**, but the PRD and the host fix Fiscus's infrastructure. What actually
changes is **rules**: new BR values, budget items and edge cases. Pure
functions protect rules from bugs and make them cheap to test, which matters
more here.

Option C keeps the parts of hexagonal that earn their place: dependencies
point inward, the domain stays framework-free, and real external systems sit
behind seams. It drops the parts that cost files without benefit at this
scale: repository ports, use-case interfaces and layer-to-layer mappers.

Option C's main cost is that data is loaded before the decision. For
fiscus, a decision needs at most one cycle's transactions, the open cycle's
configuration and up to three closed-cycle snapshots (BR-20). That is hundreds
of rows, not thousands. Lists and reports, which do touch the whole ledger,
are reads and go straight to SQL with pagination (EC-22, NFR-04).

## Consequences

**Easier**

- Testing every BR and AC rule, quickly and without a database.
- Reading a use case: load, decide, save, all in one method.
- Adding a module with only the packages it needs.
- Moving a module out later. Its coupling is at `contracts`, so its insides
  need no change.

**Harder**

- Keeping rules out of `api` services. Reviews have to watch for it.
- Signatures are explicit. Domain functions take `now`, the timezone and
  settings as arguments.

**Revisit when**

- A module must deploy separately (PRD 5.4). Its query interfaces would then
  get HTTP adapters, and its events would move to pg-boss.
- A domain function seems to need a query mid-calculation. Load more up front
  first. Revisit only if that becomes impractical.
- Core changes show up in most module changes (PRD 5.4).

## Action items

1. [x] Add a boundary rule that `contracts` imports no framework package,
       because contracts reach the browser bundle (Stage 1). Done
       15 Oct 2026, in `tools/boundaries/rules.mjs`.
2. [ ] Phase 1: add the `Clock`, `Mailer` and `FileStore` ports to `libs/api`
       as abstract classes.
3. [ ] Define the rule-violation shape in `contracts`, and a core exception
       filter that maps it to 400 or 422.
4. [x] Add a PostgreSQL service to CI for `api` integration tests
       (Stage 1). Done 15 Oct 2026, in `.github/workflows/ci.yml`.
5. [ ] When FR-07 is built, split each manifest: data in `web/./manifest`,
       and migrations, jobs and settings in `api`.
6. [x] Owner: accept this ADR or amend it. Accepted as written on 4 Oct
       2026.
