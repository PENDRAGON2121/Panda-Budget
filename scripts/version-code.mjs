// Android versionCode from a semver string: major*10000 + minor*100 + patch (0.0.1 -> 1).
// Usage: node scripts/version-code.mjs [version]   (defaults to package.json version)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function versionCode(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!m) throw new Error(`Invalid semver: ${version}`);
  const [major, minor, patch] = m.slice(1).map(Number);
  if (minor > 99 || patch > 99) throw new Error(`minor/patch must be <= 99: ${version}`);
  return major * 10000 + minor * 100 + patch;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const version =
    process.argv[2] ?? JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  console.log(versionCode(version));
}
