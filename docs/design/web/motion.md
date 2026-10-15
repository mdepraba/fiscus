# Motion and interaction spec

This spec covers how the Fiscus web app moves and responds. Still frames
can't show any of it. The approach is Apple-style: motion starts from the
current value, can be interrupted, and settles without overshoot unless a
gesture threw it. Design-engineering craft adds the details: quick press
feedback, popovers that grow from their trigger, and nothing animated that a
keyboard opens dozens of times a day.

The tokens are in [tokens.css](tokens.css):

- **Easing:** `--ease-out` is `cubic-bezier(0.23, 1, 0.32, 1)`, and `--ease-drawer`
  is `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Durations:** `--dur-press` (120 ms), `--dur-popover` (150 ms), `--dur-dialog-in`
  and `--dur-dialog-out` (200 and 150 ms), `--dur-toast-in` and `--dur-toast-out`
  (220 and 160 ms) and `--dur-fade` (150 ms).

## Transitions

| Element | Trigger | Motion | Reduced motion |
| --- | --- | --- | --- |
| Buttons, rows, segments, chips | Pointer down | Scale to 0.97 within `--dur-press`, `--ease-out`; release springs back | Colour change only |
| Right panel (Add transaction, Transaction, Budget item, Afford check) | Open by click | Slides in from the right edge with a spring of damping 1.0 and response 0.35, and leaves the same way | 150 ms cross-fade |
| Right panel | Opened by **N** or by its address | Appears at once, with no animation | — |
| Dialog | Open | Scale 0.96 → 1 with fade, `--dur-dialog-in`; exit `--dur-dialog-out`; the scrim fades with it | Fade only |
| Menu, popover, picker | Open | Scale 0.97 → 1 with fade, `--dur-popover`. `transform-origin` is the trigger, so the user menu grows from the avatar | Fade only |
| Command palette | Ctrl K | No animation, open and close | — |
| Toast | Shown | Rises 12 px with fade, `--dur-toast-in`; leaves in `--dur-toast-out`. A new toast replaces the old one | Fade only |
| Undo countdown | Toast with Undo | The 2 px bar drains over 5 s, linear. It pauses while hovered or while the tab is hidden | The bar stays; it is information, not decoration |
| Segmented thumb (Expense, Income, Transfer; Daily, Calendar, Monthly) | Selection | The thumb slides with a spring of 1.0 / 0.3; labels cross-fade | Instant |
| New row after a save | Quick add or panel Save | Height grows from 0 and the row fades in, 200 ms `--ease-out`. Totals change at once, without counting up | Appears at once |
| Row trashed | Trash or Undo | Height collapses and the row fades out, 160 ms; Undo plays it back | Disappears at once |
| Period change | ‹ › or ← → | Content cross-fades in 120 ms. The header label changes at once | Instant |
| Day panel (Calendar) | Day click | Swaps its content in place, without sliding | — |

## Materials

- **Sidebar and top bar** use `--color-bg-material-sidebar` and `--color-bg-material` with
  `backdrop-filter: blur(24px) saturate(180%)`, and the content scrolls under them.
  The top bar adds its hairline only once content is underneath it. That is a
  scroll-edge effect, not a permanent border.
- **Panels, menus and dialogs** are solid `--color-bg-raised`, so text over them stays
  legible. Depth comes from the shadows `--shadow-2` and `--shadow-3`.
- **Under `prefers-reduced-transparency: reduce`** the materials become solid
  `--color-bg-canvas` and drop the blur.
- **Under `prefers-contrast: more`** cards and controls switch their hairlines to
  `--color-border-control`.

## Feedback rules

- **Respond on pointer down.** No animation waits for `click`.
- **Keyboard actions never animate:** Ctrl K, /, N and Esc.
- **Undo instead of confirm** for one transaction. Dialogs are only for actions that
  touch many records or can't be undone (Shared patterns › Panels, dialogs and toasts).
- **Save buttons** show the spinner and stay disabled while their request runs (EC-01).
  The client id keeps a double click from saving twice.
- **Focus** is a 2 px `--color-border-strong` ring on every interactive element, in both themes.

## Implementation notes

- Use CSS transitions, not keyframes, for anything a user can interrupt. Specify
  exact properties (`transform`, `opacity`), never `transition: all`.
- Animate enter states with `@starting-style`.
- The panel and segmented-thumb springs can use a small spring helper or the
  `linear()` easing approximation. A library is not needed for the Pass 1 motions.
- Gate hover effects with `@media (hover: hover) and (pointer: fine)`.
