// Parses the top-level scalar keys of a YAML frontmatter block, which is all SKILL.md uses:
// plain, single- or double-quoted values, and `|` / `>` block scalars with an optional
// chomping indicator. Nested maps and lists are skipped, not interpreted.

const KEY_LINE = /^([A-Za-z0-9_-]+):(?:\s+(.*))?$/;
const BLOCK_HEADER = /^([|>])([+-]?)\s*$/;

/** Returns the raw frontmatter text, or null when the file does not start with `---`. */
export function extractFrontmatter(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  if (lines[0].trim() !== '---') return null;
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (end === -1) return null;
  return lines.slice(1, end);
}

/** Maps each top-level key to its string value. */
export function parseFrontmatter(lines) {
  const fields = {};
  for (let i = 0; i < lines.length; i++) {
    const match = KEY_LINE.exec(lines[i]);
    if (!match) continue;
    const [, key, rawValue = ''] = match;
    const block = BLOCK_HEADER.exec(rawValue);
    if (block) {
      const body = collectIndented(lines, i + 1);
      fields[key] = renderBlock(body, block[1], block[2]);
      i += body.length;
    } else {
      fields[key] = unquote(rawValue.trim());
    }
  }
  return fields;
}

function collectIndented(lines, start) {
  const body = [];
  for (let i = start; i < lines.length; i++) {
    if (lines[i].trim() !== '' && !/^\s/.test(lines[i])) break;
    body.push(lines[i]);
  }
  while (body.length && body[body.length - 1].trim() === '') body.pop();
  return body;
}

function renderBlock(body, style, chomping) {
  const indent = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length));
  const dedented = body.map((l) => l.slice(indent));
  const joined = style === '|' ? dedented.join('\n') : foldLines(dedented);
  return chomping === '-' ? joined : `${joined}\n`;
}

function foldLines(lines) {
  return lines
    .join('\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, ' '))
    .join('\n');
}

function unquote(value) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return JSON.parse(value);
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}
