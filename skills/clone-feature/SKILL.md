---
name: clone-feature
description: >-
  Build a new feature by faithfully replicating an existing gold-standard feature's entire file-and-wiring chain for a different entity - learning the project's own patterns from a reference module instead of an outside template. Use WHENEVER a new feature is a parallel of one that already exists and the user says 'add a module like X', 'mirror the Y feature for Z', 'scaffold a CRUD feature following our existing pattern', 'do the same thing we did for Orders but for Invoices', or is about to hand-copy a module layer by layer. Especially valuable in pattern-heavy codebases (layered backends, component-based frontends) where a feature spans a dozen files and the work is getting every layer and integration point right and consistent. Stack-agnostic - it reads what the reference does and matches it. Reach for it before manually cloning files, because the failure mode of hand-cloning is a missed wiring point (route, nav entry, translation, DI registration) that compiles but leaves the feature half-connected.
---

# Clone Feature

Most features in a mature codebase are not novel — they are the tenth variation on a shape the
project already has: an entity with CRUD, a list page, a form, some tests, and a handful of places
where it plugs into the app (routing, navigation, i18n, dependency injection, a dashboard tile).
The value here is *not* generating clever code; it's replicating a proven shape **exactly**, in the
project's own idiom, without missing any of the small wiring points that make the difference between
"it builds" and "it actually works end to end".

This skill deliberately learns the pattern **from the repository itself** — a reference feature you
or the user point at — instead of from a fixed template. That is what makes it portable across
stacks: the "correct" way to structure a controller, a component, or a test is whatever the
reference already does. Your job is to see that shape clearly and reproduce it for the new entity,
adjusting only for the genuine differences.

## Step 1 — Pin the reference feature

Identify the single existing feature that most closely resembles the target. Ask the user if it
isn't obvious ("Which existing module should I mirror?"). A good reference is:

- recently written / actively maintained (it reflects current conventions, not legacy),
- the same *kind* of thing as the target (a per-entity CRUD module → mirror another per-entity CRUD
  module, not a settings singleton),
- explicitly blessed if the project names a "gold standard" in its docs (CLAUDE.md, README,
  contributing guide) — read those first; they often name the canonical module and its rules.

Don't invent structure. If two references disagree, prefer the newer one and say which you chose.

## Step 2 — Map the reference's full chain

Read the reference feature end to end and produce an explicit **file map**: every file it consists
of, grouped by layer, plus the naming convention each follows. Include the tests. Miss nothing —
the whole point is completeness. For a layered backend that's typically entity → config/migration →
repository → service → request/response models → validators → controller → tests; for a
component-based frontend it's model(s) → service → list/detail/form components → module/routing →
plus its slice of shared registrations.

If the reference is large or spans many folders, map it with a directory/`grep` sweep first, then
read per-cluster — you don't need to hold every line in your head, only the shape and the names.

## Step 3 — Enumerate the WIRING points (the part that gets missed)

Separately from the feature's own files, list every place the reference **touches shared,
cross-cutting infrastructure**. These are the silent-failure spots — code that compiles fine while
the feature stays half-connected. Read [`references/wiring-checklist.md`](references/wiring-checklist.md)
and walk it against the reference: for each item, find where the reference registers itself, so you
know exactly where the clone must register too. Common misses:

- route table / router registration and lazy-load entry
- navigation / sidebar / menu entry (and any compact/mobile variant)
- dependency-injection or module registration (if not by-convention)
- **every translation/locale file** (adding a key to one locale and not the others)
- a dashboard tile, a summary total, a search index, an export — anything aggregated
- API-endpoint constants / route constants tables (projects that forbid inline URLs)
- test fixtures, seed data, mock/stub data used by a dev-preview or storybook

## Step 4 — Build the transform plan

Before writing, state the mapping plainly:

- **Rename**: `ReferenceEntity → NewEntity` everywhere (class names, files, routes, keys, DB names).
- **Field diff**: which fields differ from the reference (added, removed, renamed, retyped).
- **Intentional divergences**: where the clone *must not* match the reference — different roles,
  different visibility (e.g. admin-only vs. also-owner), different validation, an extra/omitted
  layer. Call these out loudly; they are the changes most likely to be wrong if you autopilot.

Present this plan if the divergences are non-trivial, so the user can correct a wrong assumption
before you generate a dozen files.

## Step 5 — Generate, matching the reference's style

Create each file by following its reference counterpart: same structure, same ordering, same
comment density and idiom, same test style. Adjust only for the field diff and the intentional
divergences. Read the reference file open beside the one you're writing — don't reconstruct it from
memory, and don't "improve" it into a different style; consistency across the codebase is worth more
than any local preference.

Then wire every point from Step 3. A useful discipline: after generating, go back through the
wiring checklist and confirm each item is done for the clone, the same way it was done for the
reference.

## Step 6 — Verify

Build. Run the tests (the cloned tests plus anything you touched). Fix until both are clean. For a
front-end feature that renders, follow up with a browser check across sizes/themes — the
`ui-responsive-audit` skill is the natural companion here. Report: the files created (by layer), the
endpoints/routes and any role/visibility rules, the wiring points touched, tests run, and — this is
important — an explicit list of where the clone **intentionally differs** from the reference, so the
divergences are a documented decision, not a surprise.

## Anti-patterns to avoid

- **Importing an external template.** The reference is the template. If your output doesn't look
  like the rest of the repo, you've done it wrong even if it works.
- **Silent wiring gaps.** A feature that builds but has no nav entry, or a translation present in
  one language and missing in another, is the signature failure of hand-cloning. The checklist
  exists to prevent exactly this.
- **Autopiloting past the divergences.** The reference is admin-only and the new one should be
  visible to owners too? That's the whole point of the task and the easiest thing to copy wrong.
  Slow down on the differences.
- **Over-cloning.** If a reference file genuinely has no analogue for the new entity, don't clone it
  just to match. Match the *shape*, not the file count.
