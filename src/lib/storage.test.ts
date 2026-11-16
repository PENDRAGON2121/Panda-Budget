import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

const stubStorage = (storage: unknown) => vi.stubGlobal('navigator', { ...navigator, storage });

describe('requestPersistence', () => {
  it('calls navigator.storage.persist() only once even if invoked repeatedly', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    stubStorage({ persist, persisted: vi.fn().mockResolvedValue(true) });
    const { requestPersistence } = await import('./storage');
    await Promise.all([requestPersistence(), requestPersistence()]);
    await requestPersistence();
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('is a safe no-op when the Storage API is missing', async () => {
    stubStorage(undefined);
    const { requestPersistence, isPersisted } = await import('./storage');
    await expect(requestPersistence()).resolves.toBe(false);
    await expect(isPersisted()).resolves.toBe(false);
  });

  it('swallows a rejecting persist()', async () => {
    stubStorage({ persist: vi.fn().mockRejectedValue(new Error('nope')) });
    const { requestPersistence } = await import('./storage');
    await expect(requestPersistence()).resolves.toBe(false);
  });
});
