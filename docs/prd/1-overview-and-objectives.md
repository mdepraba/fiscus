# 1. Document overview & objectives

## 1.1 Background & problem statement

Fiscus is a private personal finance app on your VPS. It replaces a phone app and CSV files. You use it in a web app, on a computer or in your phone's browser, and from Phase 3 in a native phone app that works offline ([ADR-0002](../architecture/decisions/0002-offline-first-mobile-app.md)).

- **Today:** transactions live in the Money Manager phone app. TSV files are built from Gmail e-receipts and imported by hand, and budget checks read CSV exports. There is no single source of truth and nothing a script can query live.

It matters now because the VPS is already paid for, Apion's shutdown frees its resources, and Apion's stack and deploy pipeline can be reused as they are.

Fiscus is a modular monolith: one process, one database and one deploy, with modules that own their data and talk to each other only through public contracts.

## 1.2 Business goals & success metrics

Goals: one source of truth for your spending that a script can query live, an expense logged on the phone in seconds, all data on your own server and backed up, and from Phase 3 the ledger on your phone with or without a signal.

| Metric | Baseline | Target | Measurement method | Timeframe |
| --- | --- | --- | --- | --- |
| Share of bank and e-wallet transactions recorded in Fiscus | 0% (all in Money Manager) | ≥ 95% | Monthly reconciliation of Fiscus against BCA and e-wallet statements | 2 consecutive pay cycles after Phase 2 |
| Time to log an expense on the phone | Not measured; timed in Money Manager in week 1 of Phase 2 | ≤ 10 s median, from opening quick entry to the saved confirmation | Client timer on the quick-entry screen, logged per save | From Phase 2 exit |
| Fiscus idle memory (RSS) | New | ≤ 180 MB | systemd memory accounting on the System page | Every phase gate |
| Nightly backup success | New | 30 of 30 nights, and the monthly restore test passes | Backup job status and restore-test log | Rolling 30 days from Phase 1 exit |
| Out-of-memory kills | New | 0 per month on any unit | journald | Monthly from Phase 1 exit |
| Transactions lost or saved twice by sync | New | 0 | The monthly reconciliation above, and the sync test suite in CI | The pay cycle before Gate C, then monthly |

## 1.3 Scope

**In scope**

- **Core platform** (Phase 1):
  - owner sign-in and account recovery, and API tokens
  - the module registry, the app shell and its command palette
  - the platform screens: sign-in, account, tokens, export and the System page
  - jobs, file storage, nightly backups, the audit log and the full data export
- **Ledger and budgets** (Phase 2), in the web app with its own navigation and start page. On a phone, the web app shows its phone layout in the browser, online only (Q-08):
  - a one-time Money Manager migration
  - a ledger of expenses, income and transfers, with quick entry, a review inbox and a trash
  - pay-cycle budgets in the base currency (rupiah), with other currencies valued in it (A-11), and an afford check
  - a private API and a public, write-only ingest endpoint
  - categorisation rules, recurring transactions and reports
- **Phone app** (Phase 3): a native Flutter app, Android first (Q-06). It keeps a full copy of the ledger on the phone and syncs over the tailnet (ADR-0002, A-14):
  - pairing by QR code, with a token you can revoke
  - every read, and the ledger and budget-setup changes, without a connection, including quick entry
  - sync that never loses or doubles a change, and a screen for conflicts
  - budget and the afford check offline, and a biometric lock (both Should)

**Out of scope**

| Item | Reason | Revisit |
| --- | --- | --- |
| Receipt inbox from Gmail e-receipts | Needs Gmail OAuth and one parser per sender; the ingest endpoint covers automation first | After Phase 2 |
| Money Manager export or two-way sync | Fiscus replaces Money Manager | Not planned |
| Multiple users, bank syncing, automatic exchange rates | One owner; imports, quick entry and the API cover data entry, and rates for the few foreign-currency accounts are entered by hand (A-11) | Not planned |
| Microservices, Docker in production, high availability | Docker does not start on the LXC host; one maintainer | Not planned |
| A PWA, and offline use in the web app | The phone app covers offline use, and a browser may clear its storage (Q-08) | Not planned |
| An iOS build of the phone app | Android first; how it is installed is still open (Q-06) | After Gate C |
| Sync outside the tailnet | Needs a public sync endpoint, the exposure the ingest endpoint was designed to avoid (ADR-0002) | When it is needed |

**Phasing**

The [implementation plan](../implementation-plan.md) holds the build order, the stages and each gate's checklist.

| Phase | Delivers | Stories | Ends at |
| --- | --- | --- | --- |
| 1 | The core platform | US-01 to US-06 | Gate A |
| 2 | Ledger and budgets, and the switch from Money Manager | US-07 to US-18 | Gate B |
| 3 | The phone app, with sync | US-19 to US-24 | Gate C |

Each gate is a yes-or-no check: a phase is done only when its gate passes, and nothing from the next phase starts early.
