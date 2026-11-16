import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script without type declarations
import { versionCode } from '../../scripts/version-code.mjs';

describe('versionCode', () => {
  it('maps semver to major*10000 + minor*100 + patch', () => {
    expect(versionCode('0.0.1')).toBe(1);
    expect(versionCode('0.1.0')).toBe(100);
    expect(versionCode('1.2.3')).toBe(10203);
  });
  it('ignores pre-release suffixes', () => {
    expect(versionCode('1.0.0-beta.1')).toBe(10000);
  });
  it('rejects invalid or overflowing versions', () => {
    expect(() => versionCode('abc')).toThrow();
    expect(() => versionCode('0.100.0')).toThrow();
  });
});
