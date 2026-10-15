# delivery-skills

Skills for coding agents that ship stories **without bugs reaching QA**: test like QA before Ready To Test, triage the
bugs that still arrive, release in batches behind one gate and one review, coordinate several agent sessions, and
measure the result sprint over sprint. Plus the review, backend and frontend guards they rely on.

They came out of a real sprint where this way of working cut the real bugs on the backend and web from 30 to 5 and
raised the share of stories that passed QA first time from 55% to 79%.

## Install

```bash
npx skills add YousefEssawy/delivery-skills --list          # see what is inside
npx skills add YousefEssawy/delivery-skills --global        # all skills, for every project
npx skills add YousefEssawy/delivery-skills --skill qa-rehearsal --global
npx skills add YousefEssawy/delivery-skills --skill '*' --agent claude-code --global
```

Works with Claude Code, Codex, Cursor, OpenCode and the other agents the [Skills CLI](https://github.com/vercel-labs/skills)
supports. On claude.ai, a skill can also be uploaded as a zip (one folder with its `SKILL.md`) from
Customize > Skills > Add > Upload skill; it then follows the account to every device.

## Update

Skills install as a copy, so a new version here reaches an agent only when it is updated:

```bash
npx skills update                     # every installed skill
npx skills update qa-rehearsal
```

Re-running `npx skills add YousefEssawy/delivery-skills` also fetches the latest. Changes are listed in
[CHANGELOG.md](CHANGELOG.md); releases are tagged `vMAJOR.MINOR.PATCH`.

## The skills

### Delivery workflow

| Skill | Use it when |
|---|---|
| [`qa-rehearsal`](skills/qa-rehearsal/SKILL.md) | A story is about to move to Ready To Test: read every criterion literally, split it into claims, try each one live with the edge cases QA tries. |
| [`bug-triage`](skills/bug-triage/SKILL.md) | New bugs arrive: decide real bug, not a bug or product decision from the story, the decisions and the code, then reply or fix test-first. |
| [`release-batch`](skills/release-batch/SKILL.md) | Several fixes are ready: one batch branch, one gate on a cleared machine, one review, backend before its clients, live smoke, evidence. |
| [`session-coordinator`](skills/session-coordinator/SKILL.md) | Work is split across sessions or accounts: briefs, roles, locks, crash recovery, handoff. |
| [`sprint-quality-report`](skills/sprint-quality-report/SKILL.md) | A sprint ends: compare it with the last one from the board, with an assessment and next steps. |

### Review and planning

| Skill | Use it when |
|---|---|
| [`skills-router`](skills/skills-router/SKILL.md) | Starting a story: pick the guards and map every criterion to a named test. |
| [`change-impact-review`](skills/change-impact-review/SKILL.md) | Before changing existing code: search first, check every layer, report back. |
| [`review-all`](skills/review-all/SKILL.md) | A full story, a contract, data or a migration changed: run every guard that applies and merge the findings. |
| [`git-commit`](skills/git-commit/SKILL.md) | Writing a Conventional Commits message from the real diff. |

### Backend (.NET)

| Skill | Use it when |
|---|---|
| [`controller-guide`](skills/controller-guide/SKILL.md) | Writing or auditing Web API controllers. |
| [`dotnet-backend-validation`](skills/dotnet-backend-validation/SKILL.md) | Adding FluentValidation validators, or finding requests with none. |
| [`dotnet-backend-testing`](skills/dotnet-backend-testing/SKILL.md) | Writing NUnit tests, or finding services and validators with no tests. |
| [`date-kind-guard`](skills/date-kind-guard/SKILL.md) | Adding a date or time field end to end without off-by-one-day bugs. |

### Frontend

| Skill | Use it when |
|---|---|
| [`frontend-form-validation`](skills/frontend-form-validation/SKILL.md) | Auditing Angular or React forms against the backend's rules. |
| [`ui-responsive-audit`](skills/ui-responsive-audit/SKILL.md) | Checking a UI in a real browser across sizes, RTL and LTR, light and dark. |
| [`i18n-locale-sync`](skills/i18n-locale-sync/SKILL.md) | Adding user-facing text to every locale at once. |
| [`clone-feature`](skills/clone-feature/SKILL.md) | Building a feature that mirrors an existing one, every layer and wiring point. |

### Communication

| Skill | Use it when |
|---|---|
| [`arabic-tech-explainer`](skills/arabic-tech-explainer/SKILL.md) | Explaining technical English in Egyptian Arabic with the English terms kept, rendered right to left. |

## Works well with

[amElnagdy/guard-skills](https://github.com/amElnagdy/guard-skills) (`clean-code-guard`, `test-guard`, `docs-guard`):
`review-all` and `release-batch` use them when they are installed.

## Contributing

One folder per skill under `skills/`, with a `SKILL.md` whose front matter has `name` and `description`. Keep project
names, people, hosts and credentials out of every skill. Bump the version and add a CHANGELOG entry with every change.

## License

MIT
