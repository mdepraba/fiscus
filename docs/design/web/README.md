# Web design

The visual design of Fiscus on a computer (1024 px and wider). It is
built from the [app flow](../app-flow/README.md), the
[PRD](../../prd/README.md) and the [architecture guide](../../architecture/README.md).

**Status (10 Oct 2026).** Pass 1 is designed: the foundations, the shell and
the 14 core screens with their key states. The design source is now pen.dev
(see [pen.dev files](#pendev-files)): the design system is a library, and every
Pass 1 screen is rebuilt from it. The HTML prototype stays as the reference for
copy and sample data. Figma holds the earlier design system (see [Figma](#figma)).
Pass 2 covers the other 21 screens.

| File | What it holds |
| --- | --- |
| [../ui/design-system.lib.pen](../ui/design-system.lib.pen) | The pen.dev design-system library: 190 variables (tokens.json plus `fill/knob`) in a `mode` light/dark axis, 70 Lucide icons and 255 components, 39 of them phone components in the Mobile frame and 3 in the Logo frame |
| [../ui/fiscus.pen](../ui/fiscus.pen) | Every Pass 1 screen at 1440 wide, built from library instances, one row per app-flow group. The phone frames follow in rows 08 to 14 (see the [phone design](../mobile/README.md)) |
| [../ui/fiscus.fig](../ui/fiscus.fig) | A local copy of the Figma file, which holds the earlier design system (see [Figma](#figma)) |
| [prototype/index.html](prototype/index.html) | Every Pass 1 frame at 1440 wide, grouped as in the app flow, with captions that trace each frame to its sources. Open it in a browser. A private copy is published at [claude.ai](https://claude.ai/artifact/Q3ZWGD3mok1o7DtjFGrVcX), visible only to its owner |
| [tokens.css](tokens.css) | The design tokens as CSS custom properties, light and dark, plus the text-style classes. The names match the Figma variables |
| [tokens.json](tokens.json) | The same tokens as data, with a usage note on each |
| [motion.md](motion.md) | Motion and interaction spec, which a still frame can't show |

## Decisions

Made with the owner on 10 Oct 2026.

| Decision | Choice |
| --- | --- |
| Platform | Desktop web. Frames are 1440 wide, with the column checked at 1280. The phone design is in the same `fiscus.pen`, below the desktop rows, and documented in [../mobile/README.md](../mobile/README.md) |
| Approach | Apple-style, from the repo's `apple-design` skill: restraint, translucent chrome, size-specific tracking and critically damped springs. Combined with design-engineering craft: press feedback, origin-aware popovers, no animation on keyboard actions. Both approaches are by Emil Kowalski (MIT) |
| Theme | **Ledger**: ink on warm paper, with colour used only for meaning. Geist for UI, Geist Mono for amounts, both OFL and self-hosted as NFR-09 requires. 8 px controls, 12 to 14 px cards and panels, hairlines, compact |
| Colour meaning | Income blue, expense red and transfer grey, as in Money Manager. AMAN green, KETAT amber, BELUM red. Unreviewed and Possible duplicate use amber. Every status also carries its word or an icon (NFR-18) |
| Themes | Every screen works in light and dark from the same tokens. The prototype's toggle switches them all, and Daily, Budget and the Transaction panel also have frames rendered in dark |
| Logo | Chosen on 11 Oct 2026: the pay cycle in progress, a thick open ring with today's dot in its gap, in ledger ink. The library's Logo frame holds `Logo/Mark` (28 px, `text/primary`), `Logo/Mark/On primary` (18 px, `text/on-primary`) and `Logo/Mark/On primary/L` (34 px, `text/on-primary`). `Brand` shows the 18 px mark in its 28 px ink tile, on the sidebar and the phone sign-in screens. The 52 px tile on the desktop sign-in screens (UI-CORE-01, 01b and 01c) shows the 34 px mark. The HTML prototype draws the same mark from its `logo-mark` symbol |
| Scope | Pass 1 is the core screens. Pass 2 covers the rest of the app flow |

## Layout

- **Sidebar** 232 px, translucent (`--color-bg-material-sidebar` with a 24 px backdrop blur).
- **Top bar** 52 px, translucent. It holds the page title, the palette trigger
  "Search Fiscus Ctrl K" (FR-08), Search transactions (/) and the user menu.
  Its hairline shows only once content has scrolled under it.
- **Column** 1040 px, centred in the 1208 px content area (84 px margins).
  Budget and Calendar use 1128 px.
- **Panels** 440 px, floating 8 px from the edges with a 14 px radius and the
  level 3 shadow. They have no scrim, because the page keeps its place behind them.
- **Dialogs** use a 32% ink scrim. Toasts sit bottom centre in the content area.

## pen.dev files

**Library (`design-system.lib.pen`).** Converted from the Figma file and checked against
`tokens.json`.

- **Variables:**
  - Every token in `tokens.json`, plus `fill/knob` for the switch knob, which is white in both themes.
  - Colours carry light and dark values on the `mode` axis.
  - Text styles are sets of variables (`type/<style>/family`, `size`, `weight`, `line-height`, `tracking`),
    because pen.dev has no text styles.
- **Components:**
  - Each variant is its own component, named `Set/Prop/State`, for example `Button/Primary/M/Default`.
  - Composites such as Sidebar, Quick add and Panel footer are built from instances, so editing a part updates them.
  - Pass 1 added Card, Stat, Switch, Progress bar, Calendar day, Account row, Settings row,
    Category row, Budget row, KV row, OTP cell, Section label, Group header and Afford result.
- **Editing it:** pen.dev loads library changes into other files only after the library is saved
  and those files are reopened.

**Screens (`fiscus.pen`).** It imports the library under the alias `f`, so components are `f:<id>`
and variables are `$f:<name>`.

- **Layout:** each screen is a top-level frame named `<ID> · <title>`, in one row per app-flow group.
  The frame's `context` field holds the caption and sources from the prototype.
- **Theme:** set `f:mode` to `dark` on any frame to see it dark. The three dark samples are copies
  with only that change.
- **Local components:** the "Local components" frame holds four Shells (Sidebar with the right item
  selected, Top bar, 1040 column slot), the Monthly period table rows and the Panel used by
  UI-FIS-04, 05, 13 and 14. "Local components · phone" holds the phone transaction rows.
- **Phone rows:** rows 08 to 14 hold the phone frames at 393×852, with two Pixel checks at 412×915.
  The [phone design](../mobile/README.md) lists them.
- **Editing from the command line:** the `pen` CLI (`pen interactive --app desktop --in <file>`)
  runs `execute()` snippets against the open app and `save()`s the file. A library change still
  reaches `fiscus.pen` only after `fiscus.pen` is reopened.
- **Annotations:** the SHELL-01 annotations use a local `annotation` colour, which is not part of the UI.
- **Known gaps:**
  - Pen.dev has no dashed strokes, so Pass 2 boxes on the flow maps are drawn as transparent outlined boxes.

## Figma

File: [Fiscus](https://www.figma.com/design/VRGZlxdAysjAGGCoYlzIaK/Fiscus).

**Design system page.** These items are built, and they match `tokens.css`:

- **Variables:**
  - `Primitives`: 59 colours, hidden from pickers.
  - `Color` (light) and `Color · Dark`: 50 semantic tokens each. They are two
    single-mode collections because the Starter plan allows one mode per
    collection.
  - `Dimension`: space, radius and size.
  - Every variable has WEB code syntax such as `var(--color-bg-canvas)`.
- **Styles:** 17 text styles (Display to Kbd) and 4 effect styles (Elevation 1 to 3 and Material/Blur).
- **Icons:** 70 Lucide components (ISC) at 20 px.
- **Components:**
  - Controls: Spinner, Kbd, Button, Icon button, Field/Text, Field/Amount,
    Field/Select, Segment, Segmented, Badge, Count, Filter chip
  - Shell: Nav item, Brand, Sidebar, Top bar, Menu item, User menu, Palette item,
    Command palette
  - Ledger: Period header, Totals strip, Banner, Toast, Transaction row, Day header,
    Quick add
  - Containers: Panel header, Panel footer, Empty state

**Importing the screens without MCP calls.** A local development plugin builds
the Pass 1 frames on the Web page, one section per group. It is
generated from the same source as the prototype and is not kept in the repo.

- The frames are made of editable layers. Flex rows become auto layout.
- Colours are bound to the `Color` and `Color · Dark` variables, text to the text
  styles, and icons are instances of the icon components.
- A second run replaces only what the plugin made earlier.
- To run it, open the file in the Figma desktop app, choose **Plugins ›
  Development › Import plugin from manifest…**, and run it.
- Once the frames are in, **File › Save local copy…** gives a `.fig` file.

A `.fig` file can't be written directly, because the format is private and
undocumented.

**Still to do in Figma:**

1. **Import the Pass 1 frames onto the Web page.** Run the plugin above. Alternatively,
   capture `prototype/index.html?screen=UI-FIS-01` (any frame ID) with Figma's Chrome
   extension.
2. **Fix the toast.** Add the `bg/on-inverse` and `bg/on-inverse-strong` tokens to both
   colour collections, then rebind the toast's Undo pill and countdown to them. Figma
   ignores paint opacity on variable-bound fills. The plugin does this when its "Fix the
   Toast component" option is on, which is the default.
3. **Build the remaining components** with their variants: calendar day, budget row,
   progress, category row, account row, settings row and afford result.
4. **Add the docs and the logo.** That means the Read me, the foundations documentation
   and the chosen logo.

## Screen index (Pass 1)

Each frame's caption in the prototype lists its sources. All amounts are
invented sample data. The open cycle is Oct 2026, from 25 Sep to 22 Oct (a cycle
is named after the month it ends in, FD-28). Today is Thu 8 Oct (day 14 of 28),
and the budget figures follow BR-12 to BR-21.

| Frame | Screen | App flow | Stories and rules |
| --- | --- | --- | --- |
| DS-01 | Style tile | — | NFR-09, NFR-18, NFR-19 |
| SHELL-01 | Layout anatomy | [Layout and navigation](../app-flow/README.md#layout-and-navigation) | FR-14 |
| SHELL-02 | Command palette | [Palette entries](../app-flow/README.md#palette-entries) | FR-08, US-04 |
| SHELL-03 | User menu | [User menu](../app-flow/README.md#user-menu) | FR-14, FD-22 |
| UI-CORE-01, 01b, 01c | Sign in: default, wrong password or code, locked | [UI-CORE-01](../app-flow/sign-in.md#ui-core-01-sign-in) | US-01, FR-02, BR-29, AC-01.2 |
| TX-FLOW | Transactions flow map | [Navigation map](../app-flow/README.md#navigation-map) | J-02, J-05, J-06 |
| UI-FIS-01 | Daily, just after a quick-add save | [UI-FIS-01](../app-flow/transactions.md#ui-fis-01-daily) | US-08, FR-18, AC-08.2, A-08 |
| UI-FIS-01b | Daily, first run | [UI-FIS-01](../app-flow/transactions.md#ui-fis-01-daily) | EC-21, FD-03 |
| UI-FIS-01c | Daily, empty period | [UI-FIS-01](../app-flow/transactions.md#ui-fis-01-daily) | FD-03 |
| UI-FIS-02 | Calendar with the day panel | [UI-FIS-02](../app-flow/transactions.md#ui-fis-02-calendar) | BR-06, BR-10, BR-11 |
| UI-FIS-03 | Monthly, open cycle expanded | [UI-FIS-03](../app-flow/transactions.md#ui-fis-03-monthly) | BR-10, BR-13 |
| UI-FIS-04 | Add transaction, expense | [UI-FIS-04](../app-flow/transactions.md#ui-fis-04-add-transaction) | US-08, FR-18 to FR-21, AC-08.1 to AC-08.4 |
| UI-FIS-04b | Add transaction, transfer to Stockbit | [UI-FIS-04](../app-flow/transactions.md#ui-fis-04-add-transaction) | US-09, FR-20, AC-09.2, BR-14 |
| UI-FIS-05 | Transaction, Unreviewed | [UI-FIS-05](../app-flow/transactions.md#ui-fis-05-transaction) | US-10, FR-22, AC-10.1, AC-10.3 |
| UI-FIS-06 | Search | [UI-FIS-06](../app-flow/transactions.md#ui-fis-06-search) | FR-24, FD-16 |
| UI-FIS-07, 07b | Review, and Nothing to review | [UI-FIS-07](../app-flow/transactions.md#ui-fis-07-review) | US-10, FR-23, FD-18, FD-29 |
| UI-FIS-07c, 07d | Review: select mode, and the Trash all dialog. They are only in `fiscus.pen`; the HTML prototype predates FD-29 | [UI-FIS-07](../app-flow/transactions.md#ui-fis-07-review) | FR-23, AC-10.2, FD-29 |
| ST-FLOW | Stats flow map | [Navigation map](../app-flow/README.md#navigation-map) | J-08 |
| UI-FIS-10 | Stats › Category | [UI-FIS-10](../app-flow/stats.md#ui-fis-10-stats--category) | A-08, FD-12, NFR-18 |
| UI-FIS-12 | Stats › Budget, open cycle | [UI-FIS-12](../app-flow/stats.md#ui-fis-12-stats--budget) | US-13, FR-27, BR-10 to BR-18 |
| UI-FIS-13 | Budget item, Makan | [UI-FIS-13](../app-flow/stats.md#ui-fis-13-budget-item) | BR-14 to BR-16 |
| UI-FIS-14, 14b, 14c | Afford check: KETAT, AMAN, BELUM | [UI-FIS-14](../app-flow/stats.md#ui-fis-14-afford-check) | US-14, FR-28, BR-19 to BR-22 |
| UI-FIS-20 | Accounts | [UI-FIS-20](../app-flow/accounts.md#ui-fis-20-accounts) | AC-09.1, A-11, FD-11 |
| UI-FIS-30 | Settings | [UI-FIS-30](../app-flow/settings.md#ui-fis-30-settings) | US-15 |
| UI-FIS-01-dark, 12-dark, 05-dark | Dark samples | — | NFR-18 |

**Pass 2**, in the same order as the app flow:

- UI-CORE-02 to UI-CORE-05.
- UI-FIS-08, 11, 15, 16, 21, 22 and 25.
- UI-FIS-31 to UI-FIS-37 and UI-FIS-40 to UI-FIS-42.
- These states:
  - loading skeletons and offline banners
  - the EC-04 conflict view. The sync queue left the web app with Q-08; the phone app's sync screens are designed in Stage 9
  - the Confirm all and "Trash all from this token" dialogs
  - Budget's no-payday state and its day 1 to 6 warning

## Design assumptions

These are small choices the docs leave open. Change any of them by changing
the token or component, not the screens.

- **Unreviewed** shares KETAT's amber. Both mean "needs a look", and each always carries its word and an icon.
- **Expense category charts** use a muted categorical palette (`chart/1` to `chart/7`, plus `chart/other`).
  It stays clear of the income blue and the expense red. The list beside each chart repeats its numbers.
- **The Accounts totals** colour Assets blue and Liabilities red, as Money Manager does.
- **Transaction panels have no scrim.** Opening another row swaps the panel's content.
  The command palette uses a light scrim, and dialogs a full one.
- **The quick-add bar** shows its resting state with the amount focused and Save disabled.
  Daily shows it just after a save, with "Saved" and Undo.
- **Account opening balances** (FD-25) are not in any Pass 1 screen.

## Open questions

- **Import details (Pass 2):** FD-23 to FD-26 change UI-FIS-42 and UI-FIS-22. Those screens
  will show the open choice as a visible placeholder until it is decided.

## Credits

- The approaches are Emil Kowalski's `apple-design` and design-engineering skills (MIT).
- The icons are [Lucide](https://lucide.dev) 0.460 (ISC).
- The typefaces are [Geist and Geist Mono](https://vercel.com/font) (OFL).
