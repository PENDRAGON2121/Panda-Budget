// Prints the CHANGELOG.md section body for a version. Usage: node scripts/changelog-section.mjs 0.0.1
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function changelogSection(text, version) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
  if (start === -1) throw new Error(`No CHANGELOG section for ${version}`);
  let end = lines.findIndex((l, i) => i > start && (l.startsWith('## [') || /^\[[^\]]+\]:/.test(l)));
  if (end === -1) end = lines.length;
  const body = lines.slice(start + 1, end).join('\n').trim();
  if (!body) throw new Error(`CHANGELOG section for ${version} is empty`);
  return body;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log(changelogSection(readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8'), process.argv[2]));
  } catch (e) {
    console.log(`::error::${e.message}`);
    process.exit(1);
  }
}
