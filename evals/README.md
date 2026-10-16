# Evals

`evals.json` holds behaviour checks for every skill in `skills/`:

- `should_trigger` / `should_not_trigger`: prompts that should and should not make the agent pick the skill.
- `cases`: a prompt and the expectations a grader checks in the agent's transcript and output.

## Running them

1. Install the skills into a test agent (`npx skills add ./ --global`, or the plugin).
2. For each case, start a fresh session in a scratch project, send the prompt and save the transcript.
3. Grade each expectation PASS or FAIL, by hand or with an LLM judge given the expectation list and the transcript.
4. Record the result per case; a case that passed before a change and fails after it is a regression.

`node scripts/validate-evals.mjs` checks that every skill has at least one case and every case has a prompt and at
least one expectation. CI runs it with the skill validator.
