// Prints the CHANGELOG.md section body for a version. Usage: node scripts/changelog-section.mjs 0.0.1
import { readFileSync } from 'node:fs';

export function changelogSection(text, version) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
  if (start === -1) throw new Error(`No CHANGELOG section for ${version}`);
  let end = lines.findIndex((l, i) => i > start && (l.startsWith('## [') || /^\[[^\]]+\]:/.test(l)));
  if (end === -1) end = lines.length;
  return lines.slice(start + 1, end).join('\n').trim();
}

if (process.argv[2]) {
  console.log(changelogSection(readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8'), process.argv[2]));
}
