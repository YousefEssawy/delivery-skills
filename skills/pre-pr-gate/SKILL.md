---
name: pre-pr-gate
description: |
  Run and read the pre-PR gate script (~/.claude/claude-setup/scripts/gate.ps1): when to run it, the exact
  invocation, how to read PASS / FAIL / BLOCKED / NOT RUN / NOT APPLICABLE, what to fix, and that an overall PASS
  means ready for a PR, not that a PR exists. If the script is missing it says so and claims no readiness. Use when
  the work is committed, tested and reviewed, before opening a pull request, or when the user says "run the gate",
  "are we ready for a PR", "pre-PR check".
---

# pre-pr-gate

This skill is the usage guide. The gate logic lives in the script; do not re-implement or paraphrase its checks.

## When to use

- After the work is committed, tests are green, and `independent-review` wrote a review file for the current HEAD.
- Again after every fix commit made because of the gate or the review.

## Prerequisites

- PowerShell 7 (`pwsh`) and the gate script at its installed path, `~/.claude/claude-setup/scripts/gate.ps1`.
- The AC map and the review file from the earlier skills. Optional: `.claude/pre-pr-gate.json` in the project (checks, forbidden paths, file locations).
- A clean working tree.

## Steps

1. **Check the script exists.** If `gate.ps1` is missing or `pwsh` is unavailable, say "the gate script is not
   installed", report readiness as `NOT RUN`, and stop. Do not substitute your own checklist as if it were the gate.
2. **Run it from the project root:**
   `pwsh -File ~/.claude/claude-setup/scripts/gate.ps1 [-Config .claude/pre-pr-gate.json] [-Base <ref>] [-AcMap <file>] [-Review <file>] [-JsonOut <file>]`
3. **Read the result per check.** Each check is one of:
   - `PASS`: done.
   - `FAIL`: a real problem (a command exited non-zero, an AC row has no evidence, an open BLOCKER or MAJOR). Fix the cause, commit, re-run.
   - `BLOCKED`: something open stops it (an AC row marked BLOCKED, a missing prerequisite). Resolve it or ask the user.
   - `NOT RUN`: it did not run, for example no command is configured. Configure it or have the user accept the gap; it counts against readiness.
   - `NOT APPLICABLE`: declared not relevant. Check that the stated reason is true.

   Exit code 0 is an overall PASS; 1 is an overall FAIL; 2 means the gate itself could not run (bad config) and says nothing about the work.
4. **Fix, commit, re-run.** If you change code after the review, the reviewed SHA no longer equals HEAD: re-review the
   fix commits first (`independent-review`), then re-run the gate. The final run must be on the final tip.
5. **Stop at PASS.** An overall PASS means the branch is ready for a PR. It does not open, push or merge anything;
   continuing with `pr-and-verify` needs the user's authorisation.

## Outputs and evidence

- The gate's table, its exit code, the commit SHA it ran on, and the JSON file when `-JsonOut` was used.
- A one-line verdict: ready for a PR (overall PASS on SHA ...) or not ready (which checks, and why).

## Failure and escalation

- Script missing, wrong PowerShell version, or exit 2: report it, claim no readiness, ask the user to install or fix the setup.
- A check you believe is wrong: show the evidence to the user; do not edit the config to make it pass without their agreement.
- The same check fails again after two fixes: stop and report the failure class (see `test-and-diagnose`).

## Done when

- The gate ran on the current HEAD and the overall result is PASS, or the blocking checks are listed for the user.

## Never claim

- Never claim ready when the gate did not run, exited non-zero, or ran on an older SHA.
- Never claim a PR was created or is allowed by the gate; PASS is readiness only.
- Never treat `NOT RUN` or `BLOCKED` as a pass.
