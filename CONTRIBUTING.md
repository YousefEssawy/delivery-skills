# Contributing

## Adding or changing a skill

- One folder per skill under `skills/`, with a `SKILL.md` whose front matter has `name` (equal to the folder name) and `description`.
- Every skill must work on any project: no project, company, person, ticket or host names. CI scans `skills/` against `scripts/deny-list.txt`. Use generic examples (a TODO API, a shop cart).
- Add or update the skill's cases in `evals/evals.json` (an entry with at least one case; each case has an `id`, a `prompt` and `expectations`).
- Run both checks before you push:

```bash
node scripts/validate-skills.mjs
node scripts/validate-evals.mjs
```

- Add a `## vX.Y.Z` section to CHANGELOG.md, bump `.claude-plugin/plugin.json`, then tag `vX.Y.Z` (maintainers).

## Skill structure

Every `SKILL.md` body has these level-2 sections, in this order, so any skill can be read the same way:

| Section | What it holds |
|---|---|
| `## When to use` | The situations that start the skill, and the neighbouring skills it is not for. |
| `## Prerequisites` | What must exist first: files, tools, access, the output of an earlier skill. |
| `## Steps` | The ordered procedure. Reference other skills instead of repeating them. |
| `## Outputs and evidence` | What the skill produces and the proof that goes with it (commands, results, files). |
| `## Failure and escalation` | What to do when a step cannot be done, and when to stop and ask the user. |
| `## Done when` | The checkable exit criteria. |
| `## Never claim` | The statements the skill must never make without the evidence. |

`validate-skills.mjs` **fails** when a lifecycle skill (`task-context`, `plan-and-ac-map`, `test-and-diagnose`,
`independent-review`, `pre-pr-gate`, `pr-and-verify`) lacks one of these headings. For the other skills it only **reports**
which ones lack them; they are not failures. A new skill that follows the structure is added to `CONTRACT_SKILLS` in
`scripts/validate-skills.mjs` so the check applies to it.

## Lifecycle skills and the gate

The lifecycle skills use two file formats (the AC map and the review file) and call the pre-PR gate script that lives in
the claude-setup repository, by its installed path `~/.claude/claude-setup/scripts/gate.ps1`. Do not copy the gate's logic
into a skill: describe when to run it and how to read its result, and say what to do when the script is missing.
