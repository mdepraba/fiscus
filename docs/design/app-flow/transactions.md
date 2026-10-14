# Transactions

The Transactions tab: Daily, which is the first page, then Calendar and Monthly, and the screens they open. Shared parts (the period header, totals strip, transaction row, banners, toasts) are described once in the [README](README.md#shared-patterns).

## UI-FIS-01 Daily

The first page. It shows the period's transactions grouped by day, the period's income and expense totals, and fast input.

- **Route:** `/`, the start page. Sign-in opens it (FD-07)
- **Reached from:** sign-in, the Transactions tab, the palette, a period or week on Monthly
- **Offline:** the list shows what was loaded, under the Offline banner. The quick-add bar keeps what was typed, but Save needs a connection (AC-08.3)
- **Stories:** US-08, US-10, EC-21, EC-22

**Layout, top to bottom**

1. The period header with the Daily tab selected. At the right of the header: Search, and a ⋯ menu with Review, Trash and Import from Money Manager.
2. The totals strip: Income, Expense, Total.
3. Banners, if any: Database down, Offline, Cycle opened, To review.
4. On a computer, the quick-add bar: an Expense | Income switch, then Amount, Category, Account, Note, a "Now" label, Save, and +.
5. Day groups, newest day first. Each opens with a day header, "Thu 8 Oct", showing that day's income in blue and expense in red. The day's rows follow, newest first.
6. Load more, when the period holds more than 200 transactions.

On a phone the quick-add bar is gone, and a round + button floats above the tabs.

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | A skeleton of the header and strip, and five skeleton rows | Proposed |
| First run: no transactions at all | "Import from Money Manager to get started", with Import (→ UI-FIS-41). The quick-add bar still works | EC-21 |
| Empty period | "No transactions in this period", with Add (→ UI-FIS-04) | Proposed |
| No payday rule | The header steps through calendar months and shows "Set your payday rule to see pay cycles" (→ UI-FIS-32) | FD-03 |
| Unreviewed transactions in the period | The To review banner; those rows carry the Unreviewed badge; the strip says "Includes 3 unreviewed" | 5.2, A-08 |
| First visit after payday | The Cycle opened banner | 5.2, BG-03 |
| Week filter on | A chip, "28 Sep – 4 Oct ×", under the header. Only that week's days show, and the strip shows that week's totals | Proposed |
| More than 200 transactions | The newest 200, then Load more | FR-24, EC-22 |
| Offline or database down | The banner. The list stays as loaded, and quick add's Save is disabled with "Needs a connection". What was typed stays | NFR-16, EC-16, AC-08.3 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Period header (‹, ›, label, Today, tabs) | Click | As in [Period header](README.md#period-header) | FD-03 |
| 2 | "Includes 3 unreviewed" in the strip | Click | Opens UI-FIS-07 | A-08 |
| 3 | Search | Click, or press / | Opens UI-FIS-06 | Proposed |
| 4 | ⋯ › Review | Click | Opens UI-FIS-07 | FR-23 |
| 5 | ⋯ › Trash | Click | Opens UI-FIS-08 | AC-10.2 |
| 6 | ⋯ › Import from Money Manager | Click | Opens UI-FIS-41 | US-07 |
| 7 | To review banner › Review | Click | Opens UI-FIS-07 | 5.2 |
| 8 | Cycle opened banner › Review | Click | Opens UI-FIS-07 | 5.2 |
| 9 | Cycle opened banner › Dismiss | Click | Hides the banner for this cycle on this device | Proposed |
| 10 | Week chip × | Click | Clears the week filter and shows the whole period | Proposed |
| 11 | Quick add: Expense, Income switch | Click | Switches the bar's type. Category now lists that type's categories and defaults to the last one used for it | BR-02, FR-18 |
| 12 | Quick add: Amount | Type | Takes digits only and groups them as you type, "25.000". Save stays disabled while the field is empty or 0 | AC-08.4, BR-01 |
| 13 | Quick add: Amount | Type more than 10.000.000.000 | "Amount must be a whole rupiah value from 1 to 10 miliar" under the field; Save stays disabled | BR-01 |
| 14 | Quick add: Category | Type to filter, then ↑, ↓ and Enter, or click | Picks "Category › Subcategory". Inactive categories are not offered | FR-18, BR-03 |
| 15 | Quick add: Account | Type to filter, then pick | Picks an active account. For an account in another currency, its code shows beside the amount with "≈ Rp …" under it | BR-03, FD-10 |
| 16 | Quick add: Note | Type | Up to 200 characters. The field takes no more and shows "Up to 200 characters" | BR-08 |
| 17 | Quick add: "Now" | Click | Opens UI-FIS-04 with everything typed so far, at the date field | FD-04 |
| 18 | Quick add: Save, or Enter in any field | Click or press | Saves a Confirmed transaction dated now, in the device's timezone with its offset. The row appears under today and the strip updates. The toast "Saved" offers Undo for 5 s. Amount and note clear, type, category and account stay, and the cursor returns to the amount. A second Enter while saving does nothing, because the client id makes it a no-op | AC-08.2, FR-18, FR-21, BR-04, EC-01 |
| 19 | Save | Today is not in the period shown | Saves as in row 18. The toast reads "Saved to today", with Show, which steps the header to today's period | Proposed |
| 20 | Save | A categorisation rule changed the category or note | Saved with the rule's values. The toast reads "Saved · Category set by rule 'warung'" | BR-32, FD-09 |
| 21 | Save | The server flags a possible duplicate | Saved with the "Possible duplicate" tag. The toast reads "Saved · Possible duplicate", with View (→ UI-FIS-05) | BR-07 |
| 22 | Save | The connection drops, or the database is down, while saving | Nothing is saved, and the bar keeps what was typed. The toast "Couldn't reach Fiscus. Try again." offers Retry, which sends it again with the same client id, so it is never saved twice | AC-08.3, EC-01, EC-16 |
| 23 | Toast › Undo | Click within 5 s | The saved transaction moves to Trash and leaves the list | FR-18, FD-08 |
| 24 | Quick add: + | Click | Opens UI-FIS-04 with the type, amount, category, account and note carried over | FD-04 |
| 25 | Quick add | Press Esc | Clears the amount and note | Proposed |
| 26 | Day header | Click | Collapses or expands that day | Proposed |
| 27 | Day header + (on hover) | Click | Opens UI-FIS-04 dated that day at the current time. Not shown on days after tomorrow | BR-06, Proposed |
| 28 | Transaction row | Click, hover actions | As in [Transaction row](README.md#transaction-row) | FR-23, AC-10.2 |
| 29 | Load more | Click | Loads the next 200 | EC-22 |
| 30 | + (phone) | Tap, or press N on a keyboard | Opens UI-FIS-04 full screen | AC-08.1 |
| 31 | The list (phone) | Pull down | Reloads the period | Proposed |

**Leads to:** UI-FIS-02, UI-FIS-03, UI-FIS-04, UI-FIS-05, UI-FIS-06, UI-FIS-07, UI-FIS-08, UI-FIS-32, UI-FIS-41.

## UI-FIS-02 Calendar

The period as a month grid, with each day's income and expense, and any day one click away.

- **Route:** `/calendar`
- **Reached from:** the Calendar tab, the palette
- **Offline:** shows what was loaded
- **Stories:** BR-06, BR-10, BR-11

**Layout**

1. The period header with the Calendar tab selected, and the totals strip.
2. The grid: weeks as rows, Monday to Sunday as columns. In pay-cycle mode the grid runs from the Monday on or before the cycle's first day to the Sunday on or after its last. Days outside the cycle are dimmed and cannot be clicked (FD-03).
3. Each day cell shows the day number, plus that day's income in blue and expense in red when they are not zero. Markers: a ring for today, a "Payday" tag on each payday, a holiday mark taken from Holidays, and a dot when the day has Unreviewed entries.
4. The day panel opens beside the grid on a computer and as a bottom sheet on a phone. It shows the day's date, its income and expense, its transactions in the row pattern, and "+ Add on this day".

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | A skeleton grid | Proposed |
| First run | The grid with no amounts, and "Import from Money Manager to get started" above it | EC-21 |
| No payday rule | A calendar-month grid with the "Set your payday rule to see pay cycles" prompt | FD-03 |
| Offline | The grid as loaded, under the Offline banner | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Period header | Click | As in [Period header](README.md#period-header) | FD-03 |
| 2 | Day cell | Click, or Enter on the focused cell | Opens the day panel for that day | Proposed |
| 3 | Grid | Arrow keys | Move the focus from day to day | NFR-18 |
| 4 | Dimmed day | Click | Nothing happens; that day belongs to another period | FD-03 |
| 5 | Holiday mark | Hover or focus | Shows the holiday's name | BR-11 |
| 6 | Payday tag | Click | Opens UI-FIS-12 for this cycle | Proposed |
| 7 | Day panel: a row | Click | Opens UI-FIS-05 | Proposed |
| 8 | Day panel: + Add on this day | Click | Opens UI-FIS-04 dated that day at the current time. Disabled on days after tomorrow, with the tooltip "Date is in the future" | BR-06 |
| 9 | Day panel: × | Click, or Esc | Closes the panel | Proposed |
| 10 | + (phone) | Tap | Opens UI-FIS-04 dated now | AC-08.1 |

**Leads to:** UI-FIS-04, UI-FIS-05, UI-FIS-12.

## UI-FIS-03 Monthly

Compares the periods of one year, and drills into each period's weeks.

- **Route:** `/monthly?year=2026`
- **Reached from:** the Monthly tab, the palette
- **Offline:** shows what was loaded
- **Stories:** BR-10, BR-13

**Layout**

1. A year header, ‹ 2026 ›, in place of the period header, with the view tabs. The totals strip shows the whole year.
2. One row for each period named in that year, newest first (FD-28). Each row shows its name and dates ("Oct 2026 · 25 Sep – 22 Oct", or "Oct 2026" alone in calendar-month mode), income, expense, total and an expand arrow. The period that holds today is highlighted. Periods that have not started are not listed.
3. An expanded period lists its weeks, Monday to Sunday and cut at the period's edges, such as "25–27 Sep" and "28 Sep – 4 Oct", each with income, expense and total.

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | Skeleton rows | Proposed |
| First run | "Import from Money Manager to get started" | EC-21 |
| A year with no transactions | "No transactions in 2025" | Proposed |
| Offline | The rows as loaded, under the Offline banner | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | ‹ year | Click | Loads the previous year | Proposed |
| 2 | › year | Click | Loads the next year. Disabled on the year that holds tomorrow | BR-06, Proposed |
| 3 | View tab | Click | Daily and Calendar open on the period that holds today, or on the last period opened from this list | Proposed |
| 4 | Period row | Click | Opens UI-FIS-01 on that period | Proposed |
| 5 | Expand arrow | Click | Shows or hides the period's weeks | Proposed |
| 6 | Week row | Click | Opens UI-FIS-01 on that period with the week filter on, "28 Sep – 4 Oct ×" | Proposed |

**Leads to:** UI-FIS-01, UI-FIS-02.

## UI-FIS-04 Add transaction

The full entry form: amount first, the last account and category already chosen, saved in one tap.

- **Route:** `/add`, a panel on a computer and full screen on a phone
- **Reached from:**
  - + on Daily, Calendar or Monthly, and N on a keyboard
  - the quick-add bar's + and its "Now" label
  - "+ Add on this day", and a day header's +
  - Copy on UI-FIS-05
  - Account detail's +, with that account chosen
  - the palette
- **Offline:** the form opens and keeps what is typed, but Save and Continue need a connection (AC-08.3, Q-08). Offline entry is the phone app's (US-20)
- **Stories:** US-08, US-09, FR-18 to FR-21, AC-08.1 to AC-08.4, AC-09.1 to AC-09.3

**Layout**

1. Tabs: Income | Expense | Transfer. Expense is selected unless the opener passes a type.
2. Amount, large and focused on open, with a numeric keypad on a phone (AC-08.1). Beside it, the currency: the account's by default, and a tap lists the preferred currencies from Settings › Currencies (FD-10). When it differs from the account's currency, two fields appear under it, Exchange rate and "Charged to account" (the amount in the account's currency), prefilled from the rates and editable. For an amount not in the base currency, "≈ Rp …" shows too.
3. For an expense or income: Category, a grid of that type's categories. Picking one that has subcategories shows them, plus "No subcategory". Then Account, grouped as on Accounts.
4. For a transfer: From and To, and no category (BR-02). When the two accounts use different currencies, a second amount, "Received", in the destination's currency (FD-10).
5. Date and time, "Now" by default in the device's timezone.
6. Note, up to 200 characters; Description, up to 1,000 characters (FD-24); and Tags, up to 5 of up to 30 characters each (BR-08).
7. The hint "Counts toward Investasi", shown when a transfer's destination is named in a budget item's transfer rule (BR-14, AC-09.2).
8. Save (primary), Continue, and × to close.

Defaults: the type is Expense; account and category are the last ones used for that type on this device (FR-18, AC-08.1); date and time are now (AC-08.2), or the day chosen on Calendar.

The form times itself from opening to the saved confirmation and sends that time with the save, to measure the "≤ 10 s median" goal (PRD 1.2). Nothing about it is shown.

**States**

| State | What you see | Source |
| --- | --- | --- |
| Fresh | Amount focused and the defaults filled. Save is disabled until the amount is above 0 | AC-08.1, AC-08.4 |
| Saving | Save shows a spinner, and another click does nothing | EC-01 |
| Offline | The same form, with the line "You're offline. Saving needs a connection." Save and Continue are disabled, and what was typed stays | NFR-16, AC-08.3, Proposed |
| Error | Field errors under their fields | BR-01 to BR-08 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Type tab | Click | Switches the fields: Transfer swaps Category and Account for From and To. Amount, date, note and tags stay | BR-02, FR-20 |
| 2 | Amount | Type | Digits only, grouped as you type. Save stays disabled while it is empty or 0. Above 10.000.000.000 it shows "Amount must be a whole rupiah value from 1 to 10 miliar" | AC-08.4, BR-01 |
| 3 | Category | Click | Opens the category grid. Choose a category, then a subcategory if it has any | FR-18 |
| 4 | Account, From or To | Click | Opens the account list, grouped. Inactive accounts are not offered | BR-03 |
| 5 | To | Choose the same account as From | "Choose two different accounts" under the field; Save is disabled | AC-09.3 |
| 6 | Date and time | Click | Opens date and time pickers. A date after tomorrow is refused with "Date is in the future" | BR-06 |
| 7 | Note | Type | Stops at 200 characters with "Up to 200 characters" | BR-08 |
| 8 | Tags | Type a tag and press Enter | Adds it as a chip, suggesting tags already used. A sixth tag is refused with "Up to 5 tags", and one over 30 characters with "Tags can be at most 30 characters" | BR-08 |
| 9 | Tag chip × | Click | Removes the tag | Proposed |
| 10 | Save | Click, or Enter | Saves it as Confirmed. The panel closes, the lists and totals behind it update, and the toast "Saved" offers Undo for 5 s. The device remembers the type, account and category as last used | AC-08.2, FR-18, FR-21 |
| 11 | Continue | Click | Saves as in row 10 but keeps the form open. Amount, note and tags clear; type, account, category and date stay; the amount is focused | FD-04 |
| 12 | Save or Continue | The connection drops, or the database is down, while saving | Nothing is saved, and the form stays open with what was typed. The toast "Couldn't reach Fiscus. Try again." offers Retry, which sends it again with the same client id as its Idempotency-Key | AC-08.3, EC-01, EC-03, EC-16 |
| 13 | Save or Continue | A rule changed a value, or a possible duplicate was found | The toast names the rule ("Category set by rule 'warung'") or reads "Possible duplicate", with View | BR-32, BR-07, FD-09 |
| 14 | Save or Continue | The server refuses a field | The errors show under the fields, naming each one, and nothing is saved | BR-01 to BR-08 |
| 15 | × | Click, or Esc | Closes the form. If anything was typed, asks "Discard this transaction?" with Discard and Keep editing | Proposed |
| 16 | Toast › Undo | Click within 5 s | The new transaction moves to Trash | FR-18, FD-08 |
| 17 | Toast › View | Click | Opens UI-FIS-05 for the saved transaction | Proposed |
| 18 | Currency (beside Amount) | Choose | Lists the preferred currencies. Choosing one other than the account's shows Exchange rate and "Charged to account", prefilled from the rates. Changing either one updates the other, so the charge can match the bank statement | FD-10 |
| 19 | Description | Type | Up to 1,000 characters. The field takes no more and shows "Up to 1,000 characters" | BR-08, FD-24 |

**Leads to:** back to the opener; UI-FIS-05 (View).

## UI-FIS-05 Transaction

Everything about one transaction: change it, confirm it, trash or restore it, copy it, and read its history.

- **Route:** `/transactions/:id`, a panel on a computer and full screen on a phone. Opening the address directly shows the panel over Daily
- **Reached from:** any transaction row, a toast's View, Edit on Review
- **Offline:** shows what was loaded, read-only
- **Stories:** US-10, FR-22, AC-10.1 to AC-10.4, EC-04, EC-07, BR-24

**Layout**

1. Header: the type icon, the amount and a status chip, Confirmed, Unreviewed or Trashed.
2. The fields of UI-FIS-04, editable in place. They are read-only while the transaction is Trashed.
3. Source:
   - "Added by you"
   - "Added by token 'phone-shortcut' through the ingest endpoint"
   - "Added by token 'laptop-script' through the private API"
   - "From the recurring rule 'Kos'"
   - "Imported from Money Manager on 9 Oct 2026"

   A token keeps its name here even after it is revoked (2.2, FR-21).
4. Cycle: "In the cycle Oct 2026 · 25 Sep – 22 Oct" (FD-28). If that cycle is closed, it adds "This cycle is closed. Editing changes its actual spending in reports, not its budget settings." (BR-24).
5. Timezone: "Entered at 00:30 GMT+7", shown when the stored offset differs from the device's (EC-07, BR-04).
6. Possible duplicate, shown only when tagged: "Possible duplicate of Thu 8 Oct · Rp 25.000 · BCA · warung", with Not a duplicate (BR-07).
7. History, newest first. Each entry gives the time, who changed it, and each changed field from old to new, such as "9 Oct 2026 08:15 · You · Amount Rp 20.000 → Rp 25.000". The last entry is "Created", with its source (FR-22, AC-10.3).
8. Action buttons, by status:

| Status | Buttons | Source |
| --- | --- | --- |
| Confirmed | Save (once something changed), Copy, Trash | 4.3 |
| Unreviewed | Confirm, which becomes Save and confirm once something changed; Save, which keeps it Unreviewed; Copy; Trash | AC-10.1, 4.3 |
| Trashed | Restore, with "Purges on 7 Nov 2026" | BR-26, 4.3 |

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | A skeleton panel | Proposed |
| Not found, for example after purging | "This transaction no longer exists.", with Back. A purged transaction can't be found or restored | AC-10.4 |
| Offline | Read-only. The buttons are disabled with "Needs a connection" | NFR-16, Proposed |
| Conflict | Two columns, "Your changes" and "Saved elsewhere", with the differing fields highlighted | EC-04 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Any field | Change it | Save, or Save and confirm, appears. Field rules are those of UI-FIS-04 | FR-22, BR-01 to BR-08 |
| 2 | Date | Change it to a day in another cycle | The line "Moves to the cycle 23 Oct – 24 Nov 2026" appears | BR-13, Proposed |
| 3 | Save | Click | Saves the change and appends the previous values to the history. The toast reads "Saved", and lists and budgets update | FR-22, AC-10.3 |
| 4 | Save and confirm | Click | Saves the change and moves Unreviewed → Confirmed in one step, with one history entry. The Review count drops by one. Opened from Review, it then returns to Review (FD-29) | AC-10.1, 4.3, FD-29 |
| 5 | Confirm | Click | Unreviewed → Confirmed, with a history entry | 4.3 |
| 6 | Save, any kind | The transaction changed since it loaded | Refused with "Changed elsewhere. Review both versions." Both versions appear side by side | EC-04 |
| 7 | Keep mine | Click | Saves your values over the newer version, with a new history entry | FD-17 |
| 8 | Use theirs | Click | Drops your changes and shows the newer version | FD-17 |
| 9 | Trash | Click | → Trashed, remembering its previous state. It leaves lists and budgets at once and writes an audit entry. The panel closes, and the toast "Moved to Trash" offers Undo, which restores it | AC-10.2, 4.3, FR-13 |
| 10 | Restore | Click | → its previous state, Confirmed or Unreviewed, with a history entry. The toast reads "Restored" | 4.3 |
| 11 | Copy | Click | Opens UI-FIS-04 with this transaction's type, amount, category, account, note and tags, dated now | FD-04 |
| 12 | Source link | Click | An import opens UI-FIS-42, a recurring rule UI-FIS-35, and a token UI-CORE-04 | Proposed |
| 13 | Cycle link | Click | Opens UI-FIS-12 for that cycle | Proposed |
| 14 | Possible duplicate link | Click | Opens the other transaction in this panel | BR-07, Proposed |
| 15 | Not a duplicate | Click | Removes the "Possible duplicate" tag, with a history entry | BR-07, Proposed |
| 16 | × | Click, or Esc | Closes the panel. Unsaved changes ask "Discard changes?" first | Proposed |

**Leads to:** UI-FIS-04 (Copy), UI-FIS-12, UI-FIS-35, UI-FIS-42, UI-CORE-04.

## UI-FIS-06 Search

Finds transactions across all time, by note text and filters.

- **Route:** `/search`, with the query and filters in the address (FD-16)
- **Reached from:** Search on the Transactions views, the top bar's Search, /, the palette, a note on Stats › Note, "See all" on a budget item, a cell of Budget history, Category detail
- **Offline:** "Search needs a connection"
- **Stories:** FR-24, EC-22, AC-10.4

**Layout**

1. A search box for note text, case-insensitive "contains", focused on open.
2. Filter chips:
   - Period: Any time, a cycle, a month, or custom dates
   - Type, Account, Category with subcategory, and Status (Confirmed or Unreviewed)
   - Tag, Source (you, a token, an import or a recurring rule) and Budget item (FD-16)
   - Clear all
3. A summary: "128 transactions · Income Rp … · Expense Rp …".
4. The results, grouped by day in the row pattern, 200 at a time with Load more (FR-24, EC-22).

Trashed transactions are not searched; they are in Trash. Purged ones no longer exist (AC-10.4).

**States**

| State | What you see | Source |
| --- | --- | --- |
| No text and no filters | "Search notes, or pick a filter" | Proposed |
| Loading | Skeleton rows | Proposed |
| No results | "No transactions match", with Clear filters | Proposed |
| Offline | "Search needs a connection" | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Search box | Type | The results update after a 300 ms pause, and the address updates | FR-24, FD-16 |
| 2 | Filter chip | Click | Opens its picker. Choosing a value applies it and the chip shows it with × | FR-24, FD-16 |
| 3 | Chip × | Click | Removes that filter | Proposed |
| 4 | Clear all | Click | Removes the text and every filter | Proposed |
| 5 | Result row | Click | Opens UI-FIS-05 | Proposed |
| 6 | Load more | Click | Loads the next 200 | EC-22 |
| 7 | Browser Back from a result | Press | Returns here with the same text and filters | FD-16 |

**Leads to:** UI-FIS-05.

## UI-FIS-07 Review

Where transactions that arrived automatically, from the ingest endpoint or a recurring rule, are confirmed, fixed or trashed. It works like reviewing a Money Manager import (FD-29): fix rows one by one, confirm or trash each, pick several, or confirm or trash them all.

- **Route:** `/review`
- **Reached from:**
  - the To review and Cycle opened banners, and the Transactions badge
  - ⋯ › Review, and "Includes N unreviewed" in a totals strip or on Budget
  - the Review row at the top of Settings, which is always there (FD-29)
  - the palette, and the token revoke dialog
- **Offline:** shows what was loaded, read-only
- **Stories:** US-10, FR-23, AC-10.1, EC-13, 5.2

**Layout**

1. The title, "Review · 12".
2. The toolbar:
   - a source filter (All, each token, Recurring)
   - Select
   - Trash all
   - Confirm all
   - ⋯, which holds "Trash all from a token since a date…"
3. The list, oldest first (FR-23). Each row shows its date and time, amount, category, account, note and source ("Ingest · phone-shortcut", "Recurring · Kos"), with its badges, and the buttons Confirm, Edit and Trash.
4. On a phone:
   - Review is a pushed screen, so the tab bar hides.
   - Select sits in the nav bar.
   - Trash all and Confirm all sit in a bottom bar, within thumb reach.
   - Each row has a round Confirm check. A swipe left trashes the row, and a tap opens it.
   - The token tool is the last row of the list.
5. In select mode:
   - The row buttons become checkboxes.
   - The title reads "2 selected".
   - The toolbar, or the phone's bottom bar, shows Select all, Trash 2, Confirm 2 and Done.

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | Skeleton rows | Proposed |
| Empty | "Nothing to review", with Back to Daily | EC-21 |
| Offline | The list as loaded, with every button disabled | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Confirm | Click | Unreviewed → Confirmed. The row leaves the list, the count and badge drop, and the toast reads "Confirmed" | AC-10.1, 4.3 |
| 2 | Edit, or the row | Click or tap | Opens UI-FIS-05, with Back reading "Review" and Save and confirm as its main button. Save and confirm saves the fixes, confirms the transaction and comes back to Review, where the row has left the list and the count has dropped | AC-10.1, FD-29 |
| 3 | Trash, or a swipe left on a phone | Click or swipe | → Trashed. The row leaves the list and an audit entry is written. The toast "Moved to Trash" offers Undo for 5 s | AC-10.1, AC-10.2, FR-13 |
| 4 | Source filter | Choose | Shows only that source. Confirm all, Trash all and Select all then cover only what is shown | Proposed |
| 5 | Confirm all | Click | Dialog: "Confirm 12 transactions?" Confirm makes everything shown Confirmed. Any changed since the list loaded are left alone, and the toast says "10 confirmed. 2 changed elsewhere and were left for review." | AC-10.1, FD-18 |
| 6 | Trash all | Click | Dialog, or an action sheet on a phone: "Move 12 transactions to Trash?" with "They leave totals and budgets now. You can restore them from Trash for 30 days." "Move 12 to Trash" trashes everything shown, writes audit entries, and the toast "12 moved to Trash" offers Undo for 5 s. Any changed since the list loaded are left alone, as with Confirm all | AC-10.2, 4.3, FD-18, FD-29 |
| 7 | Select | Click | Enters select mode. Swipes and the row buttons are off; tapping a row ticks it | FD-29 |
| 8 | Select all, Done | Click | Select all ticks every row shown. Done leaves select mode and clears the ticks | FD-29 |
| 9 | Confirm N, Trash N | Click | Act on the ticked rows only, without a dialog: Confirm N confirms them; Trash N trashes them with Undo for 5 s. Select mode ends, and the toast says how many | AC-10.1, AC-10.2, FD-29 |
| 10 | ⋯ › Trash all from a token since a date | Click | Dialog with three parts: Token (every token that created transactions, revoked and expired ones included); Since (a date, by default the token's creation date); the count, "8 unreviewed transactions", and a checkbox "Also trash 3 confirmed ones". "Trash 8" moves them all to Trash, writes audit entries, and the toast reads "8 moved to Trash" | FR-23, EC-13, FD-18 |
| 11 | Dialog › Cancel | Click, Esc, or a tap on the scrim | Closes the dialog with no change | Proposed |

**Leads to:** UI-FIS-05, UI-FIS-01.

## UI-FIS-08 Trash

Trashed transactions, kept 30 days, ready to restore or delete for good.

- **Route:** `/trash`
- **Reached from:** ⋯ › Trash on the Transactions views, Settings › Trash, the palette
- **Offline:** shows what was loaded, read-only
- **Stories:** AC-10.2, AC-10.4, BR-26

**Layout**

1. The title with a count, and Empty trash.
2. The list, most recently trashed first, 200 at a time. Each row shows date, amount, category, account and note, then "Trashed 2 Oct · purges 1 Nov 2026" (BR-26), the reason ("by you", "import rollback", "trash all from token 'phone-shortcut'"), and Restore.

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | Skeleton rows | Proposed |
| Empty | "Trash is empty" | EC-21 |
| Offline | The list as loaded, with the buttons disabled | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Restore | Click | → its previous state. It leaves Trash and returns to lists and budgets. The toast reads "Restored to Confirmed", or "Restored to Review" | 4.3, AC-10.2 |
| 2 | Row | Click | Opens UI-FIS-05, read-only, with Restore | Proposed |
| 3 | Empty trash | Click | Dialog: "Permanently delete 37 transactions? This can't be undone." Delete purges them all: the records and their history are deleted, and the audit log keeps each one's id, amount and date. The list empties | 4.3, 2.2 |
| 4 | Load more | Click | Loads the next 200 | EC-22 |

Transactions trashed 30 days ago are purged by the daily job (BG-05).

**Leads to:** UI-FIS-05.
