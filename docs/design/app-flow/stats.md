# Stats

The Stats tab has three views, as in Money Manager: Category, Budget and Note. It also covers what they open: Category detail, Budget item, Afford check and Budget history. Shared parts are in the [README](README.md#shared-patterns).

Category and Note follow the period setting (pay cycle or calendar month, FD-03). Budget and Budget history always step through pay cycles, because budgets are per cycle (FR-27).

## UI-FIS-10 Stats › Category

Where the money went, or came from, by category: a pie chart and a ranked list.

- **Route:** `/stats`
- **Reached from:** the Stats tab, the palette
- **Offline:** shows what was loaded
- **Stories:** the PRD has no category chart. This view follows Money Manager's Stats tab, with the PRD's counting rules (A-08, BR-02, FD-12)

**Layout**

1. The Stats tabs, Category | Budget | Note, with Category selected.
2. The period header, plus a range switch: Period | Year | Custom.
3. An Income | Expense toggle, set to Expense by default, showing that side's total.
4. A donut chart with one slice per category, the largest 8 plus "Other". The total sits in the middle.
5. A ranked list of every category with any amount: colour chip, category, share and amount. Under it, "Includes 3 unreviewed" when that applies.

Transfers are left out, because they are neither income nor expense (FD-12). Unreviewed transactions count, as they do in budgets (A-08).

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | A grey ring and skeleton rows | Proposed |
| First run | "Import from Money Manager to get started" | EC-21 |
| Nothing on this side | "No expenses in this period", or "No income in this period" | Proposed |
| Offline | The chart as loaded, under the Offline banner | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Stats tab Budget | Click | Opens UI-FIS-12 on the cycle that holds today | Proposed |
| 2 | Stats tab Note | Click | Opens UI-FIS-16 with the same period and side | Proposed |
| 3 | Period header | Click | As in [Period header](README.md#period-header) | FD-03 |
| 4 | Range switch: Year | Click | Shows the whole year of the current period. ‹ and › now step years | Proposed |
| 5 | Range switch: Custom | Click | Opens a date-range picker. The chart shows the chosen days | Proposed |
| 6 | Income, Expense toggle | Click | Swaps the chart and list to the other side | Proposed |
| 7 | Slice | Click, or Enter on the focused slice | Opens UI-FIS-11 for that category and range | Proposed |
| 8 | List row | Click | Opens UI-FIS-11 for that category and range | Proposed |
| 9 | "Other" slice | Click | Highlights, in the list, the categories it groups | Proposed |
| 10 | "Includes 3 unreviewed" | Click | Opens UI-FIS-07 | A-08 |

**Leads to:** UI-FIS-11, UI-FIS-12, UI-FIS-16, UI-FIS-07.

## UI-FIS-11 Category detail

One category over time: its subcategories, its trend across periods, and its transactions.

- **Route:** `/stats/categories/:id`, with the period in the address
- **Reached from:** a slice or row on UI-FIS-10, the Stats link on UI-FIS-25
- **Offline:** shows what was loaded
- **Stories:** follows Money Manager, where tapping a category shows its total and its pattern by month

**Layout**

1. A header with ← back to Stats, the category's name and type, the period header, and the total.
2. A trend chart: the category's total in each of the last 6 periods, ending with the one shown, which is highlighted. A table with the same numbers sits under it (NFR-18).
3. Subcategories, if the category has any: each with its amount and share.
4. The category's transactions in the period, grouped by day in the row pattern, 200 at a time.

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | A skeleton chart and rows | Proposed |
| Nothing in this period | The trend chart, and "No transactions in this period" | Proposed |
| Inactive category | The label "Inactive" beside the name. History still shows | BR-03 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | ← | Click | Returns to UI-FIS-10 on the same period and side | Proposed |
| 2 | Period header ‹, › | Click | Steps the period, and the trend shifts with it | FD-03 |
| 3 | Trend bar | Click | Selects that period. The header, subcategories and list follow | Proposed |
| 4 | Subcategory row | Click | Filters the list to that subcategory, with a chip "Lunch ×" | Proposed |
| 5 | Subcategory chip × | Click | Shows the whole category again | Proposed |
| 6 | Transaction row | Click | Opens UI-FIS-05 | Proposed |
| 7 | See in Search | Click | Opens UI-FIS-06 with this category and period | FD-16 |
| 8 | Edit category | Click | Opens UI-FIS-25 with this category highlighted | Proposed |
| 9 | Load more | Click | Loads the next 200 | EC-22 |

**Leads to:** UI-FIS-10, UI-FIS-05, UI-FIS-06, UI-FIS-25.

## UI-FIS-12 Stats › Budget

This cycle's budget: each item's budget, spent, projected, reserved and remaining, plus the cycle's income, total reserved and free capacity.

- **Route:** `/stats/budget`, with the cycle in the address
- **Reached from:** the Stats tab, a calendar's Payday tag, the cycle link on a transaction, a column of Budget history, the palette
- **Offline:** shows the figures as loaded. "Can I afford…?" is disabled
- **Stories:** US-13, FR-27, AC-13.1 to AC-13.4, BR-10 to BR-18, EC-08, EC-10, EC-12

**Layout**

1. The Stats tabs with Budget selected.
2. A cycle header, always in cycles: ‹ Oct 2026 ›, with "25 Sep – 22 Oct" under the name (FD-28). Next to it, a status chip (Open, Closed, Upcoming or Imported history) and, for the open cycle, "Day 14 of 28".
3. Warnings, when they apply (below).
4. A summary: Cycle income; Total reserved; Free capacity.
5. The buttons "Can I afford…?", "Last 6 cycles" and "Edit budget".
6. The items table: Item, Budget, Spent, Projected, Reserved, Remaining, and a bar of spent against budget. Each item shows 🔒 if it is locked, and its projection type as a small label. An item over budget shows a negative Remaining in red, such as "−Rp 50.000". Lain-lain comes last, labelled "Lain-lain · outside any budget item".
7. "How these are worked out", a popover that explains the rules in words:
   - Projection by type (BR-15)
   - Reserved: max(budget, projection) for a locked item, the projection for a flexible one (BR-16)
   - Free capacity = income − total reserved (BR-17)
   - One rounding to the rupiah per item (BR-18)

Figures are computed by the server on each view, from Confirmed and Unreviewed transactions (FR-27, BR-14, A-08). Remaining = budget − spent (FD-13).

**Warnings**

| When | Text | Action | Source |
| --- | --- | --- | --- |
| Days 1 to 6 of the open cycle | "Projections settle after day 7" | None | AC-13.2, EC-12 |
| The next payday's year has no holiday list | "Holidays for 2027 are missing", then "Payday may be wrong." | Add holidays: opens UI-FIS-33 on 2027 | EC-08, AC-15.2 |
| The items' budgets add up to more than the cycle's income | "Budget exceeds income by Rp X" | Edit budget: opens UI-FIS-31 | EC-10, Proposed |
| Unreviewed transactions count in this cycle | "Includes 3 unreviewed" | Opens UI-FIS-07 | AC-13.3, A-08 |
| The cycle is closed | "Closed. Figures use the settings this cycle closed with." | None | FR-27, BR-23 |
| The cycle is imported history | "Imported history: spending only. This cycle has no saved budget settings." | None | FD-14 |

**States**

| State | What you see | Source |
| --- | --- | --- |
| No payday rule | "Set your payday rule first" and no figures, with Set payday rule (→ UI-FIS-32) | AC-13.4 |
| Payday set, no income lines | "Set your income to see free capacity", with Set income (→ UI-FIS-32) | EC-21, Proposed |
| Every budget amount still 0 | "Enter your budget amounts", with Edit budget (→ UI-FIS-31) | EC-21, FR-17 |
| Open cycle | Every figure, with d = days so far including today | AC-13.1, BR-15 |
| Closed cycle | Figures from the cycle's snapshot, with d = D | FR-27, BR-15, BR-23 |
| Upcoming cycle | Its dates and its expected income only, without item figures | 4.3, Proposed |
| Imported history | Spending per current item, without projected, reserved or capacity | FD-14 |
| Loading | A skeleton summary and table | Proposed |
| Offline | The figures as loaded, under the Offline banner | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | ‹ | Click | Loads the previous cycle | FR-27 |
| 2 | › | Click | Loads the next cycle. From the open cycle it goes one step further, to the Upcoming cycle, and stops there | 4.3, FR-27 |
| 3 | Cycle label | Click | Opens a cycle picker by year | Proposed |
| 4 | Can I afford…? | Click | Opens UI-FIS-14 | FR-28 |
| 5 | Last 6 cycles | Click | Opens UI-FIS-15 | FR-33 |
| 6 | Edit budget | Click | Opens UI-FIS-31 | US-15 |
| 7 | Item row | Click | Opens UI-FIS-13 for that item and cycle | Proposed |
| 8 | Lain-lain row | Click | Opens UI-FIS-13 for Lain-lain, which lists the expenses no other item counts | BR-14 |
| 9 | Cycle income | Click | Expands the breakdown: each income line with its amount, deductions shown negative | BR-12 |
| 10 | Warning action | Click | As in the warnings table | AC-15.2, EC-10 |
| 11 | How these are worked out | Click | Opens the popover | BR-15 to BR-18 |
| 12 | Stats tab Category or Note | Click | Opens UI-FIS-10 or UI-FIS-16 on the period that holds today | Proposed |

**Leads to:** UI-FIS-13, UI-FIS-14, UI-FIS-15, UI-FIS-31, UI-FIS-32, UI-FIS-33, UI-FIS-07.

## UI-FIS-13 Budget item

One budget item in one cycle: its figures, what it counts, and the transactions counted.

- **Route:** `/stats/budget/items/:id`, with the cycle in the address. A panel on a computer, full screen on a phone
- **Reached from:** an item row on UI-FIS-12, a KETAT suggestion on UI-FIS-14, an item name on UI-FIS-15
- **Offline:** shows what was loaded
- **Stories:** BR-14 to BR-16

**Layout**

1. The item's name, 🔒 Locked or Flexible, and its projection type with its rule in words. Daily, for example: "spent ÷ days so far × days in the cycle" (BR-15).
2. This cycle's Budget, Spent, Projected, Reserved and Remaining.
3. What counts: its categories and subcategories, and any transfers it counts, such as "Transfers to Stockbit, Pluang" (BR-14). For Lain-lain: "Expenses no other item counts."
4. The transactions counted in this cycle, grouped by day in the row pattern.
5. The buttons Edit item and See all in Search.

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Transaction row | Click | Opens UI-FIS-05 | Proposed |
| 2 | Edit item | Click | Opens UI-FIS-31 with this item's form open. Hidden for Lain-lain, whose rules are fixed | BR-14, Proposed |
| 3 | See all in Search | Click | Opens UI-FIS-06 filtered to this budget item and cycle | FD-16 |
| 4 | × | Click, or Esc | Closes the panel | Proposed |

**Leads to:** UI-FIS-05, UI-FIS-06, UI-FIS-31.

## UI-FIS-14 Afford check

Enter a price and choose one-off or monthly to get AMAN, KETAT or BELUM, with the numbers behind it.

- **Route:** `/afford`. A panel on a computer, full screen on a phone
- **Reached from:** "Can I afford…?" on UI-FIS-12, the palette
- **Offline:** "Needs a connection", and Check is disabled. Results always come from the server, so the UI and the private API give the same answer (Arch)
- **Stories:** US-14, FR-28, BR-19 to BR-22, AC-14.1 to AC-14.5, EC-11, EC-12

**Layout**

1. Price in rupiah, focused on open.
2. Kind: One-off | Monthly. One-off is the default.
3. Check.
4. After Check, a result card. It shows the status word with a one-line meaning:
   - AMAN: "Fits, with the buffer to spare"
   - KETAT: "Fits, but without the buffer"
   - BELUM: "Doesn't fit yet"

   Under the meaning come the numbers below.

**What the result shows**

| Case | Shows | Source |
| --- | --- | --- |
| Every result | Free capacity; the price; what AMAN needs (price × the one-off buffer, 1.15 by default, or × the monthly buffer, 1.5); capacity after the purchase, which is capacity − price | AC-14.1, BR-19, BR-20, BR-22 |
| One-off | AMAN when capacity ≥ price × 1.15; KETAT when price ≤ capacity < price × 1.15; BELUM when capacity < price | BR-19 |
| KETAT | "Flexible items with the most budget left": 3 items, each with its remaining amount | FR-28, AC-14.2 |
| BELUM with capacity above 0 | "Short by Rp X" (price − capacity) and "About N cycles to save" (⌈price ÷ capacity⌉) | BR-21 |
| BELUM with capacity 0 or less | "Not reachable at current capacity" | BR-21, EC-11 |
| Monthly | The same statuses with the 1.5 buffer, judged against the lowest capacity of the open cycle and up to 3 closed cycles. It lists each cycle's capacity and marks the lowest | AC-14.3, BR-20 |
| Monthly with no closed cycle yet | "Low confidence: less than one full cycle of data" | AC-14.4, BR-20 |
| Days 1 to 6 of the open cycle | "Projections settle after day 7" | EC-12 |
| No payday rule | "Set your payday rule first", with Set payday rule (→ UI-FIS-32), in place of the form | AC-13.4 |

Imported-history cycles have no snapshot, so the monthly check does not use them (FD-14).

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Price | Type | Digits only, grouped as you type. Check stays disabled while it is empty or 0 | AC-14.5, BR-01 |
| 2 | Kind | Click | Switches between One-off and Monthly, and clears any result | Proposed |
| 3 | Check | Click, or Enter | Sends the price and kind to the server and shows the result card | FR-28, Arch |
| 4 | Price, after a result | Change it | The result clears until Check is pressed again | Proposed |
| 5 | A KETAT item | Click | Opens UI-FIS-13 for that item and the open cycle | FR-28 |
| 6 | Check another | Click | Clears the price and the result, and focuses the price | Proposed |
| 7 | × | Click, or Esc | Closes the panel. Nothing is saved | Proposed |

**Leads to:** UI-FIS-13, UI-FIS-32.

## UI-FIS-15 Budget history

The PRD's reports: spending per budget item over the last 6 closed cycles, the top 10 notes, and spending outside any item.

- **Route:** `/stats/budget/history`
- **Reached from:** "Last 6 cycles" on UI-FIS-12, the palette
- **Offline:** shows what was loaded
- **Stories:** US-18, FR-33, AC-18.1, AC-18.2, BR-24

**Layout**

1. The title "Last 6 closed cycles", with ← back to Budget.
2. A table:
   - One row per budget item from those cycles' snapshots, plus imported-history cycles under the current items (FD-14).
   - One column per cycle, oldest to newest. Each cell is the amount spent, or "—" where the item did not exist that cycle.
   - A row "Outside any budget item" (Lain-lain) and a total row, with a small trend line in each row.
3. "Top 10 notes by amount" across the same cycles: note, count and total (FD-20).
4. The line "Edits to transactions in closed cycles update these numbers. Each cycle's budget settings stay as they closed." (BR-24)

**States**

| State | What you see | Source |
| --- | --- | --- |
| No closed cycle | "Reports start after your first full pay cycle" | AC-18.2 |
| Fewer than 6 closed cycles | Only the columns that exist | AC-18.1, Proposed |
| Loading | A skeleton table | Proposed |
| Offline | The table as loaded, under the Offline banner | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | A cell | Click | Opens UI-FIS-06 filtered to that cycle and budget item | FD-16 |
| 2 | A cell in "Outside any budget item" | Click | Opens UI-FIS-06 filtered to that cycle and Lain-lain | BR-14, FD-16 |
| 3 | An item's name | Click | Opens UI-FIS-13 for the newest cycle shown | Proposed |
| 4 | A cycle's column header | Click | Opens UI-FIS-12 for that cycle | Proposed |
| 5 | A top note | Click | Opens UI-FIS-06 with that note's text, across the 6 cycles | Proposed |
| 6 | ← | Click | Returns to UI-FIS-12 | Proposed |

**Leads to:** UI-FIS-06, UI-FIS-12, UI-FIS-13.

## UI-FIS-16 Stats › Note

Spending, or income, grouped by note, as in Money Manager's Note tab: what you pay for most.

- **Route:** `/stats/notes`
- **Reached from:** the Stats tab, the palette
- **Offline:** shows what was loaded
- **Stories:** FR-33 (top 10 notes by amount)

**Layout**

1. The Stats tabs with Note selected.
2. The period header, plus a range switch: Period | Year | Custom | Last 6 closed cycles.
3. An Income | Expense toggle.
4. The list: note, count and total, sorted by total. The first 10 are marked "Top 10" (FR-33). Notes that are equal after ignoring case and spaces are one row (FD-20). Transactions without a note make one row, "(no note)".

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | Skeleton rows | Proposed |
| First run | "Import from Money Manager to get started" | EC-21 |
| Nothing in the range | "No notes in this period" | Proposed |
| Offline | The list as loaded, under the Offline banner | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Stats tabs | Click | Category keeps the period and side. Budget opens on the cycle that holds today | Proposed |
| 2 | Period header | Click | As in [Period header](README.md#period-header) | FD-03 |
| 3 | Range switch | Click | Year steps by year. Custom opens a date-range picker. "Last 6 closed cycles" matches Budget history | FR-33, Proposed |
| 4 | Income, Expense toggle | Click | Swaps the list to the other side | Proposed |
| 5 | Note row | Click | Opens UI-FIS-06 with that note's text and the range | Proposed |
| 6 | "(no note)" row | — | Not clickable | Proposed |

**Leads to:** UI-FIS-06, UI-FIS-10, UI-FIS-12.
