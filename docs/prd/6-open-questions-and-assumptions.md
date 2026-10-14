# 6. Open questions & assumptions

## 6.1 Assumptions

| ID | Assumption | Impact if wrong | Validate with |
| --- | --- | --- | --- |
| A-01 | Fiscus runs on the current 1 vCPU / 1 GB LXC VPS, shared with Apion until Apion is shut down | The memory budget changes (5.3) | You, before Phase 2 |
| A-02 | You own, or will buy, a domain for the public ingest endpoint | US-12 cannot ship | You (Q-02) |
| A-03 | Account recovery uses 10 recovery codes plus a server reset command | Lockout is handled differently | You, Phase 1 |
| A-04 | Trashed transactions stay 30 days, and edits keep full history | Restore behavior and storage change | You, Phase 2 |
| A-05 | Cloud-run agents can reach your public ingest endpoint | If their outbound allowlist blocks it, skills must run from a tailnet device, or a remote MCP connector is needed (Q-05) | A test call from a cloud session in Phase 2 |
| A-06 | Backups go to Backblaze B2 | A different restic backend and cost | You, Phase 1 |
| A-07 | Alerts go by email through an SMTP relay you configure | No alert channel | You (Q-04) |
| A-08 | Unreviewed transactions count in budgets and afford checks | Afford results are too optimistic or too pessimistic | You, Phase 2 |
| A-09 | Recurring transactions arrive Unreviewed | More or less review work | You, Phase 2 |
| A-10 | The server timezone setting defaults to Asia/Makassar (WITA) for scheduled jobs and cycle opening | Jobs run at unexpected hours | You, Phase 1 |
| A-11 | The base currency is chosen at setup, IDR by default, and budgets, afford checks and reports are in it. Each account has one currency. A transaction may be in any of the owner's preferred currencies: it stores the amount entered, the exchange rate and the amount in the account's currency. Rates are entered by hand, one per currency (decided 4 Oct 2026, revised 11 Oct 2026) | Budget and report totals would need another base | Decided |
| A-12 | Money Manager TSV dates are MM/DD/YYYY, your exporter's default | Dates import wrongly | The import preview (EC-06) |
| A-13 | Holidays are entered by hand each year, seeded from your budgeting skill's list | Paydays are wrong | The yearly reminder (5.2) |
| A-14 | The native Flutter app keeps a full replica of the data and reads and writes it offline, syncing through the private API on the tailnet; the web app has no offline mode (Q-08) ([ADR-0002](../architecture/decisions/0002-offline-first-mobile-app.md), accepted 12 Oct 2026) | Without sync designed into the new schema from the start, every table needs a backfill, and the web app stays the only phone client | Decided |
| A-15 | Tailscale is installed on your phone and connected whenever it syncs | The phone never syncs; syncing from elsewhere needs a public sync endpoint (ADR-0002, "Revisit when") | Gate C |

## 6.2 Open questions

| ID | Question | Owner | Needed by | Blocking? |
| --- | --- | --- | --- | --- |
| Q-01 | Which language does the server use, now that the phone app is Flutter? TypeScript keeps the v1 design, but the budget and cycle rules are then written twice, in Dart and TypeScript, and kept equal by shared test cases. Dart lets the app and the server share one rules package ([ADR-0002](../architecture/decisions/0002-offline-first-mobile-app.md)). **Answered 11 Oct 2026:** TypeScript for the server and the web app, Flutter for the phone app. The rules are written in both languages and kept equal by shared test cases | You | — | No |
| Q-02 | Which domain will serve the public ingest endpoint? | You | Start of Phase 2 | Yes, for US-12 |
| Q-03 | What is the cutover date, the day Money Manager stops being used? | You | Phase 2 exit | Yes, for Gate B |
| Q-04 | Which SMTP relay sends alerts (for example, a Gmail app password)? | You | Phase 1 | Yes, for FR-10 |
| Q-05 | If cloud agents cannot reach the ingest endpoint, add a remote MCP connector for Claude? | You | Phase 2 exit | No |
| Q-06 | How is the iOS build installed: a paid Apple Developer account, or a free one with a rebuild every 7 days? **Deferred 12 Oct 2026:** the first builds are Android only, and Gate C needs no iOS build | You | Before an iOS build | No |
| Q-07 | Is the native, offline-first app built with Expo or Flutter? **Answered 11 Oct 2026:** Flutter. The server's language follows as Q-01 | You | — | No |
| Q-08 | Does the phone need a PWA, installable and with an offline quick-entry queue, now that the Flutter app works offline? **Answered 11 Oct 2026:** no. On a phone, Fiscus is the web app with its phone layout, in the browser and online. Offline use comes with the Flutter app in Phase 3 ([implementation plan](../implementation-plan.md)) | You | — | No |
