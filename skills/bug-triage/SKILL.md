---
name: bug-triage
description: |
  Judge new QA bugs before anyone fixes them: read each bug, its linked story with every comment,
  the decision register and the code, try it live, and classify it as a real bug, not a bug (by
  design, can't reproduce, environment) or a product decision. Drafts the reply comment with the
  reporter mentioned (shown to the user before posting), moves real bugs to In Progress (or the
  tracker's equivalent) and starts a test-first fix. Works with any issue tracker (Jira, Linear,
  GitHub Issues...). Use when the user says "new bugs came in", "is this really a bug", "check the
  bugs assigned to me", "شوف البجز الجديدة", "هل ديه بج بجد", "البجز اللي اترفعت عليا".
---

# bug-triage

About half of one sprint's bugs were not bugs: a launch scope, a later story, a product ruling, or a
QA environment detail. Each still cost QA and development time. Triage first, then fix only what is
real.

## 1. List the bugs

From the issue tracker (Jira, Linear, GitHub Issues...): bugs assigned to the user (or the team)
created since the last triage, newest first. Note each one's status, reporter, priority and linked issues. A bug key that cannot be read (deleted,
no permission) is reported to the user, not guessed.

## 2. Read everything before judging

For each bug:
- the bug's steps, actual, expected, screenshots and comments;
- the linked story, its criteria and **every** comment; the decision register; any decision cited;
- the code path and its tests, and the project's house rules (`CLAUDE.md`, specs) for that area;
- what is deployed where (which build the bug was seen on).

## 3. Reproduce

Try it on the test environment the way the bug says, with test accounts and test data only. For a
layout bug, check the screenshot first: in a browser's device mode a viewport taller than the window
hides its lower part, which looks like "buttons off screen".

## 4. Classify

| Verdict | When |
|---|---|
| **Real bug** | The behaviour contradicts the story, a decision, or the house rules, and it reproduces. |
| **Not a bug - by design** | A story, decision or launch scope says this is the behaviour. Quote it with its key. |
| **Not a bug - can't reproduce** | It does not reproduce on the stated build and sizes; say exactly what was tried. |
| **Product decision** | The story does not settle it. Write the question with both readings for the product owner. |
| **Environment** | Server, data or configuration on the test environment, not the code. Give the fix or the runbook. |

When the user overrides a verdict, the user's verdict stands.

## 5. Act

- **Not a bug / can't reproduce:** draft a short comment that mentions the reporter, names the
  decision or what was tried, and says what would change it. Show the exact text to the user; post
  only after their yes, then check that the mention rendered.
- **Product decision:** add the question to the project's open-questions file and the message for the
  product owner. Build nothing until it is answered.
- **Real bug:** move it to In Progress, or the tracker's equivalent working status (status names
  vary per team; never further without the user's word). Fix test-first, with a
  regression test named after the bug key. If the bug is in a shared component, check every screen
  that uses it. Fix in the next release batch (the `release-batch` skill, if installed), then verify live, take a screenshot
  for UI bugs, and draft the evidence comment for the user.
- Record each verdict in the handoff and, for patterns, in the project's workflow lessons.

## 6. Report to the user

One table: bug, verdict, why (one line, with the key that settles it), next action. Then the comment
drafts. Then anything that needs the user's word.
