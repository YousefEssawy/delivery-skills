---
name: date-kind-guard
description: >-
  Decide the correct KIND of a date/time field - calendar date, instant, or wall-clock - and wire its storage, send/serialize path, display, and any range filter so the value never shifts across timezones. Use WHENEVER you add or change a date/time field end to end, or the user reports 'the date shows the wrong day', 'it's off by one day', 'a timezone bug', 'the day changes for some users', 'the time is an hour off', or when building date pickers, date-range filters, calendars, schedules, check-in/out, due dates, or timestamps. Reach for it BEFORE writing the field, because the classic bug - new Date(picked).toISOString() on a calendar date, or displaying a date without pinning UTC - silently moves the day by one for every user whose offset differs from the server's, and hides completely when developer and data share a timezone. Framework-agnostic; the calendar/instant/wall-clock distinction and the send/display/filter rules apply to any stack (JS/TS, .NET, Java, Python, Go, SQL).
---

# Date Kind Guard

Almost every "off by one day" or "time is an hour wrong" bug comes from treating three genuinely
different things as if they were one. A date/time value is always exactly one of these kinds, and
each needs different handling at **every** layer — storage, the wire, display, and filtering. Pick
the wrong kind, or handle one layer inconsistently with the others, and the value shifts for anyone
whose timezone differs from yours. The bug is invisible when you test in the server's timezone,
which is why it ships.

The entire skill reduces to: **classify the field first, then apply that kind's rules on both ends,
consistently.** Do the classification before writing code.

## Step 1 — Classify the field (one question)

Ask: **"If a viewer in a different timezone opens this, should the digits change?"**

| Kind | The question's answer | What it represents | Examples |
|---|---|---|---|
| **Calendar date** | No — and there is **no time of day** | A specific day on the calendar | birthday, invoice date, holiday, rental start/end, check-in day, due date |
| **Instant** | **Yes** — different viewers should see it localised | A single moment in world time | `createdAt`, `updatedAt`, `lastLogin`, audit timestamps |
| **Wall-clock** | No — everyone must read the **same** clock, and it **has** a time of day | The clock a human typed, replayed unchanged | a store's "opens 09:00", a scheduled cleaning at 14:30 that all staff must see as 14:30 |

If it has no time-of-day meaning → **calendar date**. If it's a moment that should localise →
**instant**. If it's a typed clock everyone must read identically → **wall-clock**. When genuinely
unsure, ask the user which behaviour they want; don't guess, because the three look identical in a
single-timezone test.

## Step 2 — Apply the kind's rules on BOTH ends

The rules below are stack-neutral. The exact helper names differ per project — **match whatever the
codebase already uses** (search for how an existing field of the same kind is handled and copy that
pattern). What must stay constant is the *behaviour* at each layer.

### Calendar date

The value is a day, not an instant. The trap is letting any layer reinterpret it in a timezone.

- **Store** as a date-only type (`DATE`, `LocalDate`, `DateOnly`) — not a timestamp. If your stack
  forces a datetime, anchor it at **UTC midnight** and never localise it.
- **Send / serialize**: emit the Y-M-D anchored at UTC midnight (e.g. `2026-07-30T00:00:00Z` or a
  bare `2026-07-30`). **Never** build it from a local-midnight `Date` and call `.toISOString()` —
  that yields the *previous* day for any positive-offset user (local midnight July 30 is
  `2026-07-29T21:00Z` at UTC+3). Use the project's calendar-date send helper.
- **Display**: format in **UTC** (pin the timezone), e.g. `date:format:'UTC'`. A bare format renders
  in the viewer's zone and can show the day before.
- **Filter a calendar column** by an inclusive `[fromDay, toDay]` in the same UTC-anchored form.
- **Pre-fill a date picker**: use the project's picker-specific helper — some UI date adapters read
  a JS Date's UTC components, so a local-midnight value shows the previous day. (This is a real,
  separate gotcha from display.)

### Instant

The value is a moment; localising it is correct and desired.

- **Store** as a timestamp with offset/UTC (`timestamptz`, `DateTimeOffset`, `Instant`).
- **Send**: ISO-8601 with `Z` or an offset — `.toISOString()` is correct here.
- **Display**: format in the **viewer's local zone** (no UTC pin) — that's the whole point.
- **Filter an instant column** for "day X in the user's zone": the range is
  `[local-midnight(X) → UTC, local-midnight(X+1) → UTC)` — a **half-open** range whose bounds depend
  on the **client's** offset, so the offset must come from the client. Do **not** filter an instant
  column with the calendar-date helper; it starts the range at UTC midnight and drops rows recorded
  in the first hours of the local day. (This is the mirror-image mistake of the calendar case.)

### Wall-clock

The value is a typed clock everyone must read identically. This is the subtle one.

- **Store** as an offset-carrying type (`DateTimeOffset`, `timestamptz`) where the **offset rides
  inside the value** — and **never add a separate timezone column**.
- **Send**: include the sender's offset, e.g. `2026-07-16T09:00:00+03:00`. **Never** `.toISOString()`
  — it converts to `Z` and throws the offset away *before* storage, so the field silently degrades
  into an instant and can't be recovered.
- **Display**: render in the **stored offset**, not the viewer's zone, so everyone sees the typed
  clock. A bare local format re-localises and shows a different time.
- Instant math still works: `09:00+03:00` **is** `06:00Z`, so ordering, duration, and range filters
  are unaffected — only the *rendered* clock is pinned.

## Step 3 — Verify both halves are consistent

The signature of these bugs is a **half-fix**: the send side is right but the display isn't, or vice
versa — and the two mistakes can cancel out for same-timezone users and hide for months. So after
wiring a field, confirm **send, storage, display, and filter all agree on the kind**. A quick mental
test: imagine the writer at UTC+3 and the reader at UTC-5 — does the value still mean the same thing
the field is supposed to mean? If a calendar date still shows the same day, an instant shows each
their own local time, and a wall-clock shows the same clock to both, it's wired correctly.

## Reporting

State the classification and the four decisions (store / send / display / filter) explicitly, so the
choice is a documented decision rather than an accident. If you changed an existing field's kind,
note the migration implication (e.g. calendar→wall-clock needs an offset-carrying column).

## Why a whole skill for dates

Because these bugs are **silent, timezone-dependent, and cancel out in the author's own testing** —
the worst combination. They pass review, pass tests written in the server's zone, and surface only
in production for users in other regions. Codifying "classify first, then handle every layer to
match" is cheap insurance against a class of bug that is otherwise found by customers, not by CI.
