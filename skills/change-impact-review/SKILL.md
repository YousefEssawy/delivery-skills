---
name: change-impact-review
description: |
  Mandatory pre+post-flight review for ANY modification, deletion, replacement, rename,
  or refactor — auto-triggers PROACTIVELY whenever the user asks to edit, modify, update,
  change, fix, replace, delete, remove, rename, move, refactor, swap, override, patch,
  adjust, or correct anything — in English OR Arabic (عدّل، غيّر، احذف، استبدل، صحّح،
  حدّث، انقل، أعد تسمية، أعد هيكلة، صلّح، اظبط، امسح، شيل). Also triggers on any task
  touching dates, prices, event titles, email templates, notifications, landing pages,
  or PDF reports. Runs the 5 phases: full-codebase Search-First, Cross-Layer Audit
  (DB/Backend/Frontend/Email/SMS/PDFs/i18n/Docs/Marketing), Source-of-Truth check,
  Verification grep, Report Back. Exists because hardcoded duplicates caused a real
  client-facing incident (email broadcast with wrong date). Use even for "quick fixes".
---

# Change Impact Review — Skill

> **Golden rule:** every change to code or to a value must be followed by a **full review of every
> place it affects** — even when the link is not obvious or not direct.

## When this skill runs (Auto-Trigger Matrix)

| Signal in user message | Action |
|---|---|
| Any Arabic trigger word (عدّل، غيّر، احذف، استبدل، صحّح، حدّث، انقل، أعد تسمية…) | Run all 5 phases |
| Any English trigger word (edit, modify, update, change, fix, replace, delete, remove, rename, move, refactor, swap, override, patch, adjust, correct) | Run all 5 phases |
| User mentions: a date, price, event title, product name, email template, notification, landing page, PDF report | Run all 5 phases even if no explicit trigger word |
| User says "quick fix" / "small change" (Arabic: "حاجة بسيطة" / "تغيير سريع") | Run all 5 phases anyway — "quick fixes" are the highest-risk category |

## The 5 Mandatory Phases

### Phase 1 — Pre-Change Discovery (Search-First)

Before touching a single line:

1. **Identify the change scope.** Ask: what's the OLD value? What's the NEW value? What field/file/string/component/route/ID is affected?
2. **Run a full-codebase search for the OLD value** in every form:
   - Exact match
   - All casing variants (camelCase, snake_case, kebab-case, UPPER_CASE, PascalCase)
   - All supported languages (ar, en, fr, etc.) in i18n files
   - Both in code and in seed/migration/fixture files
3. **List every hit** with file path + line number before deciding the change plan.

```bash
# Reference search commands
grep -ri "<OLD_VALUE>" . --exclude-dir=node_modules --exclude-dir=.git
grep -ri "<OLD_VALUE_camelCase>" .
grep -ri "<OLD_VALUE_kebab-case>" .
# For dates, check multiple formats:
# (include the formats of every language the product uses, e.g. Arabic "2 يونيو 2026")
grep -rE "(2026-06-02|02/06/2026|June 2, 2026|2 يونيو 2026)" .
```

### Phase 2 — Cross-Layer Audit

Walk through EVERY layer below and confirm the value is/isn't present. Do not skip layers because "I'm sure it's not there":

| Layer | What to check |
|---|---|
| **Database** | Seed files, migrations, fixtures, default values, lookup/enum tables, stored procedures, views |
| **Backend** | Controllers, services, DTOs, validators, business rules, response messages, error strings |
| **Frontend** | Components, pages, constants files, route configs, hardcoded JSX strings, alt texts, aria-labels |
| **Email Templates** | HTML, MJML, Markdown, plain text — EVERY broadcast template AND every transactional template |
| **SMS / Push / WhatsApp** | Notification templates, push payloads, WhatsApp Business templates, in-app banners |
| **Document Generators** | PDF templates, Word templates, Excel exports, invoice generators, certificate generators |
| **Documentation** | README, User Manual, System Overview, API docs, Credentials Document |
| **Marketing** | Landing pages, blog posts, social media drafts, meta tags, OG images, schema.org JSON-LD |
| **i18n** | EVERY locale file in EVERY supported language |
| **Config / Env** | CI/CD secrets and variables (e.g. GitHub Actions secrets, GitLab CI variables), env files, deployment manifests, feature flag configs |
| **Tests** | Unit, integration, e2e — snapshots and fixtures included |

### Phase 3 — Source of Truth Check

For every value the change touches:

- Is there a **single source of truth**? (Preferred: database row, or a `constants.ts`, or a config service.)
- If duplicates exist:
  - **Best case:** refactor so the duplicates read from the SOT dynamically.
  - **Acceptable fallback (time-constrained):** update ALL copies to match, AND log explicit tech debt with an issue in the project's tracker (GitHub Issues, Jira, Linear...) + comment-banner above each copy: `// DUPLICATED VALUE — see issue #N`.
  - **Forbidden:** updating one copy and leaving the others stale "because nobody will notice."

### Phase 4 — Verification Pass (Before You Say "Done")

Run a hard verification before declaring the change complete:

```bash
# 1. No residue of the old value (allow only changelog/history files)
grep -ri "<OLD_VALUE>" . --exclude-dir=node_modules --exclude-dir=.git --exclude="CHANGELOG*"
# Expected: 0 results

# 2. New value count matches expectation
grep -rci "<NEW_VALUE>" . --exclude-dir=node_modules --exclude-dir=.git
# Expected: matches the count from Phase 2 audit

# 3. Visual smoke test on every user-facing surface that touches the value
#    - Render at least one email template with the new value
#    - Open at least one affected page in dev mode
#    - Generate at least one PDF/Excel sample
```

If a staging or test environment is available: deploy and smoke-test there before production.

### Phase 5 — Report Back

Always end the change with a structured report in chat:

```
Change Impact Report
====================
Change:           <OLD>  ->  <NEW>
Files modified:   <count>
  - path/to/file1 (line N)
  - path/to/file2 (line N)

Audited but unaffected (proof of due diligence):
  - email templates: <list>
  - DB seeds: <list>
  - i18n files: <list>

Tech debt discovered:
  - <duplicate value pattern> -- opened issue #N

Needs human review:
  - <ambiguous area> -- see <file:line>

Verification:
  - grep "<OLD>" -> 0 hits
  - grep "<NEW>" -> N hits (matches plan)
  - Smoke-tested: <surface 1>, <surface 2>
```

## High-Risk Change Categories (Extra Care Required)

When ANY of these appears in the change, treat as P0 and double-check everything:

- **Dates / times / timezones** of public events, deadlines, launches
- **Prices, fees, discount codes, taxes, currencies**
- **Event titles, product names, brand names, person names**
- **Email subject lines, sender names, sender addresses**
- **URLs, redirect targets, deep links, tracking parameters**
- **Database IDs, foreign keys, primary key types, enum values**
- **Authentication scopes, permissions, role names**
- **Public API endpoint paths or response shapes**

## Anti-Patterns (Forbidden)

- "I'll just fix this one file" — without a scan
- Assuming "the email reads from the database" — without verifying the template source
- Copy-pasting a date/price/title in multiple places "for speed"
- Closing the task without Phase 4 verification
- Relying solely on IDE find-and-replace without grepping casing variants and translations
- Skipping Phase 5 report ("the diff speaks for itself" — no, it doesn't)

## Integration with Other Skills

Use these when they are installed (check the available-skills list; never guess a name):

- A code-review skill (for example `code-review` or `review-all`) — Change Impact Review is a precondition for opening a PR.
- A tech-debt skill, when duplicates are found that can't be deduped now.
- A deploy-checklist skill, before any production deploy that touches user-facing values.
- `i18n-locale-sync`, when the change touches translation files.

## Origin

This skill was created after a real client-facing incident on 2026-06-02 where an
email was broadcast with a hardcoded date that had been updated in only one of three
locations. The cost was relationship-level, not technical. This skill exists so the
incident class is closed permanently across all projects.
