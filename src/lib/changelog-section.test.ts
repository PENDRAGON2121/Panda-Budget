import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs script without type declarations
import { changelogSection } from '../../scripts/changelog-section.mjs';

const log = `# Changelog

## [0.0.2] - 2026-02-01
- Second

## [0.0.1] - 2026-01-01
- First
- Items

[0.0.2]: https://example.com/2
`;

describe('changelogSection', () => {
  it('returns the body of the requested section', () => {
    expect(changelogSection(log, '0.0.2')).toBe('- Second');
  });
  it('handles the last section (stops at link references)', () => {
    expect(changelogSection(log, '0.0.1')).toBe('- First\n- Items');
  });
  it('throws when the section is missing', () => {
    expect(() => changelogSection(log, '9.9.9')).toThrow(/No CHANGELOG section/);
  });
  it('handles CRLF line endings', () => {
    expect(changelogSection(log.replace(/\n/g, '\r\n'), '0.0.1')).toBe('- First\n- Items');
  });
  it('throws when the section body is empty', () => {
    expect(() => changelogSection('## [1.0.0] - x\n\n## [0.9.0] - y\n- a\n', '1.0.0')).toThrow(/empty/);
  });
});
