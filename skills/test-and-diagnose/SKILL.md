---
name: test-and-diagnose
description: |
  Choose the test levels for a change, write the tests first and show them failing for the right reason (RED) before
  the code makes them pass (GREEN), keep tests deterministic and isolated, run the project's own commands, classify
  every failure (code, test, environment, shared state, flaky) with evidence before changing anything, apply the
  re-run rules and report honestly. Makes no coverage claim without a measured report. Use while implementing or
  fixing, or when the user says "write the tests first", "why is this test failing", "diagnose the failure", "is
  this flaky".
---

# test-and-diagnose

A test that was never seen failing proves nothing. A failure that was never classified gets "fixed" in the wrong place.

## When to use

- Building a feature or fixing a bug, from the first test to the last green run.
- Any red run you do not yet understand.
- For .NET unit-test style see `dotnet-backend-testing`; for browser UI checks see `ui-responsive-audit`; this skill is stack-neutral.

## Prerequisites

- The AC map from `plan-and-ac-map` (each row names its verification) and the project's real test commands from `task-context`.
- If a project lock or slot rule serialises heavy runs, hold it before running.

## Steps

1. **Pick levels per risk.** Pure logic: unit. Several components or the database/queue: integration. A contract or
   route: API/contract test. A user flow: end-to-end or browser. Prefer the cheapest level that can fail for the right
   reason; add a higher level only for what the lower one cannot see.
2. **RED.** Write the test for one AC row, run it with the project's command, and read the failure message. It must
   fail for the intended reason (missing behaviour), not a typo or a setup error. Record the command, the failing test name and the commit.
3. **GREEN.** Write the smallest change that passes. Run the same test, then the nearby tests. Record the result.
   A bug fix gets a regression test named after the bug key (for example `BUG_123_cart_total_ignores_removed_items`),
   proven RED against the unfixed code.
4. **Keep tests deterministic and isolated:** no dependence on test order, wall-clock time, unseeded random data, the
   network or shared mutable data; each test creates and cleans up its own data; assert behaviour, not implementation details.
5. **Run what the project runs.** Use the exact commands from the project (filtered while building; the full suite once
   on the final tip). Do not invent a command; if none exists, say so.
6. **Classify each failure before editing anything:**

| Class | Typical evidence |
|---|---|
| code | assertion fails on the new or changed behaviour; reproducible; the stack points at the changed code |
| test | the test is wrong or stale: wrong expectation, bad fixture, order dependence |
| environment | missing tool, service or credentials, port in use, out of memory, machine timeout |
| shared state | passes alone, fails with others or against a shared database; leftover data |
| flaky | passes and fails on identical code with no change |

7. **Re-run rules.** Re-run a failed test once, alone, to separate environment, shared state and flaky from code. The
   same failure twice means it is real. Pass-then-fail with no change means flaky: say so, find the cause or quarantine
   it with the user's agreement; never hide it by repeating until green.
8. **Report honestly:** counts of passed, failed and skipped, with the command. A skipped or not-run test is reported as such.

## Outputs and evidence

- Per AC row: test name, RED output summary, GREEN output summary, command. Write the test name into the AC map's Verification and Evidence columns.
- A failure log: test, class, evidence, action taken.
- Totals from the final full run (passed, failed, skipped) with the exact command and the commit SHA it ran on.

## Failure and escalation

- Cannot get RED for the right reason: the requirement or the test is wrong; stop and revisit the AC map.
- Environment failure you cannot fix (missing credentials, no database): report `BLOCKED` with what is missing; do not mock away a real check silently.
- Flaky in code you did not touch: report it; do not fix it inside this task unless asked.

## Done when

- Each AC row has a test seen RED then GREEN (or a documented reason it cannot).
- The final full run is green on the exact tip, or each remaining failure is classified and explained.
- Totals are recorded with the command and SHA.

## Never claim

- Never claim a test passes, or a coverage percentage, without a run or a measured coverage report from this change.
- Never claim RED without having run it; never call a failure flaky without evidence of different results on unchanged code.
- Never delete, skip or loosen a failing test to get green.
