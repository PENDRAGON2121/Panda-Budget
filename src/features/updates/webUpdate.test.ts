import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkWebUpdate } from './webUpdate';

const stubSW = (reg: unknown) =>
  vi.stubGlobal('navigator', { ...navigator, onLine: true, serviceWorker: { getRegistration: () => Promise.resolve(reg) } });

describe('checkWebUpdate', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is offline when the browser says so', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: false });
    expect(await checkWebUpdate()).toBe('error');
  });

  it('is up to date without a service worker (dev / unsupported)', async () => {
    vi.stubGlobal('navigator', { ...navigator, onLine: true, serviceWorker: undefined });
    expect(await checkWebUpdate()).toBe('none');
    stubSW(undefined);
    expect(await checkWebUpdate()).toBe('none');
  });

  it('reports a new worker found by registration.update()', async () => {
    const reg: { installing: unknown; waiting: unknown; update: () => Promise<void> } = {
      installing: null,
      waiting: null,
      update: vi.fn(async () => {
        reg.installing = {};
      }),
    };
    stubSW(reg);
    expect(await checkWebUpdate()).toBe('available');
    expect(reg.update).toHaveBeenCalled();
  });

  it('is up to date when update() finds nothing', async () => {
    stubSW({ installing: null, waiting: null, update: vi.fn(async () => {}) });
    expect(await checkWebUpdate()).toBe('none');
  });

  it('is an error when update() rejects (offline)', async () => {
    stubSW({ installing: null, waiting: null, update: vi.fn(() => Promise.reject(new TypeError('fetch'))) });
    expect(await checkWebUpdate()).toBe('error');
  });
});
