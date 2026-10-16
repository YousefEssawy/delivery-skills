#!/usr/bin/env node
// Checks evals/evals.json: every skill folder under skills/ has an entry with at least one case,
// every case has an id, a prompt and at least one expectation, and no entry names a missing skill.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skills = readdirSync(join(root, 'skills')).filter((d) => statSync(join(root, 'skills', d)).isDirectory());
const evals = JSON.parse(readFileSync(join(root, 'evals', 'evals.json'), 'utf8')).skills ?? {};

const errors = [];
for (const skill of skills) {
  const entry = evals[skill];
  if (!entry) { errors.push(`${skill}: no entry in evals/evals.json`); continue; }
  if (!Array.isArray(entry.cases) || entry.cases.length === 0) errors.push(`${skill}: no cases`);
  for (const c of entry.cases ?? []) {
    if (!c.id || !c.prompt) errors.push(`${skill}: a case lacks an id or a prompt`);
    if (!Array.isArray(c.expectations) || c.expectations.length === 0) errors.push(`${skill}/${c.id}: no expectations`);
  }
}
for (const name of Object.keys(evals)) {
  if (!skills.includes(name)) errors.push(`${name}: eval entry for a skill that does not exist`);
}

if (errors.length) {
  for (const e of errors) console.error(`FAIL  ${e}`);
  process.exit(1);
}
console.log(`${skills.length}/${skills.length} skills have evals.`);
