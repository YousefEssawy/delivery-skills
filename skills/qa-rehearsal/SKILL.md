---
name: qa-rehearsal
description: |
  Test a finished story the way QA will, before it is handed to QA (for example moved to Ready To
  Test): read every acceptance criterion literally, split it into atomic claims, and try each claim
  live on the test environment with the edge cases QA always tries (the product's languages, with
  Arabic and RTL cases when the product supports them, boundaries, paging, account states,
  concurrency, every error key, real-browser UI states). Records PASS / FAIL / NOT PRODUCIBLE /
  AMBIGUOUS per claim with evidence. Works with any issue tracker (Jira, Linear, GitHub Issues...).
  Use when a story or a batch is about to go to QA, after a deploy to the test environment, or when
  the user says "QA rehearsal", "test it like QA", "make sure QA finds nothing", "جرب زي الـ QA", "عايز QA متلاقيش بجز", "اتأكد من الـ AC".
---

# qa-rehearsal

A claim nobody tried live is not a pass. On one project QA filed a bug because a criterion said
"prefix **or contains**" and only the prefix half had been tried. This skill exists to try both.

## 1. Read the story live

- Read the story from the issue tracker (Jira, Linear, GitHub Issues...): description and **every**
  comment. Product-owner comments amend the criteria; apply them. A saved copy is a cache, not the source.
- Read the decision register and any decision the story cites.
- Skip stories already Done (or the tracker's equivalent closed status; status names vary per
  team): never reopen or comment on them.

## 2. Split every criterion into atomic claims

Every "or", "and", list item, field, error key, number, limit, default, ordering word ("newest
first"), language rule and state is its own claim. Write the claim list first, in the output file,
before testing anything.

When a claim can be read two ways, write both readings, say which one the code follows, and mark it
AMBIGUOUS. Those go to the product owner as questions, all at once at the end.

## 3. Try each claim live

Use the test environment through a local console or tool that keeps tokens out of the chat, or the
real web page for UI. For each claim, include the cases QA always tries:

- **Text and language (every product):** a word from the **middle** of a word, one character, the
  maximum length, max+1, only spaces, emoji, leading and trailing spaces, a well-formed locale tag
  such as `en-US`, and text in every language the product supports.
- **Arabic and RTL (when the product supports Arabic or another RTL language):** Arabic letter forms
  (أ/إ/آ/ا, ة/ه, ى/ي), diacritics, tatweel, Arabic-Indic and Western digits, mixed Arabic and
  English.
- Adapt the language cases to the product's languages: for each one, add its own traps (accents and
  case folding for French or German, Turkish dotted and dotless i, full-width characters for CJK,
  and so on).
- **Boundaries:** min-1 / min / max / max+1, empty, null, missing field, unknown field, wrong type.
- **Paging:** page 1 -> 2 -> 3 with no repeat or skip, the last page, a changed filter with an old cursor.
- **Account and relationship states:** restricted, muted, suspended, blocked, deleted, private
  accounts, a block between the two members, hidden or deleted content.
- **Concurrency:** two requests at the same moment wherever the story talks about counts,
  uniqueness or ordering. The losing request must get the **documented** error, not a bare 409.
- **Every error key the story lists:** produce it and check the envelope (status, error code,
  `details[].field`, params).
- **Web UI:** in a real browser, every supported language (both directions when the product has
  RTL), light and dark if themed, phone, tablet (the project's tablet breakpoints, for example 912
  and 1032 px wide) and desktop. Open every dialog the story touches, open each select **by clicking
  it**, and, in an RTL language, look at every empty field (an empty field with `dir="auto"` renders
  left to right). Keep a screenshot.

Shared test accounts: anything that changes an account or a relationship (status, privacy, block,
follow, role) takes a lock file first, restores the exact previous state, then releases it. Hold it
at most 10 minutes. Write only to records and accounts marked as test data, and undo them.

Never type a password or token; the user signs in. Never write to an account that is not test
data without the user's explicit word, and stop if the permission system refuses.

## 4. Record

Per claim: claim -> what was done -> result -> correlation id or screenshot -> outcome:

- **PASS**
- **FAIL** - with the smallest fix
- **NOT PRODUCIBLE ON THE TEST ENVIRONMENT** - only with the automated test that covers it, named
- **AMBIGUOUS** - both readings, which one the code follows, the question for the product owner

Write the file as you go, so a fresh session can continue from it. At the end: per story READY or
GAPS, the FAIL list with fixes, the AMBIGUOUS list as one message for the product owner, and what
could not be undone.

## 5. After the rehearsal

- FAILs are fixed test-first, with a regression test named after the story and the finding.
- AMBIGUOUS answers go into the decision record before building, never after QA.
- Decided behaviour and known limits go into the story's evidence comment, under a heading QA will
  read, with the decision's key. Bugs that are "not a bug" usually come from QA not knowing them.
- A bug in a shared component is checked on every screen that uses it.
