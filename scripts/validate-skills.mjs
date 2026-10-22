#!/usr/bin/env node
// Checks every skills/<name>/ folder before it is packaged or released.
// Usage: node scripts/validate-skills.mjs   (exit 0 = all skills valid, 1 = problems found)
// The private deny-list is never stored in this public repo: it comes from the environment variable DENY_LIST (the
// text, one term per line; in CI a repository secret) or DENY_LIST_FILE (a path outside the repo). Without either,
// the deny-list check is skipped with a WARNING. A hit names the term's line number, never the term, so CI logs
// stay clean. Terms match as case-insensitive substrings; a line starting with '!' is an allowed form instead (for
// example the owner's public GitHub handle), removed from each line before the terms are matched.

import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, skillsRoot, listSkillNames, listFilesRecursive } from './lib/skills-tree.mjs';
import { extractFrontmatter, parseFrontmatter } from './lib/frontmatter.mjs';

const NAME_PATTERN = /^[a-z0-9-]+$/;
const MAX_DESCRIPTION_CHARS = 1024;
const MAX_FILE_BYTES = 1024 * 1024;
// Public files outside skills/ that are checked against the deny-list too.
const DOC_PATHS = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'evals'];

function readDenyList() {
  const text = process.env.DENY_LIST_FILE ? fs.readFileSync(process.env.DENY_LIST_FILE, 'utf8') : process.env.DENY_LIST;
  if (!text) {
    console.warn('WARNING  no deny-list (DENY_LIST or DENY_LIST_FILE): the private-term check was skipped.');
    return [];
  }
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ term: line.trim().toLowerCase(), number: index + 1 }))
    .filter(({ term }) => term && !term.startsWith('#'));
}

function checkDocs(denyList) {
  const problems = [];
  for (const docPath of DOC_PATHS) {
    const fullPath = path.join(repoRoot, docPath);
    if (!fs.existsSync(fullPath)) continue;
    const files = fs.statSync(fullPath).isDirectory()
      ? listFilesRecursive(fullPath).map((relative) => path.join(docPath, relative))
      : [docPath];
    for (const file of files) {
      const text = fs.readFileSync(path.join(repoRoot, file), 'utf8');
      problems.push(...findDeniedText(text, file.split(path.sep).join('/'), denyList));
    }
  }
  return problems;
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
  const allowed = denyList.filter(({ term }) => term.startsWith('!')).map(({ term }) => term.slice(1));
  const denied = denyList.filter(({ term }) => !term.startsWith('!'));
  text.split(/\r?\n/).forEach((line, index) => {
    // An allowed form (a '!' line, e.g. the owner's public handle) is removed before the denied terms are matched.
    const lowered = allowed.reduce((current, form) => current.split(form).join(' '), line.toLowerCase());
    for (const { term, number } of denied) {
      if (lowered.includes(term)) problems.push(`${displayPath}:${index + 1} contains deny-list term #${number}`);
    }
  });
  return problems;
}

function main() {
  const denyList = readDenyList();
  const skillNames = listSkillNames();
  let failedCount = 0;

  for (const skillName of skillNames) {
    const skillDir = path.join(skillsRoot, skillName);
    const problems = [...checkSkillManifest(skillName, skillDir), ...checkFiles(skillDir, denyList)];
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
  const docProblems = checkDocs(denyList);
  if (docProblems.length > 0) {
    console.error('FAIL  repo docs and evals');
    for (const problem of docProblems) console.error(`      - ${problem}`);
  }
  console.log(`\n${skillNames.length - failedCount}/${skillNames.length} skills valid.`);
  if (failedCount > 0 || docProblems.length > 0) process.exit(1);
}

main();
