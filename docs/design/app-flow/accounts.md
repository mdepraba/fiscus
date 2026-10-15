# Accounts and categories

The Accounts tab, as in Money Manager: every account's balance with Assets, Liabilities and Total, plus each account's own history. Categories sits next to it in the sidebar on a computer, and under Settings on a phone. Shared parts are in the [README](README.md#shared-patterns).

At install, the 9 accounts and the Money Manager category list are seeded (FR-17). Accounts and categories are deactivated, never deleted, so history keeps its names (BR-03, FD-11).

## UI-FIS-20 Accounts

All accounts with their balances, grouped, with the totals across them.

- **Route:** `/accounts`
- **Reached from:** the Accounts tab, Settings › Accounts, the palette
- **Offline:** shows what was loaded
- **Stories:** AC-09.1, A-11, FR-17, BR-03

**Layout**

1. Totals, all in IDR: Assets (the sum of positive balances), Liabilities (the sum of negative balances), and Total (FD-11).
2. Groups (Cash, Bank, E-wallet, Investment, Other), each with its subtotal in IDR (FD-11). Inside each group, its accounts in the owner's order. Each account shows its name and its balance in its own currency, with "≈ Rp …" for another currency (FD-10).
3. A "Show inactive accounts" switch, and + Add account.

A balance is the account's opening balance (FD-25) plus its Confirmed and Unreviewed transactions, in the account's currency: expenses out, income in, transfers out and in (FD-11). Trashed transactions don't count (AC-10.2).

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | Skeleton groups | Proposed |
| First run | The seeded accounts at Rp 0, with "Import from Money Manager to get started" above them | EC-21, FR-17 |
| Offline | The balances as loaded, under the Offline banner. Changes are disabled | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Account row | Click | Opens UI-FIS-21 | Proposed |
| 2 | + Add account | Click | Opens UI-FIS-22 empty | Proposed |
| 3 | ⋯ › Edit | Click | Opens UI-FIS-22 with the account | Proposed |
| 4 | ⋯ › Deactivate | Click | The deactivate dialog, as in UI-FIS-22 row 7 | BR-03 |
| 5 | ⋯ › Move up, Move down | Click | Moves the account within its group, and saves the order | NFR-18, Proposed |
| 6 | Account row | Drag | Reorders it within its group and saves the order | Proposed |
| 7 | Group header | Click | Collapses or expands the group | Proposed |
| 8 | Show inactive accounts | Switch on | Inactive accounts appear greyed, each with Reactivate | BR-03, Proposed |
| 9 | Reactivate | Click | The account is active again and can be chosen for new transactions. The toast reads "BCA is active" | BR-03, Proposed |

**Leads to:** UI-FIS-21, UI-FIS-22.

## UI-FIS-21 Account detail

One account's history, period by period, with its balance as each day ends.

- **Route:** `/accounts/:id`, with the period in the address
- **Reached from:** an account row on UI-FIS-20
- **Offline:** shows what was loaded
- **Stories:** AC-09.1

**Layout**

1. A header with ←, the account's name, group and currency, its balance (and IDR value), and Edit.
2. The period header, following the period setting (FD-03).
3. A strip: Money in, Money out, and the balance at the end of the period.
4. The account's transactions grouped by day, in the row pattern. A transfer shows as money in or money out. Each day header shows the balance at the end of that day.
5. +, which adds a transaction on this account.

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | A skeleton header and rows | Proposed |
| Empty period | "No transactions on this account in this period" | Proposed |
| Inactive account | The label "Inactive", and no + | BR-03 |
| Offline | The history as loaded, under the Offline banner | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | ← | Click | Returns to UI-FIS-20 | Proposed |
| 2 | Period header | Click | As in [Period header](README.md#period-header) | FD-03 |
| 3 | Transaction row | Click | Opens UI-FIS-05 | Proposed |
| 4 | + | Click | Opens UI-FIS-04 with this account as Account, or as From on the Transfer tab | Proposed |
| 5 | Edit | Click | Opens UI-FIS-22 with the account | Proposed |
| 6 | Load more | Click | Loads the next 200 | EC-22 |

**Leads to:** UI-FIS-04, UI-FIS-05, UI-FIS-22.

## UI-FIS-22 Account form

Add an account, or change one's name, group or currency, and deactivate or reactivate it.

- **Route:** a dialog over UI-FIS-20 or UI-FIS-21
- **Reached from:** + Add account and Edit on UI-FIS-20, Edit on UI-FIS-21
- **Offline:** not available ("Needs a connection")
- **Stories:** BR-03, FR-17, A-11

**Fields**

| Field | Rules | Source |
| --- | --- | --- |
| Name | Required, and unique among accounts | Proposed |
| Group | Cash, Bank, E-wallet, Investment or Other | FD-11 |
| Currency | One per account: the base currency (IDR) by default, or any other currency set up in Settings › Currencies. Locked once the account has transactions | A-11, FD-10 |
| Opening balance | In the account's currency, 0 by default. Negative for a liability, such as a credit card. Balances start from it; budgets and stats ignore it | FD-25 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Name | Type | An empty name is refused with "Enter a name". A name already used is refused with "An account with this name already exists" | Proposed |
| 2 | Group | Choose | Sets the group the account is listed under | FD-11 |
| 3 | Currency | Choose | Sets the account's currency. For an account that has transactions it is locked, with "An account with transactions keeps its currency" | A-11, Proposed |
| 4 | Add a currency (under Currency) | Click | Opens the add-currency dialog of UI-FIS-34 on top. Saving it returns here with the new currency chosen | A-11, Proposed |
| 5 | Save | Click | Creates or updates the account and closes the dialog. The toast reads "Account saved", and an audit entry with before and after values is written | FR-13 |
| 6 | Cancel | Click, or Esc | Closes the dialog. Unsaved changes ask "Discard changes?" first | Proposed |
| 7 | Deactivate (edit only) | Click | Dialog: "Deactivate BCA? It stays in your history and balances, but you can't choose it for new transactions." It also lists any recurring rules and auto-categorise rules that use the account; recurring rules on it will be paused. Deactivate makes it inactive, and an audit entry is written | BR-03, FR-13, Proposed |
| 8 | Reactivate (edit, inactive only) | Click | The account is active again. Paused recurring rules stay paused until resumed on UI-FIS-35 | BR-03, Proposed |

**Leads to:** UI-FIS-20, UI-FIS-34.

## UI-FIS-25 Categories

Expense and income categories with their subcategories, the list Money Manager's categories were seeded from.

- **Route:** `/categories`
- **Reached from:** Categories in the sidebar, Settings › Categories on a phone, Edit category on UI-FIS-11, the palette
- **Offline:** shows what was loaded, read-only
- **Stories:** FR-17, BR-02, BR-03, US-16

**Layout**

1. Tabs: Expense | Income. Expenses and income use separate category lists, as in Money Manager, because both need a category (BR-02).
2. The tab's categories in order. Each one expands to its subcategories.
3. A "Show inactive" switch, and + Add category.

**States**

| State | What you see | Source |
| --- | --- | --- |
| Loading | Skeleton rows | Proposed |
| Seeded | The Money Manager category list, with nothing to set up | FR-17 |
| Offline | The list as loaded, with changes disabled | NFR-16 |

**Interactions**

| # | Element | Action | What happens next | Source |
| --- | --- | --- | --- | --- |
| 1 | Expense, Income tab | Click | Shows that type's categories | BR-02 |
| 2 | Category row | Click | Expands or collapses its subcategories | Proposed |
| 3 | + Add category | Click | Adds a name field at the end of the list. Enter saves it and the toast reads "Category added"; Esc cancels. An empty name is refused with "Enter a name", and a name already in the list with "A category with this name already exists" | Proposed |
| 4 | ⋯ › Rename | Click | Turns the name into a field. Enter saves; the new name shows everywhere, on past transactions too, and an audit entry is written | FR-13, Proposed |
| 5 | ⋯ › Add subcategory | Click | Adds a name field at the end of the category's subcategories, which saves as in row 3 | Proposed |
| 6 | ⋯ › Stats | Click | Opens UI-FIS-11 for the category on the current period | Proposed |
| 7 | ⋯ › Move up, Move down | Click | Moves the category or subcategory, and saves the order | NFR-18, Proposed |
| 8 | Row | Drag | Reorders it and saves the order | Proposed |
| 9 | ⋯ › Deactivate | Click | Dialog: "Deactivate Makan? It stays on past transactions, but you can't choose it for new ones." It lists where the category is used, for example "Budget item Makan, 2 auto-categorise rules, the recurring rule 'Kos'". The recurring rules are paused and the auto-categorise rules switched off. Deactivate makes it inactive, its subcategories included, and an audit entry is written | BR-03, FR-13, Proposed |
| 10 | Show inactive | Switch on | Inactive categories appear greyed, each with Reactivate | BR-03, Proposed |
| 11 | Reactivate | Click | The category can be chosen again. Paused or switched-off rules stay that way until turned back on | BR-03, Proposed |

**Leads to:** UI-FIS-11.
