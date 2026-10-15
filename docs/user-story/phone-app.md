# Phone app (Phase 3)

The native Flutter app keeps a full copy of the `fiscus` data on the phone,
works without a connection, and syncs over the tailnet
([ADR-0002](../architecture/decisions/0002-offline-first-mobile-app.md)). The
first builds are Android only (Q-06). Written 12 Oct 2026.

## US-19: Pair my phone

**As the** owner, **I want to** pair the phone app with Fiscus by scanning a code, **so that** the phone gets its own access, which I can revoke. Priority: Must

- **AC-19.1 (happy path)** **Given** I am signed in to the web app and the phone is on my tailnet, **when** I scan the pairing QR code with the app, **then** the app holds a token named after the phone with `fiscus:read`, `fiscus:write` and `fiscus:settings`, kept in the phone's secure store, and the token is listed in Settings › Tokens.
- **AC-19.2 (negative)** **Given** a pairing code that was already used or is more than 10 minutes old, **when** the app sends it, **then** pairing fails and no token is created (BR-37).
- **AC-19.3 (negative)** **Given** I revoke the phone's token in Settings › Tokens, **when** the app next syncs, **then** it gets 401, stops syncing and asks to be paired again, and changes still waiting on the phone are kept.

## US-20: Use the ledger offline

**As the** owner, **I want** the phone app to read and change my ledger with no connection, **so that** I can log and fix entries anywhere, with or without signal or Tailscale. Priority: Must

- **AC-20.1 (happy path)** **Given** the app has synced once, **when** the phone is in airplane mode, **then** Daily, Calendar, Monthly, the accounts with their balances, and each transaction with its history all open from the phone's copy, with pay-cycle periods as on the web (FD-28).
- **AC-20.2 (offline)** **Given** no connection, **when** I create, edit, trash, restore or confirm a transaction, or change an account, category, tag, template, budget item or rule, **then** the change shows on the phone at once, marked "Waiting to sync" (ADR-0002 §6).
- **AC-20.3 (offline)** **Given** no connection, **when** I use quick entry, **then** it works as in US-08, and the time of each save is logged once it syncs (PRD 1.2).
- **AC-20.4 (negative)** **Given** an entry that breaks a field rule, such as a zero amount or a transfer to the same account, **when** I save it offline, **then** it is refused with the message the web app shows, and nothing is queued.
- **AC-20.5 (online only)** **Given** no connection, **when** I change payday, buffers, income, holidays or a currency's rate, or use "Trash all from this token since a date", **then** it says "Needs a connection" and changes nothing. Budget and the afford check behave the same way until US-23 ships (FR-36).
- **AC-20.6 (web only)** **Given** the phone app, **when** I open imports, the export, tokens, Empty trash or the System page, **then** they open in the web app in the phone's browser, because only a signed-in session may use them (PRD 2.2).

## US-21: Sync without losing or doubling anything

**As the** owner, **I want** changes from the phone and from the web to meet without loss, **so that** I can trust what both show. Priority: Must

- **AC-21.1 (happy path)** **Given** changes waiting on the phone, **when** the connection returns, **then** they are sent in the order I made them, and each loses its "Waiting to sync" mark once applied (ADR-0002 §2).
- **AC-21.2 (happy path)** **Given** a transaction added on the web, **when** the phone next syncs, **then** it appears on the phone, and a transaction purged from the trash disappears from it (ADR-0002 §3, §4).
- **AC-21.3 (retry)** **Given** a push whose answer never arrived, **when** the phone sends the same changes again, **then** nothing is saved twice (BR-09).
- **AC-21.4 (negative)** **Given** a change the server refuses, **then** it waits in "Couldn't sync" with the reason, Edit and Discard, and any change that depends on it waits with it (BG-07).
- **AC-21.5 (edge)** **Given** the phone last synced before the oldest deletion the server still keeps (90 days), **when** it syncs, **then** it downloads everything again, and no change still waiting on the phone is lost.

## US-22: Resolve a conflict

**As the** owner, **I want to** choose when the phone and the web changed the same thing, **so that** no edit is silently lost. Priority: Must

- **AC-22.1 (happy path)** **Given** I changed a transaction's note on the phone and its amount on the web, **when** the phone syncs, **then** both changes are kept and nothing is asked.
- **AC-22.2 (conflict)** **Given** I changed the same field to different values on both, **when** the phone syncs, **then** it shows "Changed elsewhere. Review both versions." with both values, and I keep either one (EC-04).
- **AC-22.3 (edge)** **Given** I edited a transaction on the phone that was trashed on the web, **when** the phone syncs, **then** it offers Restore and apply, or Discard (ADR-0002 §5).

## US-23: See my budget offline

**As the** owner, **I want** Budget and the afford check to work on the phone with no connection, **so that** I can decide on a purchase anywhere. Priority: Should

- **AC-23.1 (happy path)** **Given** the phone's copy is up to date, **when** I open Budget or check a price offline, **then** every figure and the AMAN, KETAT or BELUM result equal what the server gives for the same data (FR-28, ADR-0002 §6).
- **AC-23.2 (happy path)** **Given** changes still waiting to sync, **when** I open Budget offline, **then** they are included, as Unreviewed transactions are on the web (A-08, AC-13.3).

## US-24: Lock the app

**As the** owner, **I want** the app to open only after my fingerprint, face or phone PIN, **so that** someone holding my unlocked phone cannot read my finances. Priority: Should

- **AC-24.1 (happy path)** **Given** the lock is on, **when** I open the app, **then** it asks for my fingerprint, face or phone PIN before showing anything.
- **AC-24.2 (negative)** **Given** the check fails or I cancel it, **then** no data is shown.
