# Changelog

## v1.1.0 - 2026-10-16

- New skills: `sprint-kickoff`, `migration-safety`, `evidence-comment`, `mobile-qa-selftest`.
- Every skill made project-neutral: any issue tracker, branch names, test gate and layout are examples, and Arabic/RTL checks
  apply when the product supports them.
- `dotnet-backend-validation`, `dotnet-backend-testing` and `frontend-form-validation` translated to English, keeping their
  Arabic trigger phrases; they detect the project's layout and follow its existing validation and test frameworks.
- `ui-responsive-audit`: the overflow scan now also catches left-edge overflow in right-to-left pages.
- `change-impact-review`: removed stray NUL bytes that made the file binary.
- Claude Code plugin marketplace (`/plugin install delivery-skills@delivery-skills`) with a push reminder hook for Bash and PowerShell.
- CI: skill and eval validation on every push; tagged releases attach one zip per skill and `delivery-skills-all.zip`.
- Evals for every skill in `evals/evals.json`.

## v1.0.1 - 2026-10-16

- README rewritten: how the skills fit together (diagram and stage table), and for every skill what it does, a prompt
  to try and what you get. Skills written in Egyptian Arabic are marked.

## v1.0.0 - 2026-10-16

First release.

- New delivery workflow skills: `qa-rehearsal`, `bug-triage`, `release-batch`, `session-coordinator`,
  `sprint-quality-report`.
- Review and planning: `skills-router`, `change-impact-review`, `review-all`, `git-commit`.
- Backend (.NET): `controller-guide`, `dotnet-backend-validation`, `dotnet-backend-testing`, `date-kind-guard`.
- Frontend: `frontend-form-validation`, `ui-responsive-audit`, `i18n-locale-sync`, `clone-feature`.
- Communication: `arabic-tech-explainer`.
