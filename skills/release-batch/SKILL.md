---
name: release-batch
description: |
  Release several finished branches to the test environment as one batch: gather them in a batch
  branch, check migrations for data changes, run ONE full local gate on a cleared machine, ONE
  independent review, open the PRs with the totals, promote the backend before any client that
  depends on its contract, watch the deploys, run a live smoke with correlation ids, and draft the
  evidence comments. Use when the user says "release", "promote to testing", "ship the batch",
  "ارفع", "ارفع على testing", "جهز للرفع", or when several fixes are ready at once.
---

# release-batch

One gate, one review and one promotion per batch, not per branch. It saves hours and CI minutes and
keeps the bar: every release on one project that followed this had zero failures after deploy.

## 1. Gather

- List the branches that are ready (pushed, filtered tests green, builder report read).
- Create `chore/<sprint>-batch-<date>` from the integration branch (`development`) in its own worktree.
  Merge each branch with `--no-ff` in a stated order; resolve conflicts keeping both sides' behaviour.
  Approved house-rule texts (CLAUDE.md) from both sides are all kept.
- A branch based on an old integration tip is merged, never rebased after it was pushed.

## 2. Check data changes

List the migrations between the deployed branch (`testing`) and the batch tip and read each `Up`.
Any UPDATE, DELETE, backfill or renumbering of existing rows: **stop** and tell the user which table,
columns and rows change, whether `Down` restores them, and what cannot be restored. New tables,
columns and indexes are fine. A rule change that only affects how existing rows are compared (for
example a new duplicate-name fold) gets a read-only query first that lists rows it would affect.

## 3. The gate

- **Clear the machine first.** Other test runs stopped, idle sessions closed, at least 4 GB of free
  RAM. A gate killed by low memory says nothing about the code and costs the whole run.
- Take the machine's test lock, run the project's full gate (for example `tools/verify.ps1 -Base
  origin/development`) once on the batch tip. A failed step re-runs only that project once, alone,
  before it counts.
- Run performance-category tests separately afterwards on the quiet machine if the batch touched
  search or other hot paths.

## 4. The review

One independent, read-only review of the batch diff against the stories' criteria and the product
decisions, by a separate agent or session that loads the project's guard skills and names them.
Blockers and majors are fixed before release; minors and nits in the same batch when cheap. A
reviewer's proposal that reverses a recorded product decision is not applied: ask the product owner.

## 5. Pull requests and promotion

- One PR for the batch into `development` with what is in it, the gate table with totals, the review
  result and what to recheck after deploy. One PR per client repository likewise.
- Tell the product owner before a backend promotion when the project asks for it.
- Merge, then promote `development` -> `testing` through a PR. **Backend first** when a client change
  depends on a new field or route; promote the client only after the backend deploy is green.
- Staging and production always need the user's explicit word.
- Watch each deploy run to the end, then check health on every API.

## 6. Live smoke

On the test environment, for every changed endpoint and screen: the call, the result and the
correlation id; a screenshot for UI. Recheck anything that differs between local and deployed
infrastructure (database version, word breaker, browser). Save the smoke file with the batch.

## 7. Evidence

- Re-read each story's status: never comment on a story already Done.
- Draft one evidence comment per story still in testing: build, what changed, the live checks with
  correlation ids, the automated tests by name, decided behaviour and known limits. Show them to the
  user; post after their yes; check each rendered.
- Move a story to Ready To Test only with the user's word.
- Update the handoff: branch tips, what was promoted, what is owed.
