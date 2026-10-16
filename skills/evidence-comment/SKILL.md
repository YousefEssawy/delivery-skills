---
name: evidence-comment
description: |
  Write the comment that hands a story to QA: the build or commit deployed, what changed per
  acceptance criterion, the live checks with request, result and correlation id (or screenshot),
  the automated tests by name, a "Decided behaviour and known limits" section citing decision keys
  so QA does not file them as bugs, and what could not be produced on the test environment with the
  test that covers it. Re-reads the story status first (never comments on a Done story), shows the
  exact text before posting, uses the tracker's real mention syntax and formatting (Jira wiki
  markup, Markdown for GitHub or Linear) and checks the posted comment rendered. Use after a deploy
  to the test environment, before a story goes to QA, or when the user says "write the evidence
  comment", "comment on the story", "hand it to QA", "اكتب كومنت الـ evidence", "اكتب الكومنت
  على الستوري", "جهز الكومنت لـ QA".
---

# evidence-comment

QA reads one comment before testing. If it says what was built, how it was checked and what is
decided, QA tests the right thing and files fewer "bugs" that are decisions.

## 1. Before writing

- Re-read the story live: status, description and every comment. A saved copy is a cache.
- **Story already Done:** do not comment. Tell the user and stop.
- Confirm what is deployed on the test environment (build number, commit SHA, deploy run) and that
  it contains the story's commits.
- Collect the evidence that already exists: live checks (`qa-rehearsal` output, smoke file), test
  names from the gate run, decision keys from the decision register. Do not write a check that was
  not run.

## 2. Sections

| Section | Content |
|---|---|
| Build | Environment, build or deploy id, commit SHA. |
| Changes per criterion | One line per acceptance criterion: what now happens. Same numbering as the story. |
| Live checks | Per check: request (method, path, key input) or screen, the result (status, key fields), correlation id or screenshot. |
| Automated tests | Test names (class.method or file::test), grouped per criterion, with the run totals. |
| Decided behaviour and known limits | Each behaviour QA might read as a bug, with the decision key or comment that settles it. |
| Not producible on the test environment | What could not be triggered there, why, and the named test that covers it. |

Leave out a section that has nothing in it, except "Decided behaviour and known limits": write
"None" so QA knows it was considered.

## 3. Rules

- **Show the exact text to the user before posting.** Post only after their yes, as written.
- **Mentions:** use the tracker's real mention syntax, never a plain `@name` that does not link.
  After posting, open the comment and check the mention rendered as a link to the person. If it did
  not, fix the comment.
- No tokens, passwords, personal data or internal hostnames in the comment. Correlation ids and
  test account handles are fine.
- Do not move the story to the QA status unless the user says so.

## 4. Tracker formatting

- **Jira, wiki renderer (REST v2 or the text editor's wiki mode):** `h3.` headings, `*bold*`,
  `{{inline code}}`, `{code}...{code}` blocks, `* ` bullets, tables as `||head||head||` then
  `|cell|cell|`. Markdown backticks and `###` do not render. Mention: `[~accountid:<id>]`.
- **Jira, REST v3:** the body is Atlassian Document Format (JSON). Wiki markup is not parsed; a
  mention is an ADF `mention` node carrying the account id.
- **GitHub Issues:** Markdown. Mention: `@username`.
- **Linear:** Markdown. Mentions are stored in Linear's own form; copy the form that a mention made
  in the editor produces, then check it rendered.
- **Other trackers:** check the editor's format, and preview before posting when the tracker allows.

Convert the template below to the tracker's format before showing it to the user, so the user
approves exactly what will be posted.

## 5. Template (Markdown)

```markdown
**Deployed:** <env>, build <id>, commit `<sha>`

### Changes per criterion
1. AC1 - <what now happens>
2. AC2 - <what now happens>

### Live checks
| AC | Request / screen | Result | Correlation id / screenshot |
|---|---|---|---|
| 1 | `<METHOD> <path>` <key input> | <status>, <key fields> | `<id>` |

### Automated tests
- AC1: `<TestName>`, `<TestName>`
- Run: <passed> passed, <failed> failed, <skipped> skipped

### Decided behaviour and known limits
- <behaviour> - <decision key or comment link>

### Not producible on the test environment
- <case> - <why> - covered by `<TestName>`

<mention of the QA owner>
```

## 6. Example (Markdown, neutral data)

```markdown
**Deployed:** test, build 412, commit `9f3c2ab`

### Changes per criterion
1. AC1 - Searching items matches the name prefix and any word inside the name.
2. AC2 - Results are paged, 20 per page, newest first.
3. AC3 - An empty query returns `400` with error `search.query_required`.

### Live checks
| AC | Request / screen | Result | Correlation id / screenshot |
|---|---|---|---|
| 1 | `GET /items?q=lamp` | 200, 3 items incl. "Desk lamp" | `c1a7-55e2` |
| 2 | `GET /items?q=a&page=2` | 200, 20 items, no repeat from page 1 | `c1a7-55f0` |
| 3 | `GET /items?q=` | 400, `search.query_required` | `c1a7-5603` |
| 1 | Search screen, phone width, dark mode | matches shown | screenshot-ac1.png |

### Automated tests
- AC1: `ItemSearchTests.Matches_prefix`, `ItemSearchTests.Matches_word_inside_name`
- AC3: `ItemSearchValidatorTests.Empty_query_is_rejected`
- Run: 214 passed, 0 failed, 0 skipped

### Decided behaviour and known limits
- Search ignores letter case and accents - DEC-14.
- Deleted items never appear, even to their owner - comment by the product owner on this story.

### Not producible on the test environment
- Search timeout after 2 s - the test data is too small - covered by `ItemSearchTests.Times_out_with_error_key`.

@qa-owner
```
