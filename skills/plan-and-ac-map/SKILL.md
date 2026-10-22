---
name: plan-and-ac-map
description: |
  Turn a read task into a plan sized to the change (files, layers, risks, tests, commands, open decisions) and an AC
  map: one row per acceptance criterion, each mapped to the implementation that satisfies it and the verification
  that proves it, in the markdown table format the pre-PR gate reads. Documents conflicts and open decisions instead
  of inventing them away. Use after the task context is read and before writing code, or when the user says "plan
  this", "map the acceptance criteria", "build the AC map", "what will we change and how will we prove it".
---

# plan-and-ac-map

Plan before code, in proportion to the risk. The AC map is the spine of the task: the review, the gate and the PR body all read it.

## When to use

- After `task-context`, before the first edit.
- When the AC change at a refresh checkpoint: update the map, do not start a new one.

## Prerequisites

- A context summary from `task-context` with the AC list and commands.
- For changes to existing code, run `change-impact-review` first (or as part of the plan) to find every place affected.

## Steps

1. **Size the plan to the change.** A one-line fix gets a few lines. A new endpoint or a migration gets the full plan.
   Anything touching money, permissions, data visibility, migrations, public contracts or concurrency is high risk:
   say so and propose a stronger review.
2. **Write the plan:** files and layers to change (and what you will not touch); the approach in a few sentences;
   risks and how each is covered; tests to add or change, by level; the exact commands that will run them; open decisions.
3. **Build the AC map.** One row per AC, taken verbatim from the task. Split an AC with an "or", a limit or several
   error cases into one row per claim (`AC3a`, `AC3b`). Columns: `AC | Implementation | Verification | Evidence | Status`.
   - Implementation: file or component, filled in as work lands (`planned: <file>` until then).
   - Verification: a named test or a concrete live check, never "tested manually".
   - Evidence stays empty and Status is `OPEN` until proof exists; later values are `PASS`, `FAIL`, `BLOCKED` or `N/A` (with the reason).
   - Add an optional `Scope:` line with the globs you expect to change, and a `Shared code touched: no` line only if it is true.
   - Add a `## PR summary` section with Summary / Tests / Limitations / Risks, drafted now, finished before the PR.
4. **Conflicts and open decisions.** An AC that contradicts another AC, a comment or the code gets a row with status
   `BLOCKED` and the question. Record your proposed reading as a decision taken only if nothing in the task settles it,
   and say it is yours.
5. **Show the plan and the map** to the user for anything non-trivial, and keep the map where the project keeps such files (for example `docs/ac-map.md`).

## Outputs and evidence

The plan (short, proportional) and the AC map file, for example:

```markdown
Scope: src/cart/**, tests/cart/**
Shared code touched: no

| AC | Implementation | Verification | Evidence | Status |
|---|---|---|---|---|
| AC1 adding an item twice increases the quantity | planned: src/cart/addItem.ts | test `addItem_twice_incrementsQuantity` | | OPEN |
| AC2 quantity above 99 is rejected | planned: src/cart/validate.ts | test `addItem_over99_rejected` | | OPEN |

## PR summary
Summary: ... Tests: ... Limitations: ... Risks: ...
```

## Failure and escalation

- AC missing, vague or contradictory: do not plan around a guess; ask, and mark the rows `BLOCKED`.
- A required command is unknown: list it as an open decision; do not put an invented command in the plan.
- Scope grows during the build: update the plan and the map and tell the user.

## Done when

- Every AC (or claim) has a row with an implementation target and a named verification.
- Conflicts and open decisions are written down with their status.
- The user has seen the plan when the change is more than trivial.

## Never claim

- Never claim an AC is covered by a test that does not exist yet; planned items stay marked planned.
- Never mark a row `PASS` without evidence, and never delete an inconvenient AC row.
- Never present your reading of an ambiguous AC as the product owner's decision.
