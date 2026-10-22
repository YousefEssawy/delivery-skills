---
name: independent-review
description: |
  A fresh-context, read-only review of the actual diff against the AC map, using the severity contract BLOCKER /
  MAJOR / MINOR and writing the review file the pre-PR gate reads (reviewed SHA, verdict, findings table). Bounded:
  one review plus a re-review of the fix commits only. The reviewed SHA must equal HEAD. The reviewer never reviews
  its own work and never edits code. Use when a branch is ready for review, or when the user says "review the
  diff", "independent review", "is this ready", "re-review the fixes".
---

# independent-review

A reviewer who watched the code being written shares its blind spots. This review starts from the diff and the AC map only.

## When to use

- When the work is committed and the local tests are green, before the pre-PR gate.
- Once more, on the fix commits, after a review that found issues.
- `review-all` routes a change to the matching guard skills; this skill produces the verdict that gates the PR and can use `review-all` as one input.

## Prerequisites

- A clean working tree with the work committed (the review needs a SHA).
- The AC map and the task context.
- The reviewer is a separate agent or session from the builder and read-only in intent: it reads files and runs read-only or test commands but edits no source.

## Steps

1. **Fix the target.** Record `git rev-parse HEAD` (the reviewed SHA) and the base. Review `git diff <base>...HEAD`, not the builder's summary.
2. **Read the task and the AC map first**, then the diff. For each AC row: is the implementation in the diff, does the
   named verification exist and test the right thing, is the evidence real?
3. **Look for:** missing or wrong behaviour against an AC; missing tests or tests that cannot fail; regressions in code
   the change touches or depends on; security, data and permission issues; error handling; contract and migration
   changes; unrelated or out-of-scope edits; secrets; docs that now lie.
4. **Run, do not trust.** Where cheap, run the relevant tests yourself and compare with the claimed totals.
5. **Grade each finding:**
   - **BLOCKER**: wrong or dangerous behaviour, security or data loss, an AC not met, a failing required check.
   - **MAJOR**: a missing test, missing evidence or a missing AC row; a likely bug; a contract or migration risk without a plan.
   - **MINOR**: style, naming, small clarity, optional improvement.
6. **Write the review file** (for example `docs/review.md`):

```markdown
Reviewed SHA: <full sha of HEAD>
Verdict: NOT READY

| ID | Severity | Status | File:line | Finding | Fix |
|---|---|---|---|---|---|
| R1 | MAJOR | open | src/cart/validate.ts:42 | AC2 has no test for the boundary 99 | add tests for 99 and 100 |
```

   `Verdict: READY` only when no BLOCKER and no MAJOR is `open`. Status is `open`, `fixed` or `accepted` (accepted needs the user's word).
7. **Bounded loop.** The builder fixes; the reviewer re-reviews only the fix commits and the findings they touch,
   updates statuses and sets `Reviewed SHA` to the new HEAD. There is no third full review: remaining items go to the user.

## Outputs and evidence

- The review file in the format above, the diff range reviewed, the commands the reviewer ran with their results, and the skills loaded during the review.

## Failure and escalation

- HEAD moved after the review: the review is stale; re-review the new commits.
- Dirty tree or nothing committed: stop and ask for a commit.
- AC map missing: that alone is a MAJOR finding; do not review without something to review against.
- Disagreement on a finding: escalate to the user; do not downgrade a severity to reach READY.

## Done when

- The review file exists, `Reviewed SHA` equals the current HEAD, and the verdict is READY (or NOT READY with every finding listed).
- Every BLOCKER and MAJOR is `fixed`, or the user marked it `accepted`.

## Never claim

- Never claim READY with an open BLOCKER or MAJOR, or for a SHA other than HEAD.
- Never claim to have reviewed files that were not in the diff you read.
- Never edit code as the reviewer, and never review your own commits.
