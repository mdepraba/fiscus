# Background flows

What happens without a click on these screens: scheduler jobs, API clients, the phone app's sync, and server commands. Each flow ends with what it changes on screen. The actors are those of [PRD 2.1](../../prd/2-actors-and-access-matrix.md).

| ID | Flow | Trigger | Actor | What changes on screen |
| --- | --- | --- | --- | --- |
| BG-01 | Ingest call | A client outside the tailnet posts transactions | Ingest client | New items in Review, and the badge |
| BG-02 | Private API client | A script on a tailnet device | Local client | New and changed transactions, attributed to the token |
| BG-03 | Payday | 00:00 server time on payday | Scheduler | New cycle, banner, recurring items in Review |
| BG-04 | Cycle dates recomputed | A payday or holiday change | Owner's save | "Pay cycle dates changed", new period dates |
| BG-05 | Trash purge | Daily | Scheduler | Transactions 30 days in Trash disappear |
| BG-06 | Import preview expiry | 24 hours after upload | Scheduler | The batch becomes Discarded |
| BG-07 | Phone app sync | The phone app opens, a change is made on it, or the connection returns | Phone app | "Waiting to sync" marks clear, and changes made elsewhere appear |
| BG-08 | Holidays reminder | 1 December | Scheduler | Email, and the missing-year warning |
| BG-09 | Token expiry | 7 days before expiry, and at expiry | System | Email, then the token shows Expired |
| BG-10 | Database down | PostgreSQL unreachable | System | The database banner |
| BG-11 | Sign-in lock | 5 failed sign-ins in 15 minutes | System | Email, and the locked sign-in form |
| BG-12 | Export build | Export all data | Job queue | The export's status, then its download |
| BG-13 | Server reset command | The owner runs it over SSH | Owner, on the server | Every device signed out, and a sign-in link |

## BG-01 Ingest call

A client outside the tailnet logs transactions through the one public path. Examples are a cloud agent, a phone shortcut, or the money-manager-exporter skill.

- **Actor:** an ingest client holding a `fiscus:ingest` token
- **Stories:** US-12, FR-26, BR-30, BR-31, AC-12.1 to AC-12.4, EC-14, EC-15

**Steps**

1. `POST /ingest/v1/transactions` reaches Caddy. That one path is all Caddy forwards to Fiscus (FR-01, FR-26, 5.1).
2. Fiscus checks the token, the `Idempotency-Key` and the rate limit, then validates every item (BR-09, BR-31, BR-30).
3. If every item is valid, all of them are saved as Unreviewed (FR-21). Categorisation rules run on each one as it is created (BR-32), and possible duplicates are tagged (BR-07).
4. After the commit, `fiscus.transaction.ingested` is published on the event bus (5.2).

**Outcomes**

| Case | Answer | Source |
| --- | --- | --- |
| 1 to 100 valid items within 256 KB | Created. The response lists the new ids and nothing else | AC-12.1, BR-30, 2.2 |
| The same key and body within 24 hours | The first response again, and nothing new is saved | BR-09, EC-03 |
| The same key with a different body | 422 "Idempotency key reused with a different request" | AC-11.3, BR-09 |
| No `Idempotency-Key` | 400 | BR-09, FR-25 |
| One item or more invalid | 422 for the whole batch, listing each invalid item's index and reason. Nothing is saved | AC-12.2, BR-30, EC-14 |
| A date-time without a UTC offset | That item is invalid with "Date must include a timezone offset" | AC-12.3, BR-04 |
| An item that breaks a transaction rule, such as an unknown or inactive account | That item is invalid, with the rule's reason | BR-01 to BR-08 |
| More than 60 requests in a minute from one token | 429 with Retry-After | AC-12.4, BR-31 |
| A missing, invalid, revoked or expired token | 401. The body is never echoed | EC-15, AC-03.2 |
| A `fiscus:read`, `fiscus:write` or `fiscus:settings` token | Refused with 403. Those scopes work only on the tailnet | 2.2, Proposed |
| GET, another method or another path | 404 | EC-15, AC-01.3 |
| The database is down | 503 with Retry-After: 30 | EC-16 |
| Fiscus is down | 502 from Caddy. The client retries with the same key | 5.1 |

**What you see:** the new transactions in Review (UI-FIS-07), oldest first, with the token's name as their source. The Transactions badge shows the new count on the next page load (5.2). They count in totals and budgets at once (A-08). UI-FIS-05 shows "Added by token 'phone-shortcut' through the ingest endpoint".

## BG-02 Private API client

A script or tool on a tailnet device reads and writes the ledger. The budgeting skill uses it too.

- **Actor:** a local client holding any of `fiscus:read`, `fiscus:write` and `fiscus:settings`
- **Stories:** US-11, FR-24, FR-25, AC-11.1 to AC-11.3, AC-03.2, AC-03.3, NFR-14

The API offers create, list, get, update, trash, restore, budget status and the afford check (FR-24). A list can filter by cycle, account, category, status and text, and holds at most 200 per page.

**Outcomes**

| Case | Answer | Source |
| --- | --- | --- |
| A create with `fiscus:write` and an `Idempotency-Key` | Saved as Confirmed, and the response returns its id | AC-11.1, FR-21 |
| A retry with the same key and body within 24 hours | The first response again, and nothing new is saved | AC-11.2, EC-03 |
| The same key with a different body | 422 "Idempotency key reused with a different request" | AC-11.3 |
| No `Idempotency-Key` on a create | 400 | BR-09, FR-25 |
| A `fiscus:read` token tries to create | 403 | AC-03.3 |
| A revoked or expired token | 401, and nothing is written | AC-03.2 |
| An update made against an older version | Refused as a conflict, as in EC-04 | EC-04 |
| More than 600 requests in a minute from one token | 429 | NFR-14 |
| Budget status or an afford check | The same figures the screens show, computed by the same server code | FR-28, Arch |
| The database is down | 503 with Retry-After: 30 | EC-16 |

**The two skills:**

- The budgeting skill reads budget status and the afford check. When it can't reach Fiscus, it falls back to a CSV from the full export (5.1, US-06).
- The money-manager-exporter skill sends transactions from e-receipts through BG-01 or this API. On a 4xx it shows the error. On a 5xx or a timeout it retries with the same key (5.1).

**What you see:** new transactions on the next page load, with "Added by token 'laptop-script' through the private API". Edits and trashes made by the token appear in each transaction's history under the token's name (FR-22, 2.2). The token's last-used time updates on UI-CORE-04 at most once a minute (FR-06). Categorisation rules apply to its creates (BR-32).

## BG-03 Payday

The open cycle closes, the next one opens, and recurring rules run.

- **Trigger:** 00:00 server time on payday. The server timezone defaults to Asia/Makassar (BR-34, A-10)
- **Actor:** the scheduler
- **Stories:** US-17, FR-29, FR-32, BR-23, BR-33, AC-17.1, AC-17.2, EC-19

**Steps**

1. The open cycle closes, and its configuration snapshot is stored: items, amounts and income lines (4.3, BR-23, FR-29).
2. The next cycle, Upcoming until now, opens (4.3).
3. Each active recurring rule creates one Unreviewed transaction, dated the cycle's first day (FR-32, BR-33, A-09, FD-15). A rule whose account or category has become inactive is paused instead (BR-03, Proposed).
4. After the commit, `fiscus.cycle.opened` is published (5.2).

**Outcomes**

| Case | What happens | Source |
| --- | --- | --- |
| The job runs twice, for example after a restart | The rule-plus-cycle key blocks a second transaction | EC-19, BR-33, AC-17.2 |
| The job fails | It is retried 3 times with backoff, then shows as Failed on the System page | 5.1 |

**What you see:**

- The period header moves to the new cycle, and the Cycle opened banner appears on the next visit (5.2).
- The recurring transactions wait in Review, and the badge counts them.
- Budget shows the new cycle with "Projections settle after day 7", and the old one as Closed (J-07).

## BG-04 Cycle dates recomputed

A payday or holiday change moves the dates of the cycles that have not closed.

- **Trigger:** saving a change on UI-FIS-32 or UI-FIS-33 that moves a payday
- **Actor:** the owner's save. The server recomputes
- **Stories:** EC-09, BR-10, BR-11, BR-13

**Steps**

1. Upcoming cycles are recomputed (4.3).
2. The open cycle's end date moves (EC-09).
3. Transactions are reassigned to cycles by their dates (BR-13). Closed cycles never change, because Closed is terminal (4.3).

**What you see:** "Pay cycle dates changed", new dates in the period header, and Budget figures worked out on the new dates.

## BG-05 Trash purge

Trashed transactions are deleted for good after 30 days.

- **Trigger:** a daily job, at 03:00 server time (Proposed)
- **Actor:** the scheduler
- **Stories:** BR-26, AC-10.4

**Steps:** every transaction that has been in Trash for 30 days is purged. Its record and its history are deleted, and the audit log keeps its id, amount and date (4.3, FR-13).

**What you see:** the transaction leaves Trash, and it can no longer be found or restored (AC-10.4).

## BG-06 Import preview expiry

An import that was never committed or discarded ends on its own.

- **Trigger:** 24 hours after the upload, for a batch still Uploaded or Previewed
- **Actor:** the scheduler
- **Stories:** 4.3 (import batch)

**Steps:** the batch becomes Discarded, and its file is deleted (4.3).

**What you see:** UI-FIS-40 shows the batch as Discarded. Opening it says "This preview expired. Upload the file again."

## BG-07 Phone app sync

The phone app sends the changes made on it, then fetches what changed on the server ([ADR-0002](../../architecture/decisions/0002-offline-first-mobile-app.md)).

*Restated 12 Oct 2026: it was the web app's offline queue, which Q-08 removed.*

- **Trigger:** the phone app opens, a change is made on it, or the connection returns, and no sync is already running. Pull to refresh on Daily, Calendar and Monthly, and Sync now on UI-FIS-51, start one too (5.1, Arch)
- **Actor:** the phone app, with its paired token (FR-34)
- **Stories:** US-21, US-22, FR-19, FR-39 to FR-42, BR-35 to BR-38, EC-02, EC-04, EC-23 to EC-25, EC-28

**Steps**

1. **Push.** The queue goes up in the order the changes were made, up to 100 at a time, each with its mutation id as its idempotency key (FR-19, FR-39, BR-35).
2. Each answer is handled as follows:

| Answer | What happens | Source |
| --- | --- | --- |
| Applied, or the first answer replayed for a mutation id already used | The change leaves the queue, and its row takes the server's version. Its "Waiting to sync" mark goes | FR-39, EC-02, 4.3 |
| Conflict | The phone pulls, then merges field by field. Fields only the phone changed are sent again. A field both sides changed opens UI-FIS-53 | FR-42, EC-04 |
| Rejected with `transaction_trashed` | UI-FIS-53 offers Restore and apply, or Discard | EC-24 |
| Rejected for another reason, for example because the category was deactivated meanwhile | The change waits in Couldn't sync (UI-FIS-52) with the reason, and the changes that depend on it wait with it | FR-41, EC-25, BR-38 |
| 401, because the token was revoked or expired | Sync stops, and UI-FIS-50 asks to pair again. The queue stays on the phone | FR-34, AC-19.3 |
| Offline, a network error, or 503 | The queue stays, and the next trigger tries again | EC-16, EC-28 |

3. **Pull.** Pages of changed rows and the tombstones of purged rows come down until the phone reaches the watermark. A pulled row that still has a waiting change on the phone is kept aside for the merge, never written over the phone's row (FR-40, Arch).

| Answer | What happens | Source |
| --- | --- | --- |
| A page of rows | Each row is saved by id and version; a repeat changes nothing. A tombstone removes its row | FR-40, ADR-0002 §3 |
| 410 `cursor_expired` | The phone downloads everything again, after its queue has gone up. No waiting change is lost | EC-23, BR-36 |

**What you see:** "Waiting to sync" marks clear, UI-FIS-51 shows the time of the last sync, and changes made on the web or by scripts appear at once, because every screen reads the phone's copy. Undo on a change still waiting removes it from the queue (FD-08).

## BG-08 Holidays reminder

A yearly nudge to enter next year's holidays.

- **Trigger:** 1 December, when next year has no holiday list
- **Actor:** the scheduler
- **Stories:** 5.2, A-13, EC-08, AC-15.2

**Steps:** one email to the owner, naming the missing year (5.2).

**What you see:** "Holidays for 2027 are missing" on Budget and on Holidays, until that year has a list (EC-08, AC-15.2).

## BG-09 Token expiry

An API token runs out.

- **Trigger:** 7 days before a token's expiry date, and the date itself
- **Actor:** the system
- **Stories:** 4.3 (API token), 5.2, AC-03.2

**Steps**

1. Seven days before: an email with the token's name and scope (5.2).
2. On the date: the token goes from Active to Expired, and calls with it get 401 from then on (4.3). An expired token never comes back.

**What you see:** "Expires in 7 days", then "Expired", on UI-CORE-04, with Create a replacement.

## BG-10 Database down

Fiscus keeps answering while PostgreSQL is unreachable.

- **Trigger:** PostgreSQL can't be reached
- **Actor:** the system
- **Stories:** EC-16, 5.1

**Steps**

1. The API answers 503 with Retry-After: 30 (EC-16).
2. The web app shows "Fiscus can't reach its database. Retrying.", and retries.
3. The web app saves nothing until the database is back. The phone app keeps working from its copy and holds its queue (EC-16).

**What you see:** the banner. When the database is back, the banner goes, and the phone app's queue goes up on its next sync (BG-07).

## BG-11 Sign-in lock

Too many failed sign-ins lock sign-in for a while.

- **Trigger:** 5 failed sign-ins within 15 minutes
- **Actor:** the system
- **Stories:** BR-29, AC-01.2, 5.2

**Steps**

1. Sign-in is locked for 15 minutes (BR-29).
2. The owner gets an email at once, with the time and the tailnet device's name (5.2).
3. The attempts are in the audit log (AC-01.2, FR-13).

**What you see:** UI-CORE-01 in its locked state: "Too many attempts, try again at HH:MM".

## BG-12 Export build

The full export is built in the background.

- **Trigger:** Export all data on UI-CORE-05
- **Actor:** the job queue
- **Stories:** US-06, FR-12, NFR-15

**Steps**

1. One export runs at a time (FR-12).
2. It builds one ZIP, streamed to disk (NFR-05), holding CSV and JSON for each module plus a manifest of row counts.
3. The file is deleted 24 hours after it is ready (FR-12, NFR-15).

**What you see:** on UI-CORE-05, Running, then Ready with the download, then Expired.

## BG-13 Server reset command

The last way back in when every factor is lost. On an empty install it is also the first way in.

- **Trigger:** the owner runs the command over SSH, or through the VPS provider's console following the runbook
- **Actor:** the owner, on the server
- **Stories:** US-02, AC-02.3, FR-05, EC-20, FD-05

**Steps**

1. All sessions and second factors are cleared (FR-05).
2. A sign-in link valid for 15 minutes is printed (FR-05).
3. An audit entry is written (FR-05).
4. On an empty install, it also creates the owner account (FD-05).

**What you see:** every device is signed out at its next request, and the printed link opens UI-CORE-02.
