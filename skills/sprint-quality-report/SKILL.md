---
name: sprint-quality-report
description: |
  Compare quality between two sprints (or iterations / cycles) from the live issue tracker (Jira,
  Linear, GitHub Issues...), per team or per person: stories, bugs raised, real bugs vs not-a-bug,
  stories that passed without a bug, stories that failed testing, where the bugs cluster, and a written assessment with grades and next-sprint recommendations,
  published as a dashboard. Use when the user says "sprint quality", "compare sprint 1 and 2",
  "how did we do this sprint", "quality report", "احصائية البجز", "قارن السبرنت", "تقييم الكوالتي".
---

# sprint-quality-report

Numbers first, from the issue tracker as it is today, then an honest opinion clearly labelled as
one. The status and field names below are Jira-style examples; map them to the tracker's own (for
example Linear cycles and workflow states, or GitHub milestones and labels).

## 1. Define the windows and the people

- Read the sprints (or cycles / milestones) from the tracker (ids, names, start and end dates). A
  sprint plus its extension is one window. Say whether the latest sprint is still open: its open stories may still collect bugs.
- Find who owns which area (backend, web, mobile) from story assignees and bug title prefixes, and
  confirm the grouping with the user if it is not obvious.

## 2. Count, per team and sprint

Use the tracker's search API, paging through every result (on Jira, use the current search
endpoint; older ones have been retired), and each story's change history:

| Measure | How |
|---|---|
| Stories | Stories in the sprint assigned to the team. |
| Bugs raised | Bugs assigned to the team, created inside the sprint's dates. |
| Not a bug | Bugs whose comments close them as by design, can't reproduce, as designed, expected behaviour, launch scope, duplicate (in every language the team comments in); or a matching resolution. Keyword-based: say so, it may undercount. |
| Real bugs | Bugs raised minus not a bug. |
| Passed without a bug | Stories with no linked bug and no failed-QA status (for example Failed Testing / Reopened) in their history. |
| Failed testing | Stories whose history shows a failed-QA status at least once. |
| Where bugs cluster | Group bug titles by the screen or area prefix. |

If you query through a browser tab, keep it responsive: fetch histories in small parallel chunks,
not one huge script.
Save the raw counts in the project's state folder with the date read.

## 3. Read the bugs, not only the counts

For the latest sprint, list each bug of the main team with a verdict (real, not a bug, product
decision) and one line on its cause. The causes are what the recommendations come from.

## 4. Publish

Build a dashboard (an artifact, the Dashboard type when available, or an HTML page or document
where artifacts are not available): a one-line takeaway, a report card per team (grade, verdict, three headline figures each with the previous sprint and the change, green when
better), one comparison table of every measure, the assessment, then charts (bugs per sprint split
real / not a bug; share passed without a bug, previous vs latest), the bug list with verdicts, and the
method. Every figure comes from a data file and is marked; prose figures are marked too. State that it
is a snapshot read on a date and that grades and the assessment are opinion.

## 5. The assessment

Three short columns: what went well, what still needs work, and for the next sprint. Tie each point to
the bugs or numbers behind it. Grade each team (A to D, with a minus or plus) on the latest sprint and
say why in one line. Be direct about a measure that got worse.

Hand over: the link, a table of the headline numbers in the user's language, what the method cannot
see, that the page is private until shared, and offer to turn the recommendations into workflow rules.
