---
name: i18n-locale-sync
description: >-
  Keep a project's translation/locale files in perfect sync - add new user-facing keys to EVERY locale at once (never just the default language), verify all locales have identical key sets, and catch hard-coded UI strings that bypass i18n. Use WHENEVER you add or change user-facing text in an internationalised app, or the user says 'add a translation', 'add the i18n keys', 'did I miss any Arabic/French keys', 'check the locales are in sync', 'are the translation files consistent', or is building a feature with new labels, messages, placeholders, or validation text. Reach for it right after writing UI text with a t()/transloco/i18n reference, because the classic bug is adding a key to en and forgetting the other locale files - the app then shows a raw key or falls back silently for other-language users, and nothing in the build catches it. Framework-agnostic: handles JSON, ARB, YAML, and gettext (.po) across react-i18next, Transloco/ngx-translate, vue-i18n, Flutter, and plain key/value setups.
---

# i18n Locale Sync

Translations rot the moment they drift. The overwhelmingly common failure is asymmetric edits: you
add `"AddRevenue": "Add Revenue"` to `en.json`, ship it, and every Arabic/French/… user sees the
raw key `AddRevenue` (or a silent fallback) because you never added it to `ar.json`/`fr.json`. The
build is green; the bug is invisible until someone switches language. This skill makes "add a
string" mean "add it to **all** locales, and prove they still match."

The second failure is strings that never went through i18n at all — a hard-coded label sitting in a
template. Those are worse because they can't even be translated. Catch them at authoring time.

## Step 1 — Find the locale files and the framework

Locate the translation files and infer the setup. Look for a `locales/`, `i18n/`, `lang/`, or
`translations/` directory, or config pointing at one. Recognise the format from the extension and
shape:

| Format | Looks like | Common in |
|---|---|---|
| JSON | `{ "Key": "Text" }`, possibly nested | react-i18next, Transloco, ngx-translate, vue-i18n |
| ARB | JSON with `@key` metadata siblings | Flutter |
| YAML | `key: Text` | Rails, vue-i18n, some Vue setups |
| gettext `.po` | `msgid "Key"` / `msgstr "Text"` | gettext-based stacks |

Identify the **default/source locale** (usually `en`) and **all target locales**. If there are
namespaced files (`en/common.json`, `en/auth.json`), treat each namespace as its own set to keep in
sync across languages. When unsure which files are authoritative, ask rather than guess.

## Step 2 — Add keys to every locale, together

When introducing new text:

- Add the key to **the source locale and every target locale in the same edit pass** — never leave
  a target for "later". "Later" is how drift happens.
- **Key naming reflects meaning, not screen position** (`SaveChanges`, not `TopRightButton`) so the
  same key survives layout changes.
- For target locales you can translate, do; if you genuinely can't translate a language, still add
  the key with the best value you can and **flag which locales need a human translator** — an
  explicit TODO beats a silently missing key, because at least the key exists in every file.
- Respect the framework's interpolation syntax (`{{name}}`, `{name}`, `%{name}`, `%s`) and
  pluralization rules — copy the shape the file already uses.
- Preserve file conventions: sort order (alphabetical vs. append-at-end — match what's there),
  nesting depth, indentation, trailing-comma/JSON validity.

## Step 3 — Verify parity (run the checker)

After editing, prove the locales match. Run
[`scripts/locale_parity.py`](scripts/locale_parity.py) against the locale directory (or pass files
explicitly). It loads every locale, computes the union of keys, and reports **per locale** which
keys are missing and which are extra, plus any file that fails to parse. Zero missing / zero extra
across the board is the goal.

```
python scripts/locale_parity.py path/to/locales
# or point at specific files / a glob
python scripts/locale_parity.py public/i18n/en.json public/i18n/ar.json
```

Read the script header for options (it handles JSON, ARB, YAML, and `.po`, and flattens nested
keys). If Python isn't available, do the same check by hand: load each locale, diff the key sets
against the source, and report gaps — but the script is faster and less error-prone, so prefer it.

**Do not report the task done while the checker shows any locale missing keys.** A missing key is
the exact bug this skill exists to prevent.

## Step 4 — Catch hard-coded strings (authoring-time hygiene)

While you're in the UI code, scan the templates/components you touched for user-facing text that
**didn't** go through the i18n mechanism — a bare `<span>Add Revenue</span>`, a `placeholder="Search"`,
a `title="Delete"` with no `t()`/`transloco`/`i18n` wrapper. These can't be translated at all. Flag
them (or fix them by extracting a key into all locales). Heuristics that work well:

- Text nodes and `placeholder`/`title`/`aria-label`/`alt` attributes containing letters, inside
  component/template files, that aren't wrapped in the project's translation call.
- Be pragmatic: ignore code identifiers, class names, icon names, URLs, and dev-only strings. The
  target is *human-readable UI copy* a user would see.

Don't turn this into a whole-repo audit unless asked — focus on the files the current change
touched. A full sweep is a separate, explicit request.

## Report

State plainly: which keys were added, to which locales; the parity result (ideally "all N locales in
sync, 0 missing"); any locales flagged for human translation; and any hard-coded strings found (fixed
or flagged). If parity still shows gaps, that's a failure to resolve, not a footnote.

## Why this is worth a skill

Because the cost is asymmetric: adding a key everywhere takes seconds; a missing key ships a broken
UI to an entire language's users and survives every automated check. The discipline — *all locales,
every time, then prove it* — is simple, and simple disciplines are exactly what benefit from being
codified so they happen without relying on memory.
