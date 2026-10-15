---
name: review-all
description: |
  Full review of the work just done: read the actual diff, decide which review skills apply to
  what changed, and run each of them, then report one merged list of findings. Use before
  committing a full story, anything touching an API contract, data or a migration, or whenever
  the user says "review all", "review everything", "full review", "/review-all", "راجع كل الشغل",
  "راجع اللي اتعمل", "اعمل مراجعة شاملة". For a small fix, change-impact-review plus the one
  relevant guard is enough; this skill is the full pass.
---

# review-all

Review what was actually changed, with the review skill that fits each kind of change. This skill
does not carry review rules of its own: it routes to the installed guards and merges their results.

## 1. Find what changed

In every repository touched by the task (a workspace may hold several):

- `git status --short` and `git diff --stat` against the base branch the work started from: the
  project's integration branch if its instructions name one (for example `development`), else the
  remote default branch (`git symbolic-ref refs/remotes/origin/HEAD`, often `main`), plus uncommitted
  changes. Use `git merge-base` so only the work's own commits are compared.
- Group the changed files by kind (table below). Read the diff itself, not only file names.
- If nothing changed, say so and stop.

## 2. Pick the skills

Run a skill only when its kind of change is present, and only if it is installed (check the
available-skills list; never guess a name). Name any that would apply but is missing.

| What changed | Skill |
|---|---|
| Any modified, renamed, moved or deleted existing code or content | `change-impact-review` |
| Production code in any language | `clean-code-guard` |
| Test code | `test-guard` |
| .NET API controllers | `controller-guide` |
| .NET request models, validators | `dotnet-backend-validation` |
| .NET services or validators (coverage of the new code) | `dotnet-backend-testing` |
| Frontend forms (Angular / React) | `frontend-form-validation` |
| Any web UI (templates, styles, components) | `ui-responsive-audit` |
| User-facing text, translation files | `i18n-locale-sync` |
| Date or time fields, date filters | `date-kind-guard` |
| READMEs, specs, API docs, doc comments, changelogs | `docs-guard` |
| Auth, permissions, secrets, input reaching SQL / shell / HTML | `security-review` |
| Overall correctness of the diff | `code-review` |

Project instructions (`CLAUDE.md`, `AGENTS.md`) win over this table: if they name a required
check, gate or command (a verify script, a contract check, an API-collection update), include it.

## 3. Run them

- Invoke each selected skill with the Skill tool, scoped to the changed files. Do not paraphrase a
  skill from memory instead of running it.
- Skills that only read may run in any order. Run browser-driven checks last.
- Run the project's own test and lint commands if the instructions define them, and quote the real
  result. Never report a check as passed that was not run.

## 4. Report

One merged report, most severe first:

1. **Skills run** and **skills skipped** (with the reason: not applicable, or not installed).
2. **Findings**: `file:line`, the problem, the concrete failure it causes, the fix. Merge
   duplicates found by more than one skill.
3. **Checks executed** with their results (tests, lint, build, verify script).
4. **Verdict**: ready to commit, or the blocking findings that must be fixed first.

Do not fix anything during the review unless the user asked for fixes; list the findings and wait.
After fixes are applied, re-run only the skills whose findings were touched.

## 5. Independent pass

For a full story, finish by asking a separate agent to review the same diff without your
conclusions: give it the diff and the acceptance criteria, not your findings. Add anything new it
finds to the report.
