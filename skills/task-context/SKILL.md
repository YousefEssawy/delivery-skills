---
name: task-context
description: |
  Learn the project and the task before planning: the stack, conventions, build/test/lint/CI commands and PR
  conventions, and the task itself (description, ALL comments, acceptance criteria, links, dependencies) from
  whatever tracker integration exists. Defines the refresh checkpoints (before planning, before a new task, after
  shared code changed, on a contradiction, before review and before the PR) and what to look for at each one. Never
  invents task details when there is no integration. Use at the start of any task, when resuming one, or when the
  user says "read the task", "what does the ticket say", "refresh the context", "re-read the story".
---

# task-context

Everything later (plan, tests, review, PR) is only as good as what was read here. Read the real sources; never fill a gap with a guess.

## When to use

- At the start of a task, and when resuming one after a break or another session's work.
- At every refresh checkpoint in step 4.
- Not for a sprint-wide read of many stories (use `sprint-kickoff`).

## Prerequisites

- Read access to the repository.
- Optional: a tracker integration (a CLI, an MCP connector or pasted text). Without one, the user's message is the only task source.

## Steps

1. **Project discovery** (once per project; keep the result in the handoff or a short notes file):
   - Project instructions first: `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING`, any workflow or handoff file.
   - Stack and layout: manifests (`package.json`, `*.csproj`, `pyproject.toml`, `go.mod`...), top-level folders, lockfiles.
   - Commands: build, unit test, integration test, lint, type-check, format. Take them from scripts, task runners and CI
     config (`.github/workflows`, pipeline files). Record the exact command, not a guess.
   - Conventions: branch naming, commit format, PR template, review rules, protected or deploying branches.
2. **Task discovery.** Read the task from the tracker integration if one exists: title, description, status, assignee,
   labels, links, parent and dependencies, attachments, acceptance criteria (AC) and **every comment** (decisions
   arrive as comments). Write down the task key, the time you read it, and the comment count.
3. **No integration, or it fails.** Say so in one line. Use only what the user gave you. Mark every missing item
   (AC, comments, links) as `unknown`, ask for it, and do not invent or reconstruct requirements. A task without
   AC is blocked for planning until the user supplies them or approves a stated reading.
4. **Refresh checkpoints.** Re-read the task and compare with your notes at:
   - before planning;
   - before starting a new task;
   - after shared code changed (a merge, a rebase, a teammate's push touching files you rely on);
   - on any contradiction between the task, the code and a design;
   - before review and before the PR.

   At each one look for: new comments, changed or added AC, a status change, scope change, new blockers or
   dependencies, a reassigned owner, linked tasks that moved. Report only the delta. Do not poll on a timer; refresh
   at a checkpoint or when something suggests the task moved.
5. **Contradictions.** The task and its comments win over a design file and over what the code currently does. Record
   the conflict with both quotes and the reading you will build; do not silently pick one.

## Outputs and evidence

- A context summary: project facts (stack, exact commands, conventions) and task facts (key, status, AC list verbatim, comment count, links, dependencies).
- Open questions and contradictions as a numbered list, each with the reading you propose.
- For each refresh: what changed since the last read, or "no change" with the read time.

## Failure and escalation

- Tracker unreachable or unauthorised: report it, continue with the provided text only, mark unknowns. Do not retry in a loop.
- Missing AC or contradictory AC: stop before planning and ask.
- Commands cannot be found: say which are unknown; `test-and-diagnose` must not guess them.

## Done when

- Project commands and conventions are written down from real files.
- The task, every comment and every AC were read, or the gap is named.
- Open questions and contradictions are listed.

## Never claim

- Never claim to have read the comments or AC unless you did; never invent a ticket, AC, link or decision.
- Never claim the task is unchanged without re-reading it at the checkpoint.
- Never paste secrets or tokens found in config into any output.
