---
name: skills-router
description: |
  Run at the START of a story, bug fix or task to decide which installed skills (guards) apply,
  before any code is written. Reads the task and the project instructions, lists the skills to use
  while building and the ones to run before commit, and maps every acceptance criterion to a named
  test. Use when the user says "/skills-router", "start this story", "start the task", "which
  skills do we need", "ابدأ الستوري", "ابدأ التاسك", "ايه ال skills المناسبة", or when project
  instructions say a story starts with the skills router.
---

# skills-router

Decide up front which skills guard this piece of work, so problems are caught while building
instead of in QA. This skill only plans; it changes no code.

## 1. Understand the task

- Read the story or bug from its source of truth (the issue tracker, not a stale copy), with every
  acceptance criterion and linked decision.
- Read the project instructions (`CLAUDE.md`, `AGENTS.md`, onboarding and spec docs) for required
  steps, gates and commands.
- Name the layers the task touches: database or migration, backend API, validation, frontend UI,
  forms, translations, dates, docs, API collection.

## 2. Route

Pick from the skills that are actually installed (check the available-skills list; never guess a
name). Say which phase each one belongs to.

| The task involves | While building | Before commit |
|---|---|---|
| Changing existing code or content | `change-impact-review` (before the edit) | `change-impact-review` (after) |
| A bug fix | write the failing test first | `test-guard` |
| A new feature that parallels an existing one | `clone-feature` | `clean-code-guard` |
| .NET controllers / endpoints | `controller-guide` | `controller-guide` |
| .NET request models | `dotnet-backend-validation` | `dotnet-backend-validation` |
| .NET services, validators | `dotnet-backend-testing` | `test-guard` |
| Frontend forms | `frontend-form-validation` | `frontend-form-validation` |
| Any web UI | - | `ui-responsive-audit` |
| User-facing text | `i18n-locale-sync` | `i18n-locale-sync` |
| Date or time fields and filters | `date-kind-guard` | `date-kind-guard` |
| Docs, specs, API docs | - | `docs-guard` |
| Auth, permissions, sensitive data | - | `security-review` |
| A full story, a contract, data or a migration | - | `review-all` |

A small fix gets `change-impact-review` plus the one or two relevant guards. A full story ends
with `review-all` and an independent review by a separate agent.

## 3. Map acceptance criteria to tests

Produce a table: every acceptance criterion, the named test that will prove it, and the test level
(unit, integration, UI or end-to-end). A criterion with no test is a gap to raise, not to skip. A
bug gets a regression test named after its issue key.

## 4. Output

1. The task in one line, and the layers it touches.
2. Skills to use while building, in order.
3. Skills and project gates to run before commit.
4. The criterion-to-test table.
5. Anything ambiguous in the criteria that needs the user's decision before coding.

Then start the work with the first skill on the list. Do not invoke the before-commit skills now.
