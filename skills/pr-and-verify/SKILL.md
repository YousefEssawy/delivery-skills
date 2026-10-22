---
name: pr-and-verify
description: |
  Open a pull request only when the user has authorised it, with a body built from the AC map's PR summary, then
  verify the real PR: its diff, head SHA, status and CI results; respond to review feedback and re-run the affected
  checks; finish with a handoff report (status, decisions, branches and SHAs, blockers, next action). Use after the
  pre-PR gate passed and the user said to open the PR, or when the user says "open the PR", "check the PR", "CI
  failed on the PR", "address the review comments", "write the handoff".
---

# pr-and-verify

Publishing is a separate step from readiness. Verify the PR that exists, not the branch you remember.

## When to use

- After `pre-pr-gate` returned an overall PASS on the current HEAD **and** the user authorised opening the PR.
- After a PR exists: to verify it, answer review feedback or CI failures, and write the handoff.

## Prerequisites

- An overall gate PASS on the HEAD to be pushed; the AC map with its `## PR summary`; the review file whose `Reviewed SHA` equals HEAD.
- The `gh` CLI (or the host's equivalent), authenticated. If there is none, give the user the title and body to paste.
- Explicit user authorisation to push and to open the PR. Never push to or merge into a deploying or protected branch
  (for example `staging` or `production`) without asking.

## Steps

1. **Confirm authorisation and state.** `git status` is clean and `git rev-parse HEAD` equals the reviewed SHA. If not,
   go back to `independent-review` and `pre-pr-gate`.
2. **Push the feature branch** (never force-push a shared branch). Then create the PR against the base the project
   names, as a draft or ready, as the user said.
3. **Body from the AC map:** the Summary, Tests (commands with totals and the SHA they ran on), Limitations and Risks
   from `## PR summary`, plus a table of AC to status and the reviewed SHA. No secrets, no private names.
4. **Verify the real PR**, not your local copy:
   - `gh pr view <n> --json headRefOid,baseRefName,state,mergeable,files`: the head SHA equals the reviewed SHA, the base is right, the file list matches the AC map's scope.
   - `gh pr diff <n>`: the diff holds the change and nothing extra (no stray files, no secrets).
   - `gh pr checks <n>`: read each CI check. Pending is not passed; wait, or report it as pending.
5. **Feedback and CI failures.** For each review comment or failing check: classify it (see `test-and-diagnose`), fix in
   a new commit, re-run the affected tests and the gate, and note which comment each commit answers. If the head
   changed after the review, re-review the new commits. Reply to reviewers only with the user's approval of the text.
6. **Handoff report**, in the project's handoff file or the reply: status; decisions taken (and by whom); branch, PR
   number and SHAs (reviewed, head); checks and totals; blockers and open questions; the next action and its owner.

## Outputs and evidence

- PR URL, head SHA and base, and the `view`, `diff` and `checks` results summarised with the commands used.
- The handoff report.

## Failure and escalation

- No authorisation, no `gh`, or a rejected push: stop, report, and hand the user the body text.
- CI red: do not merge or mark ready; report the failing check and its class.
- PR head differs from the reviewed SHA: say so and re-review before calling it ready.
- Merge conflicts: never resolve them by discarding the other side's changes without telling the user.

## Done when

- The PR exists (or the user declined it), its head SHA, diff and CI were checked and reported, and the handoff report is written.

## Never claim

- Never claim CI passed while checks are pending, failed or unread.
- Never claim the PR is merged, approved or deployed unless `gh pr view` shows it.
- Never open, push or merge without the user's authorisation, and never claim a PR was verified without running the view, diff and checks commands.
