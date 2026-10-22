#!/usr/bin/env node
// Checks every skills/<name>/ folder before it is packaged or released.
// Usage: node scripts/validate-skills.mjs   (exit 0 = all skills valid, 1 = problems found)

import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, skillsRoot, listSkillNames, listFilesRecursive } from './lib/skills-tree.mjs';
import { extractFrontmatter, parseFrontmatter } from './lib/frontmatter.mjs';

const NAME_PATTERN = /^[a-z0-9-]+$/;
const MAX_DESCRIPTION_CHARS = 1024;
const MAX_FILE_BYTES = 1024 * 1024;
// Section headings every lifecycle skill must have (see CONTRIBUTING.md). Existing skills are only reported.
const CONTRACT_HEADINGS = [
  'When to use',
  'Prerequisites',
  'Steps',
  'Outputs and evidence',
  'Failure and escalation',
  'Done when',
  'Never claim',
];
const CONTRACT_SKILLS = new Set([
  'task-context',
  'plan-and-ac-map',
  'test-and-diagnose',
  'independent-review',
  'pre-pr-gate',
  'pr-and-verify',
]);
const DENY_LIST_PATH = path.join(repoRoot, 'scripts', 'deny-list.txt');

function readDenyList() {
  return fs
    .readFileSync(DENY_LIST_PATH, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line && !line.startsWith('#'));
}

function checkSkillManifest(skillName, skillDir) {
  const manifestPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(manifestPath)) return ['SKILL.md is missing'];

  const frontmatter = extractFrontmatter(fs.readFileSync(manifestPath, 'utf8'));
  if (!frontmatter) return ['SKILL.md does not start with a --- YAML frontmatter block closed by ---'];

  let fields;
  try {
    fields = parseFrontmatter(frontmatter);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return [`frontmatter has an invalid quoted value: ${error.message}`];
  }
  return [...checkName(skillName, fields.name), ...checkDescription(fields.description)];
}

function checkName(skillName, name) {
  if (!name) return ['frontmatter `name` is missing'];
  const problems = [];
  if (name !== skillName) problems.push(`frontmatter name "${name}" does not equal the folder name "${skillName}"`);
  if (!NAME_PATTERN.test(name)) problems.push(`frontmatter name "${name}" does not match ${NAME_PATTERN}`);
  return problems;
}

function checkDescription(description) {
  if (description === undefined) return ['frontmatter `description` is missing'];
  const text = description.trim();
  if (!text) return ['frontmatter `description` is empty'];
  if (text.length > MAX_DESCRIPTION_CHARS) {
    return [`frontmatter description is ${text.length} characters; the limit is ${MAX_DESCRIPTION_CHARS}`];
  }
  return [];
}

/** Contract headings missing from SKILL.md: level-2 headings, case-insensitive, optional "1." numbering. */
function findMissingHeadings(skillDir) {
  const body = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
  const found = new Set(
    [...body.matchAll(/^##[ \t]+(?:\d+\.[ \t]*)?(.+?)[ \t]*$/gm)].map((match) => match[1].toLowerCase()),
  );
  return CONTRACT_HEADINGS.filter((heading) => !found.has(heading.toLowerCase()));
}

function checkFiles(skillDir, denyList) {
  const problems = [];
  for (const relativePath of listFilesRecursive(skillDir)) {
    const fullPath = path.join(skillDir, relativePath);
    const displayPath = relativePath.split(path.sep).join('/');
    const { size } = fs.statSync(fullPath);
    if (size > MAX_FILE_BYTES) problems.push(`${displayPath} is ${size} bytes; the limit is ${MAX_FILE_BYTES}`);
    problems.push(...findDeniedText(fs.readFileSync(fullPath, 'utf8'), displayPath, denyList));
  }
  return problems;
}

function findDeniedText(text, displayPath, denyList) {
  const problems = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const lowered = line.toLowerCase();
    for (const term of denyList) {
      if (lowered.includes(term)) problems.push(`${displayPath}:${index + 1} contains forbidden text "${term}"`);
    }
  });
  return problems;
}

function main() {
  const denyList = readDenyList();
  const skillNames = listSkillNames();
  let failedCount = 0;
  const lackingContract = [];

  for (const skillName of skillNames) {
    const skillDir = path.join(skillsRoot, skillName);
    const problems = [...checkSkillManifest(skillName, skillDir), ...checkFiles(skillDir, denyList)];
    if (fs.existsSync(path.join(skillDir, 'SKILL.md'))) {
      const missing = findMissingHeadings(skillDir);
      if (missing.length > 0 && CONTRACT_SKILLS.has(skillName)) {
        problems.push(`missing contract section(s): ${missing.join(', ')}`);
      } else if (missing.length > 0) {
        lackingContract.push(`${skillName} (${missing.length} missing)`);
      }
    }
    if (problems.length === 0) {
      console.log(`ok    ${skillName}`);
      continue;
    }
    failedCount++;
    console.error(`FAIL  ${skillName}`);
    for (const problem of problems) console.error(`      - ${problem}`);
  }

  if (skillNames.length === 0) {
    console.error('No skill folders found under skills/.');
    process.exit(1);
  }
  if (lackingContract.length > 0) {
    console.log(`\nNote (not a failure): ${lackingContract.length} existing skills lack contract sections:`);
    console.log(`  ${lackingContract.join(', ')}`);
  }
  console.log(`\n${skillNames.length - failedCount}/${skillNames.length} skills valid.`);
  if (failedCount > 0) process.exit(1);
}

main();
