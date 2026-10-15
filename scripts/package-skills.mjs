#!/usr/bin/env node
// Writes dist/<skill>.zip for every skill (entries rooted at <skill>/) and
// dist/delivery-skills-all.zip with all skills. Entry paths always use forward slashes:
// claude.ai rejects uploads whose paths contain Windows backslashes.
// Usage: node scripts/package-skills.mjs   (run validate-skills.mjs first)

import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, skillsRoot, listSkillNames, listFilesRecursive } from './lib/skills-tree.mjs';
import { createZip } from './lib/zip-writer.mjs';

const DIST_DIR = path.join(repoRoot, 'dist');
const BUNDLE_NAME = 'delivery-skills-all.zip';

function skillEntries(skillName) {
  const skillDir = path.join(skillsRoot, skillName);
  return listFilesRecursive(skillDir).map((relativePath) => ({
    name: [skillName, ...relativePath.split(path.sep)].join('/'),
    content: fs.readFileSync(path.join(skillDir, relativePath)),
  }));
}

function writeZip(fileName, entries) {
  const archive = createZip(entries);
  fs.writeFileSync(path.join(DIST_DIR, fileName), archive);
  console.log(`dist/${fileName}  ${entries.length} files, ${archive.length} bytes`);
}

function main() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR);

  const allEntries = [];
  for (const skillName of listSkillNames()) {
    const entries = skillEntries(skillName);
    writeZip(`${skillName}.zip`, entries);
    allEntries.push(...entries);
  }
  writeZip(BUNDLE_NAME, allEntries);
}

main();
