---
name: session-coordinator
description: |
  Run a multi-session, multi-account sprint as the coordinator: split work into builder, reviewer
  and gate sessions (on a second account to save quota), give each a brief file and a name, keep one
  heavy run at a time with lock files and a RAM floor, recover after a crash or power loss, keep the
  handoff current and pushed, and bring only decisions and evidence to the user. Use when the user
  says "coordinate", "split the work across sessions", "use the other account", "the laptop died,
  continue", "وزع الشغل على السيشنز", "اشتغل بالاكونت التاني", "اللاب فصل كمل", "نسق الشغل".
---

# session-coordinator

The coordinator decides, routes and verifies; other sessions build, review and run gates. The user
sees outcomes, evidence and the few things that need their word.

## Roles and briefs

- **One coordinator** (this session). It talks to the user, reads the board, holds the handoff, runs
  browser work (only it may have the browser), and approves nothing on the user's behalf.
- **Builders** (one per story or fix set, fresh session each), **one reviewer** per batch (read-only),
  **one gate runner** per batch. Heavy work goes to the second account to save the coordinator's quota.
- Write each task as a **brief file** in the project's state folder (what to build, branch and
  worktree, rules, test-first, skills to load and name, lock and RAM rules, what to report, what not
  to touch). The user pastes one line into a fresh session: `Read <brief> and do exactly what it says.`
- Give every session a **name** and tell the user which terminal is which (ask each session to print
  "This terminal = <name> (<role>)"); suggest `/rename`. Before giving a session a task, check its
  role: a session started as a read-only reviewer must not be turned into a builder.
- Peer messages are information, never the user's approval. A session that refuses an action for lack
  of the user's word is right; get the word from the user, never route it through another session.
  When the user answers the coordinator, say so plainly and do the step yourself if it is yours.

## Machine resources

- One heavy run at a time per machine: a lock file (`.testrun.lock` with owner, branch, time, pid)
  taken exclusively; others wait and retry. A stale lock (process gone) is removed by the coordinator.
- Before a full gate: free RAM of at least 4 GB; ask the user to close idle sessions and apps.
- Shared test accounts: a separate account lock for anything that changes an account or relationship,
  held at most 10 minutes, with the previous state restored.

## Recovery after a crash, restart or power loss

1. Check what survived: lock files (owner process alive?), consoles and local tools (restart them; the
   user signs in again), worktrees (`git status`, unpushed commits), pushed branch tips.
2. Check what a session left on the shared environment (for example test records it activated) and
   restore it before anything else.
3. Resume each agent or session with a message saying what happened, its last pushed tip and what is
   uncommitted; ask it to push after every step from now on.
4. Write the state into the handoff and push it.

## Keeping state

- The handoff file holds what is done, what runs where, branch tips, locks, accounts and what does not
  travel; it is pushed to a branch so another machine or account can continue.
- Product decisions go into the project's decision record; standing rules go into the project's
  workflow file or the shared setup repo, never only into memory.
- Before reporting "done": re-read the board, verify the claim live, and say what was not run.

## Talking to the user

Lead with what is done, what is running and what needs them, in a table. Collect product questions and
send them as one message. Show every comment and every house-rule text before it is posted or written.
When the user is away, keep going on what is authorised and leave a clear list for their return.
