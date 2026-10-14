# Phone design

The visual design of Fiscus on a phone (narrower than 1024 px). These
frames are the web app's phone layout, used in the phone's browser and online
only (Q-08). The native phone app of Phase 3 draws the same frames (FD-30). The
design follows the [app flow](../app-flow/README.md#on-a-phone-narrower-than-1024-px)
and reuses the [web design](../web/README.md)'s theme, tokens and library. Only the
layout, the chrome and the motion change.

**Status (10 Oct 2026).** Pass 1 is designed for the phone. Every Pass 1 desktop
screen has a phone frame, except the command palette (see
[Not on a phone](#not-on-a-phone)). There are 40 frames in all, including two Pixel
checks and three dark samples.

> **The phone app.** The native Flutter app (Q-07,
> [ADR-0002](../../architecture/decisions/0002-offline-first-mobile-app.md))
> draws all of these frames with the same tokens, Android first (decided
> 12 Oct 2026, FD-30). Its own screens are added to this design in Stage 9:
> pairing, the sync status, Couldn't sync, the conflict screen and the lock
> (UI-CORE-06 and UI-FIS-50 to UI-FIS-54). The app flow's
> [phone-app.md](../app-flow/phone-app.md) says how it uses each frame.

| File | What it holds |
| --- | --- |
| [../ui/fiscus.pen](../ui/fiscus.pen) | Rows 08 to 14, below the desktop rows, starting at y 9400. One row per app-flow group, with the same order and IDs as the desktop |
| [../ui/design-system.lib.pen](../ui/design-system.lib.pen) | The **Mobile** frame beside Components: 39 phone components (see [Components](#components)) |
| [../web/tokens.css](../web/tokens.css), [../web/tokens.json](../web/tokens.json) | The tokens, shared with desktop. The phone added `size/control-xl`, `size/touch`, `type/headline-l`, `type/body-l` and `type/amount-2xs` |

## Decisions

Made with the owner on 10 Oct 2026.

| Decision | Choice |
| --- | --- |
| Platform | The web app on a phone, in the browser and online (NFR-17, Q-08). The phone app draws the same frames (FD-30). It is designed on iPhone 15/16 at 393×852. Daily and Add transaction are also drawn on a Pixel at 412×915, to check edge to edge under Android's system bars. Android is the phone app's first platform (Q-06), so the Pixel checks matter for both |
| Approach | Apple-style, from the repo's `apple-design` skill: translucent chrome over content that runs edge to edge, large titles, springs that start from the current value, gestures that track 1:1, and nothing tappable in the safe areas. The [motion spec](#motion-and-interaction) covers what a still frame can't show |
| Theme | **Ledger**, unchanged from desktop: Geist and Geist Mono, ink on warm paper, colour only for meaning |
| Where | New rows in `fiscus.pen`, so phone and desktop sit together and share their local components |
| Components | Phone chrome and parts are in the library. The phone transaction rows are the one exception (see [Components](#components)) |
| Period names | A pay cycle is named after the month it ends in: "Oct 2026", with "25 Sep – 22 Oct · day 14 of 28" under it (FD-28). Desktop and the app flow follow the same rule |

## Edge-to-edge rules

1. **The viewport covers the whole screen.** Use `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">`. Never set `user-scalable=no` or `maximum-scale=1`.
2. **Content paints to every edge.** The page background, lists, banners, the totals strip, the calendar grid and the sheets all run under the status bar, the home indicator and the gesture bar. Lists have no side gutters and no cards. Hairlines are inset instead: 16 pt from the leading edge, or 60 past a type chip.
3. **Only the chrome pads itself, with `env(safe-area-inset-*)`.**
   - The top chrome adds the top inset.
   - The tab bar sits on the bottom inset.
   - Bottom action bars, sheets and the keypad add the bottom inset to their own padding, so their surface still reaches the edge.
   - In landscape, the left and right insets pad the chrome and the row content, while row backgrounds stay full width.
4. **Scroll content clears the chrome.** Its top padding equals the chrome's height. Its bottom padding equals the tab bar plus the inset plus 16, so the last row can scroll above the glass.
5. **The chrome is a material, not a bar.** The top chrome, the tab bar and the bottom bars use `bg/material` with `backdrop-filter: blur(24px) saturate(180%)`. The content stays visible through them. The top chrome shows its hairline only once content is under it, as a scroll-edge effect (frames 01d-m and 30b-m).
6. **The status bar matches the page.** Set `theme-color` per scheme to `bg/canvas` (`#F7F7F5` light, `#121214` dark), with `color-scheme: light dark`.
7. **The app owns its scrolling.** The shell is `100dvh`, with `overscroll-behavior: none` on `html` and `contain` on lists and sheets. Pull to refresh is the app's own, on Daily, Calendar and Monthly.
8. **Touch rules:**
   - Targets are at least 44 pt (`size/touch`).
   - `-webkit-tap-highlight-color: transparent`, and every tappable element has its own `:active` state.
   - `touch-action: manipulation` on controls.
   - Hover styles only under `(hover: hover) and (pointer: fine)`.
   - `user-select: none` on controls, never on content.
9. **Fields use 16 px text** (`type/body-l`), so iOS Safari never zooms into a focused field.
   - The amount field uses `inputmode="numeric"`, since amounts are whole rupiah (BR-01).
   - The sign-in code uses `autocomplete="one-time-code"`.

These rules are written for the web app. The phone app keeps the same intent
with Flutter's own means: content edge to edge under the system bars, the
chrome padded by the system insets, the app's own scrolling and pull to
refresh, 44 pt targets, and 16 pt field text with a numeric keypad for amounts.

## Layout

| Part | Size and place |
| --- | --- |
| Safe areas | iPhone: 59 top, 34 bottom. Pixel: 36 top, 24 bottom |
| Large title bar (tab roots) | 52 high, `type/display` 32. The same size on Transactions, Stats, Accounts and Settings |
| Inline bar (pushed and full-screen screens) | 44 high, title in `type/headline-l` 17, with Back or Cancel on the left |
| Period header | 52 high. ‹ and › are 44 pt. Month name in `headline-l`, dates in `caption` |
| View tabs | The segmented control at full width, 32 high, inside 4/10 padding |
| Tab bar | A glass capsule 62 high, inset 16 from the sides and resting on the bottom inset. Four items: Transactions (with the Review count), Stats, Accounts, Settings |
| + button | 56, 16 from the trailing edge and 16 above the tab bar. On Daily, Calendar and Monthly only |
| Toast | Centred, 16 above the tab bar |
| Rows | Transaction rows are at least 64 high, and the title wraps rather than truncating. List and settings rows are 52 to 60. Form rows are 52 |
| Primary buttons | XL: 50 high, 12 radius. One primary per screen, at the bottom, in thumb reach |
| Bottom sheet | 14 radius on top, a 36×5 grabber, and a medium detent at about 60% of the height |
| Keypad | Docked to the bottom edge. Save and Continue ride on top of it |

## Motion and interaction

Springs use damping and response, as in the `apple-design` skill.

| Element | Trigger | Motion | Reduced motion |
| --- | --- | --- | --- |
| Rows, buttons, chips, tab items | Pointer down | Highlight at once and scale to 0.97 within 120 ms, `--ease-out`. Release springs back | Colour change only |
| + button | Pointer down | Scale to 0.94, then Add transaction rises | Colour change only |
| Pushed screen (Transaction, Search, Review, Budget item, Afford check) | Tap | Slides in from the right with a spring of damping 1.0 and response 0.35. The page behind shifts 30% left and dims a little. It leaves the same way | 150 ms cross-fade |
| Back | Swipe from the left edge | Tracks 1:1 from where the finger grabbed. On release the velocity's sign decides commit or cancel, and the spring takes over from that velocity | Back button only, cross-fade |
| Add transaction | + | Rises from the bottom, spring 1.0 / 0.35. Swiping the bar down dismisses it, asking "Discard changes?" if anything was typed | Fade |
| Day sheet (Calendar) | Day tap | Rises to the medium detent. A drag tracks 1:1. On release, momentum is projected (rate 0.998) to the nearest detent: medium, large or closed. A flick lands with a spring of 0.8 / 0.3, otherwise 1.0. It rubber-bands past the large detent | Fade, no overshoot |
| Swipe row | Horizontal drag | Commits to a direction after 10 px (`touch-action: pan-y`), then reveals Confirm and Trash 1:1. Release past half the actions, or a flick, opens it; a full swipe past 60% trashes. Rubber-bands at the end. The row collapses in 160 ms after an action, and Undo plays it back | Actions appear at once, no rubber band |
| Large title | Scroll | Collapses into the inline bar 1:1 with the scroll, and the hairline fades in | Instant swap |
| Tab switch | Tap | The page swaps at once and keeps its own scroll. The capsule highlight slides with a spring of 1.0 / 0.3. Tapping the active tab scrolls to the top | Instant |
| Segmented thumb | Tap | Slides with a spring of 1.0 / 0.3 and the labels cross-fade | Instant |
| Pull to refresh | Overscroll at the top | Rubber-bands with the spinner, and reloads the period on release | Spinner only |
| Toast | Shown | Rises 12 px with a fade. Swipe down to dismiss. Undo lasts 5 s, and its bar pauses while the finger is down | Fade |
| Keypad | Field focus | The Save bar rides on top of the keypad (`interactive-widget=resizes-content`, `visualViewport`) | — |

**Materials.** Under `prefers-reduced-transparency: reduce`, the materials become solid `bg/canvas` with hairline edges. Under `prefers-contrast: more`, hairlines become `border/control`.

## Screen index

The sample data and dates match the desktop: the open cycle is Oct 2026 (25 Sep – 22 Oct), and today is Thu 8 Oct. Each frame's `context` in pen.dev holds its caption and sources.

| Frame | Screen | App flow | Stories and rules |
| --- | --- | --- | --- |
| SHELL-01-m | Phone anatomy, annotated | [On a phone](../app-flow/README.md#on-a-phone-narrower-than-1024-px) | FR-14, NFR-17 |
| UI-CORE-01-m, 01b-m, 01c-m | Sign in: default, wrong password or code, locked | [UI-CORE-01](../app-flow/sign-in.md#ui-core-01-sign-in) | US-01, FR-02, BR-29 |
| UI-FIS-01-m | Daily, just after a save | [UI-FIS-01](../app-flow/transactions.md#ui-fis-01-daily) | US-08, FR-18, AC-08.1, AC-08.2 |
| UI-FIS-01d-m | Daily, scrolled, with a row swiped | [Transaction row](../app-flow/README.md#transaction-row) | AC-10.2, FR-23 |
| UI-FIS-01b-m, 01c-m | Daily: first run, empty period | [UI-FIS-01](../app-flow/transactions.md#ui-fis-01-daily) | EC-21, FD-03 |
| UI-FIS-02-m | Calendar with the day sheet | [UI-FIS-02](../app-flow/transactions.md#ui-fis-02-calendar) | BR-06, BR-10, BR-11 |
| UI-FIS-03-m | Monthly | [UI-FIS-03](../app-flow/transactions.md#ui-fis-03-monthly) | BR-10, BR-13, FD-28 |
| UI-FIS-04-m, 04b-m | Add transaction: expense with the keypad, transfer | [UI-FIS-04](../app-flow/transactions.md#ui-fis-04-add-transaction) | US-08, US-09, AC-08.1, AC-09.2 |
| UI-FIS-05-m | Transaction, Unreviewed | [UI-FIS-05](../app-flow/transactions.md#ui-fis-05-transaction) | US-10, FR-22 |
| UI-FIS-06-m | Search | [UI-FIS-06](../app-flow/transactions.md#ui-fis-06-search) | FR-24, FD-16 |
| UI-FIS-07-m, 07c-m, 07d-m, 07b-m | Review: the list, select mode, the Trash all action sheet, and Nothing to review | [UI-FIS-07](../app-flow/transactions.md#ui-fis-07-review) | US-10, FR-23, FD-18, FD-29 |
| UI-FIS-01-android, 04-android | Daily and Add transaction on a Pixel | — | NFR-17, AC-08.1 |
| UI-FIS-10-m | Stats › Category | [UI-FIS-10](../app-flow/stats.md#ui-fis-10-stats--category) | A-08, FD-12 |
| UI-FIS-12-m | Stats › Budget | [UI-FIS-12](../app-flow/stats.md#ui-fis-12-stats--budget) | US-13, FR-27, BR-10 to BR-18 |
| UI-FIS-13-m | Budget item, Makan | [UI-FIS-13](../app-flow/stats.md#ui-fis-13-budget-item) | BR-14 to BR-16 |
| UI-FIS-14-m, 14b-m, 14c-m | Afford check: KETAT, AMAN, BELUM | [UI-FIS-14](../app-flow/stats.md#ui-fis-14-afford-check) | US-14, FR-28, BR-19 to BR-22 |
| UI-FIS-20-m | Accounts | [UI-FIS-20](../app-flow/accounts.md#ui-fis-20-accounts) | AC-09.1, FD-11 |
| UI-FIS-30-m, 30b-m | Settings: the top, and scrolled to Account | [UI-FIS-30](../app-flow/settings.md#ui-fis-30-settings) | US-15 |
| UI-FIS-01-m-dark, 12-m-dark, 05-m-dark | Dark samples | — | NFR-18 |

### Not on a phone

- **SHELL-02, the command palette.** A phone has no Ctrl K. Search sits in the nav bar, and every palette entry is a tab, a screen or a Settings row.
- **SHELL-03, the user menu.** Its items live in Settings: Display (theme) and Sign out.

## Components

**Library, Mobile frame (39):**

| Group | Components |
| --- | --- |
| System chrome | Status bar/iOS, Status bar/Android, Home indicator/iOS, Gesture bar/Android. These are stand-ins for the OS, with no fill. Inter and Roboto stand in for the system fonts |
| Navigation | Icon button/Touch/Default and /Filled (44), Back button, Nav bar/Large, Nav bar/Inline, Tab item/Selected and /Default, Tab bar/Transactions, /Stats, /Accounts and /Settings, Add button |
| Ledger parts | Period header/Phone, Totals strip/Phone, Swipe actions/Unreviewed and /Default, Sheet |
| Controls | Button/Primary/XL/Default and /Disabled, Button/Secondary/XL/Default, Button/Destructive/XL/Default, Field/Text/XL/Default, /Focus and /Error, Form row/Value, Form row/Input |
| Rows and keypads | Calendar day/Phone/Default, /Today, /Selected and /Outside, Budget row/Phone/Default and /Over, Category row/Phone, Keypad/iOS numeric, Keypad/Android numeric |

**Local, in `fiscus.pen`'s "Local components · phone" frame:**
- Transaction row/Phone/Expense, /Income and /Transfer.
- The title wraps, the badges sit on their own line, and the separator is inset 60 and grows with the row.
- They are local because pen.dev keeps an imported library cached until the file is reopened. Move them to the library when another file needs them.

**Desktop parts reused at full width:** Day header, Banner, Empty state, Account row, Settings row, Group header, Afford result, Field/Amount, Segmented, Filter chip, Badge, Toast.

## Design assumptions

Change any of these by changing the component, not the screens.

- **Calendar cells** show amounts in the id-ID compact form: "−121 rb" and "+7,2 jt", in `type/amount-2xs`. A full "−Rp 121.000" doesn't fit in a 56 pt cell. The day sheet shows the full amounts.
- **On Daily**, the To review banner stands in for the totals strip's "Includes 3 unreviewed" link, to save a line. Calendar, Monthly, Category and Accounts keep the link.
- **Review** works like reviewing a Money Manager import (FD-29).
  - **Tab bar:** hidden, because Review is a pushed screen.
  - **One at a time:** a round 44 pt check confirms a transaction, and a swipe left trashes it. A tap opens it, and Save and confirm brings you back.
  - **Several:** Select, in the nav bar, turns the checks into checkboxes, with Select all and Done.
  - **All:** Trash all and Confirm all sit in the bottom bar, in thumb reach. Each asks once; Trash all asks with an action sheet.
  - **Token tool:** the last row of the list.
  - **Settings:** Review is its first row, with the count.
- **Transaction** keeps Copy and Trash beside Confirm in its bottom bar. ⋯ holds the edit history.
- **Afford check** offers One-off | Monthly. The desktop frame shows a third "Transfer" segment, which looks like a leftover.
- **Settings** lists Categories under Lists, as the app flow puts it on a phone. There is no Install app row, because the web app installs nothing (Q-08).

## Known gaps

- **Sizes from number variables don't work in pen.dev.** It ignores `width` and `height` bound to number variables, so the touch and XL components now use literal 44 and 50, matching `size/touch` and `size/control-xl`. The phone frames carry the same sizes as instance overrides until `fiscus.pen` is next reopened and picks up the fixed library. The overrides are harmless after that.
- **Pass 2 screens have no phone frames yet:** Category detail, Note, Budget history, Account detail, Categories, Trash, the import screens and the settings sub-pages.
- **The phone app's own screens have no frames yet:** UI-CORE-06 and UI-FIS-50 to UI-FIS-54. They are drawn in Stage 9, and UI-CORE-06 before Stage 8 builds pairing.

## Credits

- The approach is Emil Kowalski's `apple-design` skill (MIT), with the platform rules from `mobile-native`.
- The icons are [Lucide](https://lucide.dev) (ISC).
- The typefaces are [Geist and Geist Mono](https://vercel.com/font) (OFL).
