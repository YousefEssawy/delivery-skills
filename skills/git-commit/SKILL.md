---
name: git-commit
description: >-
  Craft a clean, correctly-classified Conventional Commits message from the current git changes — read the actual diff to decide whether each change is a feat, fix, refactor, docs, test, chore, perf, style, build, ci, or revert — then present the message (and a split plan when changes span unrelated concerns) for the user to approve BEFORE committing. NEVER auto-commits, NEVER adds a Co-Authored-By or "Generated with" trailer (unless the project's or user's instructions require one), and writes the message in English only. Use this skill WHENEVER the user wants to commit work or wants a commit message written, even a quick one-liner. Triggers — English: "commit this", "commit my changes", "write a commit message", "make a commit", "stage and commit". وبالعربي: "اعمل كومت", "اعمل commit", "كومت الشغل/التغييرات", "اكتبلي رسالة كومت", "لخص اللي عملته في كومت منظم". Scope — any git repository; the type is decided from the diff, never guessed from the user wording.
---

# Git Commit

Turn the current working-tree changes into a clean, well-structured **Conventional Commits** message, show it to the user, and commit **only after they approve**. The whole point of this skill is the review gate plus correct classification — committing writes to the project history on the user's behalf, so they get the final say every time.

## Core workflow

1. **Inspect** the repo state (read-only).
2. **Decide scope** — what actually goes into this commit (staged set vs. all changes).
3. **Classify** each change from the diff into a Conventional Commits type.
4. **Draft** the message — or a numbered split plan when the changes are unrelated *or* large (dozens of files).
5. **Present and STOP.** Show the message/plan and wait for explicit approval. Do **not** run `git commit` yet.
6. **Commit** only after approval, then confirm. Never push.

Walk these in order. Steps 1–4 are silent prep; step 5 is the gate; step 6 happens only on a clear "yes".

---

## Step 1 — Inspect the changes

Run these read-only commands to see exactly what changed:

```bash
git status                 # staged / unstaged / untracked, branch, merge or rebase state
git diff --stat            # quick map: which files changed and how much
git diff --staged --stat   # same map, for the staged set
git diff --staged          # full staged diff
git diff                   # full unstaged diff (but see the large-changeset note below)
git log --oneline -5       # the repo's existing commit style
```

For untracked files, their contents aren't in `git diff`; note them from `git status` and read the files directly if you need to classify them.

**Large changesets (dozens of files):** do **not** dump the entire diff into one read. Start from the `--stat` map, cluster the files by area/concern, then read the diff **per cluster** (`git diff -- <paths>`) only as deep as you need to classify that cluster. This keeps the analysis focused, avoids drowning in one giant diff, and is exactly what makes correct multi-commit splitting possible (Step 5).

**Match the repo's existing style.** Look at `git log --oneline -5`: does this project already use Conventional Commits? Scopes? A particular casing? If the repo has a clearly established convention, follow it over the defaults below — a consistent, readable log matters more than rigidly applying an external standard.

---

## Step 2 — Decide what goes into the commit

- **If there are staged changes** → commit the **staged set only**. Briefly mention any unstaged or untracked changes being left behind, so the user isn't surprised by what's *not* in the commit.
- **If nothing is staged but there are changes** → analyze all changed and relevant untracked files, propose the commit (or split plan), and on approval stage the right files per commit.
- **Never blindly `git add -A`** when the changes are clearly unrelated. That's how stray files and debug edits sneak into history. Stage deliberately.

---

## Step 3 — Classify the change (Conventional Commits)

Decide the type from the **actual diff**, not from how the user phrased the request. Use the dominant purpose of the change:

| Type | Use when the change… |
|------|----------------------|
| `feat` | adds a new capability/endpoint/UI — users can now do something new |
| `fix` | corrects a bug or wrong behavior |
| `refactor` | restructures code with **no** external behavior change (rename, extract, reorganize) |
| `perf` | improves performance |
| `docs` | touches only documentation, comments, or README |
| `test` | adds or fixes tests only |
| `style` | formatting / whitespace / lint only, no logic change |
| `build` | build system, dependencies, packaging |
| `ci` | CI config or pipelines |
| `chore` | maintenance that fits nowhere above (tooling, configs, housekeeping) |
| `revert` | reverts a previous commit |

When a single coherent change touches several areas, pick the **dominant** type. When the diff contains genuinely separate concerns, that's the signal to **split** (Step 5).

**Scope** (optional): the module/area touched, e.g. `feat(auth):`. Add it when it's obvious and adds clarity; omit it when it would just be noise.

---

## Step 4 — Write the message

Format:

```
type(scope): short imperative subject

Optional body explaining the WHY/context, wrapped at ~72 columns.
List multiple related changes as logically grouped bullets:
- did X
- did Y

Optional footer:
BREAKING CHANGE: what broke and how to migrate
Closes #123
```

**Subject line**
- Imperative mood — "add", not "added" or "adds".
- Lowercase after the colon; **no trailing period**.
- ≤50 characters ideal, 72 hard max.
- Summarize the *change*, not the filenames.

**Body** (include when the change isn't self-evident)
- Explain the **why/context** — the diff already shows the *what*.
- Wrap lines at ~72 columns.
- When several related changes ship together, list them as grouped bullets. This is the "organized" part — make the body scannable.
- Skip the body entirely for trivial commits (a typo fix doesn't need a paragraph). Don't pad.

**Footer**
- `BREAKING CHANGE: ...` when public behavior/API breaks (the `type!:` shorthand is also fine).
- Reference issues only if the user actually mentions them (`Closes #N`). Never invent issue numbers.

**Always:** English only, **no** Co-Authored-By trailer, **no** "Generated with" line (unless the project's or the user's instructions require one — see Hard rules), **no** emoji.

---

## Step 5 — Split into multiple commits

Two things make splitting the right move:

1. **Unrelated concerns** — the diff mixes things that don't belong together (a bug fix + an unrelated feature + a docs tweak).
2. **A large changeset** — dozens of files changed at once (e.g. 50–60). A single commit that big is unreviewable and buries the history. When the changeset is large, **default to splitting it into several focused commits grouped by the content of the change — proactively, without waiting to be asked.**

**How to group a large changeset.** From the `--stat` map (Step 1), cluster the files by what they actually change, in roughly this priority:

- **By concern / feature first** — all the files that together implement or fix one thing go in one commit (e.g. a new "CSV export" feature: its service, controller, route, and UI all belong together).
- **By change type next** — keep `feat`, `fix`, `refactor`, `docs`, `test`, and `chore` separable. A refactor that touched 30 files is its own commit, never smuggled in with a feature.
- **By module / directory as a tiebreaker** — when a change is broad but mechanical, split along module lines (e.g. a rename across `src/auth/*` vs `src/billing/*`).

Each resulting commit should be **one coherent, self-contained change** that could stand on its own in the history and ideally build/pass independently.

**Order the commits sensibly:** foundational changes first (refactors, renames, shared utilities), then the features and fixes that build on them, then tests, then docs and chores last. This keeps each commit coherent and the history bisectable.

**Don't over-split.** Files that form a single logical unit stay together — splitting 60 files into 60 commits is as bad as cramming them into one. Aim for a handful of meaningful commits (often 3–8), each telling one clear part of the story.

**Always present a numbered plan first** (see the example at the end): for each commit, the type/subject and the files it includes. After the user approves, execute in order — for each commit `git add <its files>` then commit. If the user wants to merge, reorder, or re-split groups, adjust and re-present before committing anything.

---

## Step 6 — Present for review, then wait (THE GATE)

Show the full proposed message — or the split plan — and **stop**. Do not commit yet.

This gate is the entire reason the skill exists: committing writes to the project history on the user's behalf, so the decision is theirs. Wait for explicit approval ("yes", "go", or the same in the user's language, e.g. Arabic "اعملها", "تمام"...). If they ask for a tweak, revise and re-present. Commit **only** once they clearly approve.

---

## Step 7 — Commit (after approval only)

Stage if needed, then commit. For a multi-line message, use a heredoc so the formatting is preserved exactly:

```bash
git commit -m "$(cat <<'EOF'
type(scope): subject

- bullet one
- bullet two

BREAKING CHANGE: ...
EOF
)"
```

For a split, repeat per commit in the planned order (`git add` the files for that commit, then the heredoc commit). Afterward, confirm what landed (`git log --oneline -n <count>` or report the new subjects).

**Do not push.** Committing is local; pushing is a separate action the user hasn't asked for.

---

## Hard rules (and why)

- **Never commit without explicit approval.** The user chose review-first; committing on their behalf is theirs to approve.
- **Never add a Co-Authored-By trailer or any "Generated with" line** — this skill's default, for clean commits. If the project's or the user's own instructions require an attribution trailer, follow them.
- **Message is English only**, regardless of the language the user is chatting in — it keeps the repo log consistent and tooling-friendly.
- **No destructive git operations** (`reset --hard`, `clean -fd`, `checkout --` that discards work, `push --force`, `commit --amend` on already-pushed commits) unless the user explicitly asks. This skill only inspects, stages, and commits.
- **Classify from the diff**, never from the user's wording alone.

---

## Edge cases

- **Nothing staged and no changes at all** → tell the user there's nothing to commit.
- **Only untracked files** → list them and propose including the relevant ones; confirm before staging.
- **Mixed staged + unstaged** → default to the staged set; mention what's left out.
- **Mid-merge or mid-rebase** (seen in `git status`) → flag it; a normal commit may be inappropriate. Surface the state and let the user decide.
- **A pre-commit hook fails** → report the hook's output; never bypass with `--no-verify` unless the user explicitly asks.
- **Huge diff / many files (dozens)** → map it with `--stat` first, cluster by concern, and **default to a grouped multi-commit plan** (Step 5). Never force 50–60 files into a single commit.
- **Repo already uses a different convention** (from `git log`) → match the repo over these defaults.

---

## Examples

**Single fix (with a short body explaining the why):**
Input: Corrected an off-by-one in pagination so the last page renders.
Output:
```
fix(pagination): include final page in results

The page count used a strict less-than bound, so the last page was
dropped whenever the total was an exact multiple of the page size.
```

**Feature with scope and grouped bullets:**
Input: Added phone OTP verification to the sign-up flow — new endpoint + UI step.
Output:
```
feat(auth): add phone OTP verification to sign-up

- add POST /auth/otp/verify endpoint
- wire the OTP step into the sign-up screen
- persist the verified phone on the user profile
```

**Refactor, no behavior change:**
Input: Extracted the per-country gateway routing into its own interceptor.
Output:
```
refactor(network): extract gateway routing into interceptor

No behavior change; moves per-country base-URL selection out of the
service layer so request building lives in one place.
```

**Trivial — no body:**
Input: Fixed a typo in the README setup section.
Output:
```
docs: fix typo in setup instructions
```

**Split plan (two unrelated concerns):**
```
Proposed 2 commits:

1. fix(cart): prevent negative quantities at checkout
   files: src/cart/quantity.ts, src/cart/checkout.ts

2. docs: document the new CART_MAX env var
   files: README.md, .env.example
```
(After approval: stage and commit #1, then stage and commit #2.)

**Large changeset (~55 files) grouped into focused commits:**
```
Proposed 5 commits:

1. refactor(api): rename UserDto to UserResponse across the API
   files: 22 files under src/Api/** and src/Bll/**  (mechanical rename, no behavior change)

2. feat(reports): add CSV export for sales reports
   files: src/Bll/Reports/CsvExporter.cs, src/Api/ReportsController.cs,
          src/Web/reports/export-button.tsx  (+3 more)

3. fix(auth): reject expired refresh tokens
   files: src/Bll/Auth/RefreshTokenService.cs, src/Dal/TokenRepository.cs

4. test(reports): cover CSV export edge cases
   files: tests/Reports/CsvExporterTests.cs  (+2 more)

5. docs: document the reports export endpoint
   files: README.md, docs/api/reports.md
```
Foundational refactor first, then the feature, its fix, its tests, and docs last — each commit stands on its own. After approval: stage and commit each group in order.
