import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Fresh module per test: the in-memory fallbacks are module state.
const load = async () => {
  vi.resetModules();
  return import('./settings');
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('user name', () => {
  it('reads back a stored name', async () => {
    const s = await load();
    expect(s.setUserName('  Ana  ')).toBe(true);
    expect(s.getUserName()).toBe('Ana');
  });

  it('still returns a name set while localStorage.setItem throws (quota / private mode)', async () => {
    const s = await load();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(s.setUserName('Mauri')).toBe(true);
    expect(s.getUserName()).toBe('Mauri');
  });

  it('falls back to memory when localStorage.getItem throws', async () => {
    const s = await load();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    s.setUserName('Luis');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(s.getUserName()).toBe('Luis');
  });

  it('does not resurrect a name after storage is cleared when writes worked', async () => {
    const s = await load();
    s.setUserName('Ana');
    localStorage.clear();
    expect(s.getUserName()).toBe('');
  });
});

describe('last update check timestamp', () => {
  it('defaults to 0 and round-trips', async () => {
    const s = await load();
    expect(s.getLastUpdateCheck()).toBe(0);
    s.setLastUpdateCheck(1_700_000_000_000);
    expect(s.getLastUpdateCheck()).toBe(1_700_000_000_000);
  });

  it('ignores garbage values', async () => {
    const s = await load();
    localStorage.setItem('panda-wallet:last-update-check', 'nope');
    expect(s.getLastUpdateCheck()).toBe(0);
  });

  it('tolerates localStorage throwing (kept in memory for the session)', async () => {
    const s = await load();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => s.setLastUpdateCheck(42)).not.toThrow();
    expect(s.getLastUpdateCheck()).toBe(42);
  });

  it('clearing storage resets the throttle when writes worked', async () => {
    const s = await load();
    s.setLastUpdateCheck(42);
    localStorage.clear();
    expect(s.getLastUpdateCheck()).toBe(0);
  });

  it('shouldAutoCheckUpdates allows at most one check per 24h', async () => {
    const s = await load();
    const now = 1_700_000_000_000;
    expect(s.shouldAutoCheckUpdates(now)).toBe(true);
    s.setLastUpdateCheck(now);
    expect(s.shouldAutoCheckUpdates(now + 23 * 3600_000)).toBe(false);
    expect(s.shouldAutoCheckUpdates(now + 24 * 3600_000)).toBe(true);
    // clock moved backwards: don't get stuck for days
    expect(s.shouldAutoCheckUpdates(now - 48 * 3600_000)).toBe(true);
  });
});
