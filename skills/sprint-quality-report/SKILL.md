---
name: sprint-quality-report
description: |
  Compare quality between sprints (or iterations / cycles) from the live issue tracker (Jira,
  Azure DevOps, Linear, GitHub Issues...), per team or per person. Covers stories, bugs raised, real
  bugs vs not-a-bug (keyword match plus a hand check), stories that passed without a bug, stories that
  failed testing, bug severity and weighted bugs per story, effect on use (affects use / cosmetic /
  change request), fix time, git activity and where the bugs cluster. Ends with a written assessment,
  grades and next-sprint recommendations, published as a dashboard. Use when the user says "sprint
  quality", "compare sprint 1 and 2", "how did we do this sprint", "quality report", "how serious were
  the bugs", "احصائية البجز", "قارن السبرنت", "تقييم الكوالتي", "مستوى البجز".
---

# sprint-quality-report

Numbers first, from the issue tracker as it is today, then an honest opinion clearly labelled as
one. The status and field names below are Jira-style examples. Map them to the tracker's own: Azure
DevOps iterations and states, Linear cycles and workflow states, or GitHub milestones and labels.

## 1. Define the windows and the people

- Read the sprints (or cycles / milestones) from the tracker, with their ids, names, start and end
  dates.
- A sprint plus its extension is one window. If QA raised a sprint's bugs after its planned end, the
  window runs to the date the sprint was completed.
- Say whether the latest sprint is still open: its open stories may still collect bugs.
- Find who owns which area (backend, web, mobile) from story assignees and bug title prefixes.
  Confirm the grouping with the user if it is not obvious.

## 2. Count, per team and sprint

Use the tracker's search API, paging through every result (on Jira, use the current search
endpoint; older ones have been retired), and each story's change history:

| Measure | How |
|---|---|
| Stories | Stories in the sprint assigned to the team. A story carried over counts in each sprint it was in; say so. |
| Bugs raised | Bugs assigned to the team, created inside the sprint's window. |
| Not a bug | Bugs whose comments close them as by design, can't reproduce, as designed, expected behaviour, launch scope or duplicate (in every language the team comments in), or bugs with a matching resolution. The match is keyword-based and can miss or over-match, so say so. For the latest sprint, check every match by hand: a reason text such as "duplicate report" can match without being a verdict. |
| Real bugs | Bugs raised minus not a bug. |
| Passed without a bug | Stories with no linked bug and no failed-QA status (for example Failed Testing / Reopened) in their history. |
| Failed testing | Stories whose history shows a failed-QA status at least once. |
| Severity | Bugs per priority (Critical, High, Medium, Low), as QA set them. |
| Weighted bugs per story | (4 x Critical + 3 x High + 2 x Medium + 1 x Low) / stories. Many Low bugs weigh less than a few High ones, so a sprint with the same count can be better or worse. |
| Fix time | Median hours from a bug being raised to its first move to Ready To Test (or the tracker's equivalent). |
| Where bugs cluster | Group bug titles by the screen or area prefix. |
| Git | Per sprint window and repo: non-merge commits by the team, and how many of them are fixes. |

If you query through a browser tab, keep it responsive: fetch histories in small parallel chunks,
not one huge script.

Save the raw counts in the project's state folder, in a data file stamped with the date read.

## 3. Read the bugs, not only the counts

For the latest sprint, list each bug of the main team with:

- its priority;
- a verdict: real, not a bug, or product decision;
- one line on its cause.

The causes are what the recommendations come from.

Then sort each real bug by its **effect on use**, reading bug by bug:

- **Affects use**: a wrong result, missing information, a wrong message, or a control that does not
  work.
- **Cosmetic or wording**: layout, direction, translation, labels.
- **Change request**: new behaviour asked for through a bug.

Say how many fall in each group, and whether any stopped a task from being done. A sprint whose bugs
are mostly cosmetic is graded differently from one with the same count that affects use.

## 4. Publish

Build a dashboard: an artifact, the Dashboard type when available, or an HTML page or document where
artifacts are not available. It contains:

- a one-line takeaway;
- a report card per team: the grade, the verdict, and four headline figures (real bugs per story,
  passed without a bug, failed testing, weighted bugs per story), each with the previous sprint and
  the change, green when better;
- a "how serious were the bugs" section: bugs per sprint stacked by priority for each team, and the
  latest sprint's effect-on-use counts;
- one comparison table of every measure;
- the assessment;
- charts: bugs per sprint split into real and not a bug, and the share passed without a bug for the
  previous and latest sprints;
- the bug list with priority, verdict and effect on use;
- the git table;
- the method, including the severity weights.

Every figure comes from a data file and is marked; figures in prose are marked too. State that the
page is a snapshot read on a date, and that grades and the assessment are opinion.

## 5. The assessment

Write three short columns: what went well, what still needs work, and what to do in the next sprint.
Tie each point to the bugs or numbers behind it.

Grade each team (A to D, with a minus or plus) on the latest sprint, and say why in one line. Weigh
severity and effect on use, not only the count: fewer and lighter bugs can lift a grade even when one
measure got worse. Be direct about a measure that got worse.

## 6. Hand over

- the link;
- a table of the headline numbers, in the user's language;
- what the method cannot see;
- that the page is private until shared;
- an offer to turn the recommendations into workflow rules (see the `bug-prevention-rules` skill).
