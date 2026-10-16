#!/usr/bin/env node
// PreToolUse hook for Bash. When the command runs `git push` to a deploying branch, it shows a
// reminder to run the project's full test gate first. It never blocks or approves the command:
// it always exits 0 and never sets permissionDecision, so the normal permission prompt still applies.

import { execFileSync } from 'node:child_process';

const DEPLOYING_BRANCHES = new Set(['testing', 'staging', 'production', 'main', 'master']);
const COMMAND_SEPARATOR = /&&|\|\||[;|\n]/;
// git global options that take a separate value, e.g. `git -C ../repo push`.
const GIT_OPTIONS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace']);
// git push options that take a separate value, e.g. `git push -o ci.skip origin main`.
const PUSH_OPTIONS_WITH_VALUE = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec']);

function readStdin() {
  return new Promise((resolve) => {
    let text = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (text += chunk));
    process.stdin.on('end', () => resolve(text));
  });
}

const SHELL_REDIRECTION = /^\d*[<>]/;
const CURRENT_BRANCH_ALIASES = new Set(['HEAD', '@']);

function tokenize(segment) {
  return segment
    .trim()
    .split(/\s+/)
    .filter((token) => !SHELL_REDIRECTION.test(token))
    .map((token) => token.replace(/^["']|["']$/g, ''));
}

/** Indexes of the tokens that are neither options nor option values. */
function positionalIndexes(tokens, optionsWithValue) {
  const indexes = [];
  for (let i = 0; i < tokens.length; i++) {
    if (optionsWithValue.has(tokens[i])) i++;
    else if (!tokens[i].startsWith('-')) indexes.push(i);
  }
  return indexes;
}

/** Returns the refspecs of a `git ... push ...` segment, or null when the segment is not a push. */
function pushRefspecs(segment) {
  const tokens = tokenize(segment);
  if (tokens[0] !== 'git') return null;
  const gitArgs = tokens.slice(1);
  const [subcommandIndex] = positionalIndexes(gitArgs, GIT_OPTIONS_WITH_VALUE);
  if (gitArgs[subcommandIndex] !== 'push') return null;
  const pushArgs = gitArgs.slice(subcommandIndex + 1);
  const [, ...refspecIndexes] = positionalIndexes(pushArgs, PUSH_OPTIONS_WITH_VALUE);
  return refspecIndexes.map((i) => pushArgs[i]);
}

function destinationBranch(refspec) {
  const destination = refspec.includes(':') ? refspec.slice(refspec.lastIndexOf(':') + 1) : refspec;
  return destination.replace(/^\+/, '').replace(/^refs\/heads\//, '');
}

function currentBranch(cwd) {
  try {
    return execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null; // detached HEAD or not a repository: nothing to remind about
  }
}

function deployingTargets(command, cwd) {
  const targets = new Set();
  for (const segment of command.split(COMMAND_SEPARATOR)) {
    const refspecs = pushRefspecs(segment);
    if (refspecs === null) continue;
    const destinations = refspecs.length > 0 ? refspecs.map(destinationBranch) : ['HEAD'];
    for (const destination of destinations) {
      const branch = CURRENT_BRANCH_ALIASES.has(destination) ? currentBranch(cwd) : destination;
      if (DEPLOYING_BRANCHES.has(branch)) targets.add(branch);
    }
  }
  return [...targets];
}

async function main() {
  let hookInput;
  try {
    hookInput = JSON.parse(await readStdin());
  } catch (error) {
    if (error instanceof SyntaxError) return; // unreadable input: stay silent, never block
    throw error;
  }
  const command = hookInput?.tool_input?.command;
  if (typeof command !== 'string') return;

  const targets = deployingTargets(command, hookInput.cwd || process.cwd());
  if (targets.length === 0) return;

  const reminder =
    `About to push to a deploying branch (${targets.join(', ')}). ` +
    "Run the project's full test gate locally first; CI may run no tests.";
  process.stdout.write(
    JSON.stringify({
      systemMessage: reminder,
      hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: reminder },
    }),
  );
}

main();
