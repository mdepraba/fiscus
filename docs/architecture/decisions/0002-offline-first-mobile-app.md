# ADR-0002: An offline-first native app, with sync

**Status:** Accepted (12 Oct 2026)
**Date:** 10 Oct 2026, updated 11 and 12 Oct 2026
**Deciders:** @Praba (owner)

> **Update, 11 Oct 2026.** The owner chose Flutter (Q-07), and the code and
> the database are being designed anew, so the sync columns and tombstones go
> into the new schema design. Decisions 6 and 9, the trade-off analysis and the action items are
> updated. The Expo and Flutter comparison stays as the record of what was
> weighed. Later the same day the owner answered Q-01: the server and the
> web app stay TypeScript, so the rules are kept equal by shared test cases.

> **Update, 12 Oct 2026.** Amended for Q-08: there is no PWA, so decision 8
> is rewritten and action 6 is dropped. The owner then accepted this ADR,
> with these choices:
>
> - Offline budgets and afford checks are a Should story (US-23), added to
>   decision 6.
> - The first builds are Android only, and Q-06 waits for an iOS build.
> - The app's code lives in this repo, and it draws the existing phone
>   design (decision 9).
> - The device's token also gets a new `fiscus:settings` scope (decision 7),
>   and the session-only screens stay in the web app (decision 6).
>
> The Context section still describes the design as it was on 10 Oct.

## Context

The owner plans a native phone app for Fiscus that works **offline-first
with full read and write**. It would read and change the whole ledger
without a connection, then sync when the server is reachable again. The
client is Flutter (Q-07, answered 11 Oct 2026).

The current design stops well short of that:

- **The phone app is a PWA** (FR-14, NFR-17). The
  [phone design](../../design/mobile/README.md) draws the web app on a phone.
- **Offline is quick entry only** (FR-19, AC-08.3, NFR-16). New entries
  queue on the device with a client UUIDv7 and are sent once, with that id as
  the `Idempotency-Key`, when the connection returns (BG-07). Every other
  screen is read-only as loaded.
- **The device keeps no copy of the data.** The v1 database design says so.
  Data only goes up. Nothing tells a device what changed on
  the server.

Several pieces of the v1 design already suit sync:

| Already there | Why it helps |
| --- | --- |
| UUIDv7 ids, which a client may supply | A device creates rows offline without clashing (EC-01, EC-02) |
| `Idempotency-Key` handling in core (BR-09) | A retried push does not create a second row |
| `version` with `fiscus.touch_row()` (EC-04) | A stale write is detected, not lost |
| `deleted_at` as the only soft delete | Trash and restore travel as ordinary row changes |
| `transaction_revisions` | Gives the owner the history behind a conflict |
| The budget rules are pure functions (`@fiscus/domain`) | They port cleanly to Dart for the phone |

Constraints:

- The host has 1 vCPU and 1 GB, and the server's RSS must stay at or below
  180 MB (NFR-01). A second server process or sync service does not fit.
- The API listens only on the tailnet (FR-01). The phone syncs only while
  Tailscale is connected.
- There is one maintainer. Every rule implemented twice is a rule that can
  drift.
- The ledger is planned for 50,000 transactions (EC-22). That is a few tens
  of MB on a phone, so a full replica is affordable.

The new schema is not designed yet, so the columns the sync needs go in from
the start instead of as a backfill.

## Decision

1. **The server stays the source of truth.** The phone keeps a full replica
   of the fiscus data in SQLite. Every write is checked again on the server
   by the same domain rules (BR-03 and the rest), with history and audit as
   today.
2. **Push: an outbox of mutations.** Each change made on the device is
   queued as a mutation `{ mutationId, entity, op, id, baseVersion, changes }`,
   where `mutationId` is a UUIDv7. `POST /api/v1/fiscus/sync/push` takes up
   to 100 of them, in order (`MAX_BATCH`). It applies each one through the
   same services the REST endpoints use, with `mutationId` as its idempotency
   key, and returns one result per mutation:
   - **applied**, with the new version
   - **conflict**, with the server's row
   - **rejected**, with a violation code
3. **Pull: a change feed with a safe cursor.**
   `GET /api/v1/fiscus/sync/pull?cursor=…` returns every synced row changed
   since the cursor, a page at a time, plus the tombstones of deleted rows.
   - **The cursor is a transaction id, not a time.** Each synced table gets
     `sync_txid xid8 NOT NULL DEFAULT pg_current_xact_id()`, and
     `touch_row()` sets it again on every update.
   - **A pull returns only rows below a watermark.** The watermark is
     `pg_snapshot_xmin(pg_current_snapshot())`, the oldest transaction still
     running. The rows returned are those with `cursor <= sync_txid < watermark`,
     and the next cursor is the watermark.
   - **So a slow transaction cannot be skipped.** If it commits after a
     newer one, its rows are still at or above the old watermark. An
     `updated_at` cursor would miss them.
   - **Rows can arrive twice.** The device upserts by id and version, so a
     repeat changes nothing.
4. **Physical deletes leave tombstones.**
   - `fiscus.sync_tombstones (table_name, row_id, sync_txid)` is filled by
     an `AFTER DELETE` trigger. In practice that is the 30-day purge of
     trashed transactions (BR-26).
   - Link tables travel inside their parent's record: a transaction carries
     its tag ids, and a budget item its category and account ids. Changing a
     link bumps the parent's `sync_txid`.
   - Tombstones are kept for 90 days. A cursor older than the oldest
     tombstone gets `410 cursor_expired`, and the device downloads
     everything again.
5. **Conflicts are merged on the device. The server stays strict.**
   - The server keeps its optimistic lock unchanged (EC-04).
   - For each pending update the device keeps the row as it was before the
     edit (the base). On `version_conflict` it pulls, then merges field by
     field.
   - Fields only the device changed are re-sent on the new version.
   - A field both sides changed to different values goes to the owner as
     "Changed elsewhere. Review both versions." That is the EC-04 screen,
     drawn for the phone.
   - An edit to a row trashed elsewhere fails with `transaction_trashed`.
     The device offers Restore and apply, or Discard.
   - A rejected mutation, and any queued mutation that depends on it, stays
     in "Couldn't sync" with Edit and Discard, as BG-07 already does.
6. **What works offline.**
   - **Offline:** every read, and every create, edit, trash, restore and
     confirm (including Confirm all) on transactions, accounts, categories,
     tags, budget items, recurring and categorisation rules, and templates.
   - **Budgets and afford checks offline:** the device computes them from
     its replica, in Dart, with the same rules the server uses (FR-27,
     BR-14, A-08). The server stays TypeScript (Q-01), so the two are
     separate implementations, kept equal by shared test cases: JSON cases
     run by both the TypeScript tests and the Dart tests.
   - **Offline budgets are a Should** (US-23, 12 Oct 2026). Until they ship,
     Budget and the afford check on the phone are online only, with the
     figures from the API. Field validation, duplicates, pay cycles and
     the base-currency value of other currencies (A-11) run in Dart from the
     start. Offline writes need the first two, the ledger's period headers
     need the cycles, including imported history (FD-14, FD-28), and its
     totals and balances need the currency values.
   - **Online only:** "Trash all from this token since a date", the budget
     settings (payday, buffers, income and holidays; payday and holidays
     change cycle boundaries), currencies and their rates (a rate changes
     every base-currency figure), and the cycle rollover. The rollover's
     recurring rows reach the device on its next pull.
   - **In the web app only:** imports, the full export, tokens and
     sessions, Empty trash and the System page. Only a signed-in session
     may use them (PRD 2.2), and the device holds a token, so the app opens
     them in the browser (12 Oct 2026).
7. **The device signs in with its own token, made by pairing.**
   - A paired device holds a core API token with `fiscus:read`,
     `fiscus:write` and `fiscus:settings`, named after the device and kept
     in the phone's secure store. `fiscus:settings` was added on 12 Oct 2026
     for the master data, budget items, rules and budget settings, which
     `fiscus:write` does not cover (PRD 2.2). A script gets it only if the
     owner ticks it.
   - A pairing code works once and for 10 minutes (BR-37).
   - Pairing works like this: the web app shows a one-time code as a QR
     code, and the phone exchanges it for the token. The token shows up in
     Settings › Tokens and can be revoked like any other.
   - The local database is encrypted at rest, and the app can be locked with
     biometrics.
8. **There is no PWA** (Q-08, 11 Oct 2026).
   - On a phone, the web app runs in the browser with its phone layout, and
     only while online. It keeps no queue and no replica, because browsers
     may clear their storage (Safari especially).
   - The Flutter app is the only offline client. It writes through
     `sync/push`. The web app and scripts write through the REST endpoints,
     and both paths apply the same services.
9. **The client is Flutter** (the owner's choice, 11 Oct 2026, Q-07).
   - It talks to the server only through the sync and REST endpoints. The
     server and the web app stay TypeScript (Q-01, answered 11 Oct 2026).
   - Its code lives in this repo, in `apps/fiscus-mobile/`, as an Nx project
     that runs Flutter's own test and analyze. The shared test cases are
     JSON files in `modules/fiscus/domain/cases/`, read by both test suites,
     so a rule change and its cases land in one commit (12 Oct 2026).
   - It draws the [phone design](../../design/mobile/README.md), with the
     same tokens, on Android and iOS. Only its native screens are new:
     pairing, the sync status, "Couldn't sync", the conflict screen and the
     lock (12 Oct 2026).
   - The first builds are Android only. An iOS build waits for Q-06.

## Options considered

### Sync approach

#### Option A: Keep the outbox only (today's design)

| Dimension | Assessment |
| --- | --- |
| Complexity | Low |
| Offline reads | Only what was loaded |
| Offline edits | None; only new entries |
| Fit with the owner's goal | Does not meet it |

#### Option B: A full replica with our own push and pull (chosen)

| Dimension | Assessment |
| --- | --- |
| Complexity | Medium: two endpoints, a cursor column, a tombstone table, and merging on the device |
| Host cost | No new process. Pull streams pages of about 1,000 rows, so memory stays flat |
| Correctness | The same domain rules on server and device. The `xid8` watermark cannot skip a commit |
| Lock-in | None. The protocol is plain HTTP plus SQLite |

**Pros:** it fits the 1 GB host, keeps one source of truth, and reuses the
idempotency, versioning and history that are already designed.

**Cons:** merge code on the device, and a sync test suite to maintain.

#### Option C: A third-party sync engine

Examples: PowerSync, ElectricSQL, Zero.

| Dimension | Assessment |
| --- | --- |
| Complexity | Low on the client, high on the host |
| Host cost | A separate service that reads PostgreSQL logical replication, and some keep their own storage. It does not fit beside the server in 180 MB (NFR-01) |
| Writes | Most still send writes through our own API, so the server work in Option B remains |

**Pros:** the client sync is written and tested by someone else.

**Cons:** memory the host does not have, a second deploy unit, and a
dependency in the most important data path.

### Client framework (Q-07)

#### Expo, React Native (recommended at first)

| Dimension | Assessment |
| --- | --- |
| Shared code | Imports `@fiscus/contracts` (zod/mini) and `@fiscus/domain` as they are. Budgets, afford checks, cycles and validation are written once |
| Fit with the repo | TypeScript, Bun workspaces and the existing boundary rules. React skills carry over from `fiscus-web` |
| Motion | Reanimated and Gesture Handler give the springs and 1:1 gestures that the [phone design](../../design/mobile/README.md) asks for |
| Risks | Metro must resolve the `.js` suffixes that nodenext projects use on relative imports. Monorepo setup with Bun also needs checking. Both are for the spike |

#### Flutter (chosen)

| Dimension | Assessment |
| --- | --- |
| Shared code | None. Contracts would come from an OpenAPI or JSON Schema export, and every domain rule (BR-14, BR-19 to BR-22, cycles, duplicates) would be rewritten in Dart |
| Drift control | Needs shared test vectors: JSON cases run by both Vitest and Dart tests |
| Strengths | Steady rendering and its own widget set, independent of the platform |
| Fit with the repo | A second language and toolchain for one maintainer |

Expo was recommended because the hard part of offline-first is running the
same rules in two places. With Expo they are the same files. With Flutter
they are two implementations that must be kept equal by hand, unless the
server is written in Dart too.

The owner chose Flutter on 11 Oct 2026. The rules are then written in Dart
for the phone. The server stays TypeScript (Q-01), so it keeps its own copy,
checked against shared test cases.

## Trade-off analysis

The real cost is not the endpoints. It is that the device now decides
things: it computes budgets, applies rules and merges edits. That is only
safe if the device and the server apply the same rules. With Flutter on the
device and a TypeScript server (Q-01), that means two implementations held
equal by shared test cases.

The server keeps its strict optimistic lock, so a device bug can never
silently overwrite a newer edit. The worst case is a conflict the owner has
to resolve.

The cursor is the part that is easy to get wrong. A timestamp or a plain
sequence is assigned when a row is written, not when it commits. A slow
transaction can then commit behind a cursor that has already moved past it,
and its rows are never pulled. The `xid8` watermark trades a short delay
(rows wait until older transactions finish) for never losing a row.

## Consequences

**Easier**

- Using Fiscus with no signal, or with Tailscale off, then catching up.
- Every offline write goes through one push path that has idempotency built
  in, and it applies the same services as REST.

**Harder**

- Every synced table carries `sync_txid` and a trigger, and every physical
  delete needs a tombstone or a parent bump.
- A schema change is a change to the sync format. Old app builds must keep
  working, so the pull response is versioned and fields are only added.
- A second client to build and ship beside the web app. It reuses the web
  app's phone design.
- The server stays TypeScript (Q-01), so the rules exist twice, in Dart and
  TypeScript, and need shared test cases to stay equal.
- iOS installs need a paid Apple Developer account, or a rebuild every 7
  days (Q-06). The first builds are Android only.
- The full ledger sits on the phone. A lost phone means revoking its token,
  and the local database must be encrypted.

**Revisit when**

- A second user arrives. Merging per field would then need per-user rules.
- Sync needs to work outside the tailnet. That needs a public sync endpoint,
  with the risk the ingest endpoint was designed to avoid.

## Action items

1. [x] Owner: accept or change this ADR. Accepted 12 Oct 2026. Q-07 and
       Q-01 are answered: Flutter for the phone, TypeScript for the server
       and the web app. Q-06 (iOS distribution) waits, because the first
       builds are Android only.
2. [x] In the new schema design: give every synced table `sync_txid` and
       the touch trigger, add `sync_tombstones` with its delete triggers,
       and index `sync_txid` on each synced table. Done in the
       [database design](../../database/README.md#sync), 11 Oct 2026.
3. [ ] Specify `sync/push` and `sync/pull` in the new API requirements:
       entity list, page size, response versioning, `410 cursor_expired`.
4. [ ] Core: device pairing (a one-time code to a named token), and a test
       that the token works in the push and pull endpoints.
5. [ ] Spike: a Flutter app that keeps an encrypted SQLite replica and runs
       the budget rules against shared test cases.
6. ~~Move the PWA quick-entry queue (FR-19) onto `sync/push`.~~ Dropped
   11 Oct 2026: there is no PWA (Q-08).
7. [x] Add the Flutter app's packages (SQLite, secure storage) to the
       [tech stack](../tech-stack.md) as *Proposed*. Flutter itself is
       there already. Done 12 Oct 2026; the owner signs them off in Stage 9,
       after the spike (action 5).
8. [x] PRD: user stories and FRs for the native app, offline use and
       installing restated for it, and the phase it belongs to. Done in
       PRD v1.1, 12 Oct 2026: [US-19 to US-24](../../user-story/phone-app.md),
       FR-34 to FR-44, and Phase 3.
