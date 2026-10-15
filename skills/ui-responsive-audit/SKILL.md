---
name: ui-responsive-audit
description: >-
  Systematically verify a web UI is responsive and free of layout bugs by driving it in a real browser across viewport sizes (including short heights), text directions (LTR/RTL), and colour schemes (light/dark), asserting in code - not by eye - that nothing overflows horizontally, no table or dialog breaks, and content stays inside the viewport. Use WHENEVER you built or changed any web UI and want to confirm it works across screen sizes, or the user says 'test the UI', 'check it's responsive', 'does it work on mobile', 'any layout bugs', 'check RTL / dark mode', or wants a browser UI test before calling work done. ESPECIALLY reach for it before declaring front-end work finished - a UI that looks fine at one window size routinely has a horizontal-scroll or clipped-content bug at another, and the point is that you never pass a UI test with a bug still on screen. Framework-agnostic: React, Angular, Vue, plain HTML, anything you open in a browser.
---

# UI Responsive Audit

A UI that looks perfect in your one browser window is not tested. The bugs that slip through are
the ones that only appear at a *different* size, direction, or theme than the one you happened to
look at — a horizontal scrollbar at a short window height, a table header that stacks vertically on
a phone, a dialog whose content spills past the right edge in RTL. This skill turns "I looked at it
and it seemed fine" into a repeatable matrix sweep with **machine-checked** assertions, so a layout
bug cannot quietly survive.

The reason this matters: humans (and models) test at whatever window they have open — usually a
tall, wide desktop. Many layout bugs are invisible there and only manifest when a scrollbar appears
or space gets tight. You must go looking for those conditions on purpose.

## When to run

Run this after any change that is observable in a browser, and always before telling the user a
front-end task is done. If the change only touches code with no rendered surface (pure logic,
types, tests), skip it — there's nothing to look at.

## What you need

Any browser-automation tool that can: navigate, resize the viewport (width **and** height), run
JavaScript in the page, and screenshot. The built-in browser/preview tools work; so does Playwright
or Puppeteer. If no such tool is available, say so and fall back to reading the CSS/markup for the
red-flag patterns in the checklist below — but a real browser is strongly preferred, because these
bugs are emergent from layout and rarely obvious from source.

## The audit matrix

For **each surface** — every distinct page, and critically **every dialog/modal/drawer/popover**
that can open — sweep this matrix. Don't test only the page; open each overlay and test it too,
because dialogs are where most of these bugs hide.

| Axis | Values to cover | Why |
|---|---|---|
| Width | ~375 (mobile), ~768 (tablet), ~1280+ (desktop) | Catches stacking, wrapping, off-screen content |
| **Height** | at least one **short** height (~600px) | **The most-missed axis.** A short viewport forces a vertical scrollbar, which is what triggers a whole class of horizontal-overflow bugs |
| Direction | `dir=ltr` and `dir=rtl` if the app supports RTL | Logical-property mistakes and hard-coded left/right only show in RTL |
| Theme | light and dark, if the app themes | Hard-coded colours / `bg-white`-on-dark only show in one theme |

You don't need the full cross-product for everything — but you MUST cover: mobile width, a short
height (for each dialog), RTL if supported, and dark if supported. The short-height × dialog cell
is non-negotiable; it is the single highest-yield check.

## The core automated check: horizontal overflow

Horizontal overflow is the highest-frequency, highest-embarrassment layout bug, and it is trivial
to detect in code — so never rely on your eyes for it. After loading each surface (and after
opening each dialog, and after typing into fields that might grow), run the scanner in
[`references/overflow-scan.js`](references/overflow-scan.js). It reports:

- whether the **page** scrolls horizontally (`documentElement.scrollWidth > clientWidth`),
- the specific **elements** whose content exceeds their box and aren't inside a deliberate
  horizontal-scroll container (so you get a CSS selector to fix, not just "something overflows"),
- any element whose right edge extends past the viewport.

Read that file for the snippet and how to interpret its output. Paste it into the page via your
tool's "run JavaScript" action; it returns JSON you can act on directly.

**A wrapper that is *meant* to scroll horizontally** (a wide data table inside an
`overflow-x-auto` box) is not a bug — the scanner ignores content inside such containers. The bug
is when the **page** or a **dialog body** grows a scrollbar it was never supposed to have.

## Why short viewports expose overflow (the mechanism to internalise)

This is the trap that catches everyone, so understand it once:

- A scroll container with `overflow-y: auto` (a dialog body, a scrollable panel) makes the browser
  **compute `overflow-x` to `auto` as well** — you can't have `visible` on one axis and `auto` on
  the other. So the box *can* show a horizontal scrollbar even though you only asked for vertical.
- When a **vertical scrollbar appears** (because the viewport got short and content overflowed
  down), it **eats ~15px of width**. Any `width: 100%` child now overflows by that scrollbar width,
  and a form control's focus ring / dropdown arrow / date-picker button poking a few px past its
  box is enough to trip the now-active horizontal scrollbar.

Net effect: the dialog looks perfect on a tall screen (no vertical scrollbar, no trigger) and grows
an ugly horizontal scrollbar on a short screen. **The fix is almost always** to set
`overflow-x: hidden` on the scroll container (it should only ever scroll vertically), or to give a
genuinely wide child its own `overflow-x-auto` wrapper. But you can't fix what you never reproduce —
hence: **always open each dialog at a short viewport height and re-run the scanner.**

## Other things to verify per surface

- **Tables**: header cells align as real columns (not stacked vertically), and a too-wide table
  scrolls **inside its own container**, not by pushing the page. If you use a component-library
  table (e.g. Angular Material) with the native `<th>/<td>` element API, mismatched flex/table
  display can stack the header — verify it renders as columns at every width.
- **RTL**: the layout mirrors (actions, icons, alignment) and nothing is clipped at the start edge.
  Prefer logical CSS properties (`margin-inline-start`, `inset-inline-end`) over `left/right`.
- **Dark mode**: text stays readable, no element keeps a hard-coded light background that fights the
  dark canvas (unless that surface is intentionally a light card).
- **Console**: check for errors/warnings after interacting — a silent layout-affecting error counts.
- **Content that grows**: type into text fields, load rows into lists, expand sections — then
  re-scan. Growth is a common trigger you'll miss if you only test empty states.

## Report format

Produce a compact pass/fail matrix the user can trust. Prefer this shape:

```
## UI audit — <feature/page>
| Surface | Mobile 375 | Short-height dialogs | RTL | Dark | Notes |
|---|---|---|---|---|---|
| List page | ✅ | ✅ | ✅ | ✅ | table scrolls in-wrapper |
| Add dialog | ✅ | ✅ (fixed overflow-x) | ✅ | ✅ | — |
```

For every ❌, give: the exact condition, the offending element's selector (from the scanner), and
the root cause — not just "it scrolls". Attach a screenshot for anything visual. If you fixed
something mid-audit, note it and re-run that cell to prove the fix. **Never report a surface as
passing at a size you did not actually load.**

## Honesty rules

- If a tool limitation stopped you from testing a cell (e.g. you couldn't switch theme), say so —
  don't imply you covered it.
- Reproduce a bug before claiming you fixed it, and re-run the failing cell after the fix. A fix you
  can't reproduce the bug for is a guess.
- The default assumption is that an untested size *has* a bug until you've loaded it. Go find the
  conditions; don't wait for them to find your users.
