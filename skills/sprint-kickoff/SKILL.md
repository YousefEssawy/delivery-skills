---
name: sprint-kickoff
description: |
  At the start of a sprint, before any code: read every story in the sprint with all its comments
  and the decision register, then find criteria that contradict each other or an earlier decision,
  criteria that can be read two ways ("or", "and/or", "such as", open lists, unclear limits),
  missing error keys, limits and empty states, cross-story dependencies, and criteria that cannot
  be tested. Produces one message for the product owner with numbered questions (both readings
  quoted, plus the reading you would build), a dependency order, and the tests each criterion
  needs. Saves each story locally as a cache with its last-updated time; the board stays the
  source of truth. Use when a sprint starts, when stories are added to a sprint, or when the user
  says "start the sprint", "read the sprint stories", "what is unclear in this sprint", "ابدأ
  السبرنت", "اقرا ستوريز السبرنت", "ايه الأسئلة اللي محتاجين نسألها للـ PO".
---

# sprint-kickoff

A question asked on day one costs one message. The same question found by QA costs a bug, a fix
and a re-test. Read the whole sprint once, ask everything at once, then build.

## 1. Read the sprint

- List every story in the sprint from the tracker (Jira, Linear, GitHub Issues or other), with
  key, title, status, assignee, linked issues and last-updated time.
- For each story read the description, the acceptance criteria and **every** comment. Comments by
  the product owner amend the criteria; apply them and note which comment changed what.
- Read the decision register and every decision a story cites. Read the API contract or design a
  story links to.
- A story that cannot be read (no permission, deleted) is reported, not guessed.

## 2. Save a local cache

Save each story as one file (for example `stories/<key>.md`) with the full text, the comments, the
tracker's last-updated time and the time it was read. Write at the top:

> Cache of `<key>` read at `<time>`, last updated on the board at `<time>`. The board is the source
> of truth; re-read it before starting, before review and before reporting done.

## 3. Find the problems

Check every criterion against each kind below. Quote the exact words.

| Kind | What to look for |
|---|---|
| **Contradiction** | Two criteria, or a criterion and a comment, or a criterion and an earlier decision, that cannot both hold. |
| **Two readings** | "or" (either, or both?), "and/or", "such as" / "e.g." / "etc." (open list or closed?), "up to" (inclusive?), "recent", "fast", "valid", "supported", "similar", ordering words without a tie-break. |
| **Unclear limit** | A number without a unit, inclusive/exclusive, per user or global, per day or rolling 24 h, counted before or after filtering. |
| **Missing** | Error keys and status codes for each failure, max lengths, empty states, loading and error screens, permission rules (who may see or do it), behaviour for deleted, blocked or suspended records, language and RTL rules, time zone of dates. |
| **Dependency** | A story that needs a field, endpoint, table or screen another story builds; a shared component two stories change. |
| **Not testable** | A criterion with no observable result ("works well", "is secure", "user-friendly"), or one that cannot be produced on the test environment without a named alternative. |

For each problem, write the reading you would build and why (the closer fit to the story, an
earlier decision, the existing code). If the board, a comment or a decision already settles it,
it is not a question: note the source and move on.

## 4. Order the work

Write the dependency order: which stories go first because others need their contract, data or
component, which can run in parallel, and which share files and should not be built at the same
time. Backend contract before the clients that use it.

## 5. Map criteria to tests

Per story, per criterion: the tests it needs, named as they will be written, and the level
(unit, integration, end-to-end, manual live check). Include one test per error key, each limit
at its boundaries, each empty state, and each permission rule. A criterion with no possible test
goes back to step 3 as a question.

## 6. Output

1. **One message for the product owner**, numbered, grouped by story:

   ```
   Q<n>. <story key> AC<n>: "<quoted words>"
   Reading A: <...>
   Reading B: <...>
   We will build: <A or B>, because <reason>, unless you say otherwise.
   ```

   No duplicates of questions already in the project's open-questions file; add new ones there.
   Show the message to the user before it is sent.
2. **Dependency order** as a short list.
3. **Tests per criterion**, per story.
4. **Settled by the board**: the points that looked open but a comment or decision settles, with
   the source, so nobody asks them again.

Build only what is settled or what step 3 records as "we will build"; record that choice as a
decision taken, and change it if the product owner answers otherwise.
