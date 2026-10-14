# Ledger and budgets (Phase 2)

## US-07: Migrate from Money Manager

**As the** owner, **I want to** import my Money Manager history once, **so that** Fiscus starts with all my data and Money Manager can be retired. Priority: Must

- **AC-07.1 (happy path)** **Given** a TSV with the 8 Money Manager columns, **when** I upload it, **then** a preview shows row counts by type, totals per account, unknown accounts or categories, and possible duplicates, and nothing is saved yet.
- **AC-07.2 (happy path)** **Given** a preview with no errors, **when** I commit, **then** every row is saved as Confirmed in one batch that can be rolled back for 7 days.
- **AC-07.3 (happy path)** **Given** a row whose type is `Transfer-Out`, **when** it is imported, **then** it becomes a transfer from `Account` to the account named in `Category`.
- **AC-07.4 (negative)** **Given** a row with an unknown account or category, **when** I preview, **then** it is listed as an error with its line number and Commit stays disabled until I map or skip it.

## US-08: Log an expense in seconds

**As the** owner, **I want** a quick-entry screen on my phone, **so that** logging a purchase takes under 10 seconds. Priority: Must

- **AC-08.1 (happy path)** **Given** the web app open in my phone's browser, **when** I open quick entry, **then** the amount field is focused with a numeric keypad and account and category default to my last choices.
- **AC-08.2 (happy path)** **Given** an amount, **when** I tap Save, **then** the transaction is saved as Confirmed with the current date and time in my device's timezone, and Undo shows for 5 seconds.
- **AC-08.3 (offline)** **Given** no connection, **when** I tap Save in the web app, **then** nothing is saved, the form keeps what I entered, and it says the entry needs a connection. Offline quick entry comes with the phone app (AC-20.3). *Restated 12 Oct 2026 for Q-08: it was the PWA's offline queue.*
- **AC-08.4 (negative)** **Given** an empty or zero amount, **then** Save stays disabled.

## US-09: Record transfers

**As the** owner, **I want** top-ups, cash withdrawals and investment deposits recorded as transfers, **so that** they are never counted as spending. Priority: Must

- **AC-09.1 (happy path)** **Given** a transfer of Rp 100.000 from BCA to Wallet.ovo, **when** I save it, **then** BCA falls and Wallet.ovo rises by Rp 100.000 and no budget item changes.
- **AC-09.2 (happy path)** **Given** a transfer to Stockbit or Pluang, **when** I save it, **then** it counts toward the Investasi item.
- **AC-09.3 (negative)** **Given** the same source and destination account, **when** I save, **then** it is refused with "Choose two different accounts".

## US-10: Review, correct and trash

**As the** owner, **I want** a review inbox and a trash with restore, **so that** automated entries and mistakes are easy to fix. Priority: Must

- **AC-10.1 (happy path)** **Given** transactions from the ingest endpoint or recurring rules, **when** I open Review, **then** they are listed oldest first with their source, and I can confirm, edit and confirm, or trash each one, or confirm all.
- **AC-10.2 (happy path)** **Given** I trash a transaction, **then** it leaves lists and budgets at once and can be restored for 30 days.
- **AC-10.3 (happy path)** **Given** I edit a transaction, **then** its previous values are kept in its history with the time of change.
- **AC-10.4 (negative)** **Given** a transaction purged after 30 days in trash, **when** I search for it, **then** it cannot be found or restored.

## US-11: Private API for my scripts

**As the** owner, **I want** a private REST API on my tailnet, **so that** scripts on my devices can read and write the ledger. Priority: Must

- **AC-11.1 (happy path)** **Given** a `fiscus:write` token and an `Idempotency-Key`, **when** a script creates a transaction, **then** it is saved as Confirmed and the response returns its id.
- **AC-11.2 (retry)** **Given** the same key and body within 24 hours, **when** the script retries, **then** the original response is returned and nothing new is saved.
- **AC-11.3 (negative)** **Given** the same key with a different body, **then** the call fails with 422 "Idempotency key reused with a different request".

## US-12: Public ingest endpoint

**As the** owner, **I want** a public, write-only endpoint, **so that** agents and shortcuts outside my tailnet can log transactions without seeing my data. Priority: Must (blocked by Q-02)

- **AC-12.1 (happy path)** **Given** a `fiscus:ingest` token, **when** a client posts 1–100 transactions with an `Idempotency-Key`, **then** they are saved as Unreviewed and the response lists only their ids.
- **AC-12.2 (negative)** **Given** one invalid item in a batch, **then** the whole batch is refused with 422 listing each invalid item's index and reason.
- **AC-12.3 (negative)** **Given** a date-time without a UTC offset, **then** that item is invalid with "Date must include a timezone offset".
- **AC-12.4 (negative)** **Given** more than 60 requests in a minute from one token, **then** further requests get 429 with Retry-After.

## US-13: See this cycle's budget

**As the** owner, **I want to** see each budget item's spent, projected, reserved and remaining amounts for the current pay cycle, **so that** I know where I stand. Priority: Must

- **AC-13.1 (happy path)** **Given** the open cycle, **when** I open Budget, **then** each item shows budget, spent, projected, reserved and remaining, plus cycle income, total reserved and free capacity (BR-12 to BR-18).
- **AC-13.2 (warning)** **Given** fewer than 7 days of the cycle have passed, **then** a note says "Projections settle after day 7".
- **AC-13.3 (happy path)** **Given** Unreviewed transactions in the cycle, **then** they are included and the page shows how many (assumes A-08).
- **AC-13.4 (negative)** **Given** no payday rule is set, **then** Budget shows "Set your payday rule first" and no figures.

## US-14: Check if I can afford something

**As the** owner, **I want to** enter a price and choose one-off or monthly, **so that** I get AMAN, KETAT or BELUM with the numbers behind it. Priority: Must

- **AC-14.1 (happy path)** **Given** free capacity Rp 1.500.000 and a one-off price of Rp 1.000.000, **then** the result is AMAN and capacity after purchase is Rp 500.000.
- **AC-14.2 (happy path)** **Given** free capacity Rp 1.100.000 and a one-off price of Rp 1.000.000, **then** the result is KETAT and lists the flexible items with the most budget left.
- **AC-14.3 (happy path)** **Given** a monthly price, **then** it is judged against the lowest capacity among the open cycle and up to 3 previous closed cycles, with a 1.5 buffer.
- **AC-14.4 (edge)** **Given** no closed cycle yet, **then** the result is marked "Low confidence: less than one full cycle of data".
- **AC-14.5 (negative)** **Given** a price of 0 or empty, **then** Check stays disabled.

## US-15: Configure my budget

**As the** owner, **I want to** edit budget items, income rules, payday and holidays, **so that** the numbers match my real life. Priority: Must

- **AC-15.1 (happy path)** **Given** I change a budget amount mid-cycle, **then** the open cycle and later cycles use the new amount and closed cycles keep their snapshot.
- **AC-15.2 (warning)** **Given** the holiday list for the next payday's year is empty, **then** Budget warns that payday may be wrong.
- **AC-15.3 (warning)** **Given** budget items that total more than expected cycle income, **when** I save, **then** it saves with "Budget exceeds income by Rp X".
- **AC-15.4 (negative)** **Given** a negative amount, **when** I save, **then** it is refused.

## US-16: Auto-categorise

**As the** owner, **I want** categorisation rules, **so that** repeat merchants fill category, subcategory and note automatically. Priority: Should

- **AC-16.1 (happy path)** **Given** a rule "note contains 'warung' between 07:00 and 09:00 → Primary Needs › Makan, note 'breakfast: …'", **when** a matching transaction arrives at 08:10 local time, **then** its category, subcategory and note are filled.
- **AC-16.2 (happy path)** **Given** a later rule for the same text without a time window, **when** it arrives at 13:00, **then** the later rule applies.
- **AC-16.3 (negative)** **Given** no rule matches, **then** the transaction keeps the values it arrived with.

## US-17: Recurring transactions

**As the** owner, **I want** recurring rules such as kost rent, **so that** fixed payments are not forgotten. Priority: Should

- **AC-17.1 (happy path)** **Given** a rule for kost rent on the cycle's first day, **when** a cycle opens, **then** one Unreviewed transaction is created for it (assumes A-09).
- **AC-17.2 (negative)** **Given** the rule already created a transaction this cycle, **when** the job runs again, **then** no duplicate is created.

## US-18: Reports

**As the** owner, **I want** spending reports across cycles, **so that** I can see trends. Priority: Should

- **AC-18.1 (happy path)** **Given** at least 2 closed cycles, **when** I open Reports, **then** I see spending per budget item for the last 6 closed cycles, the top 10 notes by amount, and spending outside any budget item.
- **AC-18.2 (empty)** **Given** no closed cycle, **then** Reports shows "Reports start after your first full pay cycle".
