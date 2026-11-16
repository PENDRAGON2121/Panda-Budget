import { afterEach, describe, expect, it, vi } from 'vitest';
import { RELEASES_URL, checkForUpdate, checkForUpdateDetailed, compareSemver } from './updates';

describe('compareSemver', () => {
  it.each([
    ['0.0.1', '0.0.1', 0],
    ['0.0.2', '0.0.1', 1],
    ['0.0.1', '0.0.2', -1],
    ['0.1.0', '0.0.9', 1],
    ['1.0.0', '0.99.99', 1],
    ['0.10.0', '0.9.0', 1],
    ['v1.2.3', '1.2.3', 0],
    ['1.2', '1.2.0', 0],
    ['1.2.3-beta', '1.2.3', 0],
  ])('compareSemver(%s, %s) = %i', (a, b, expected) => {
    expect(compareSemver(a, b)).toBe(expected);
  });
});

const apk = { name: 'panda-wallet-0.0.2.apk', browser_download_url: 'https://github.com/x/releases/download/v0.0.2/panda-wallet-0.0.2.apk' };
const release = (tag: string, assets: unknown[] = [apk]) => ({
  tag_name: tag,
  body: '- Algo nuevo',
  html_url: `https://github.com/x/releases/tag/${tag}`,
  assets,
});
const respond = (body: unknown, ok = true, status = 200) =>
  vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(body) });

describe('checkForUpdate', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the newer release with its .apk asset (leading "v" stripped)', async () => {
    const fetch = respond(release('v0.0.2', [{ name: 'notes.txt', browser_download_url: 'x' }, apk]));
    vi.stubGlobal('fetch', fetch);
    expect(await checkForUpdate('0.0.1')).toEqual({
      version: '0.0.2',
      notes: '- Algo nuevo',
      apkUrl: apk.browser_download_url,
      htmlUrl: 'https://github.com/x/releases/tag/v0.0.2',
    });
    expect(fetch).toHaveBeenCalledWith(RELEASES_URL, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    // No user data: plain unauthenticated GET
    const init = fetch.mock.calls[0][1] as RequestInit;
    expect(init.method ?? 'GET').toBe('GET');
    expect(init.body).toBeUndefined();
  });

  it('returns null when the release is the same version', async () => {
    vi.stubGlobal('fetch', respond(release('v0.0.1')));
    expect(await checkForUpdate('0.0.1')).toBeNull();
  });

  it('returns null when the release is older', async () => {
    vi.stubGlobal('fetch', respond(release('v0.0.1')));
    expect(await checkForUpdate('0.1.0')).toBeNull();
  });

  it('returns null when the release has no .apk asset', async () => {
    vi.stubGlobal('fetch', respond(release('v0.0.2', [{ name: 'source.zip', browser_download_url: 'x' }])));
    expect(await checkForUpdate('0.0.1')).toBeNull();
  });

  it('returns null on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(checkForUpdate('0.0.1')).resolves.toBeNull();
  });

  it('returns null on 404 (no releases yet)', async () => {
    vi.stubGlobal('fetch', respond({ message: 'Not Found' }, false, 404));
    expect(await checkForUpdate('0.0.1')).toBeNull();
  });

  it('returns null on malformed JSON', async () => {
    vi.stubGlobal('fetch', respond({ nope: true }));
    expect(await checkForUpdate('0.0.1')).toBeNull();
  });

  it('aborts after the timeout and returns null', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) =>
        new Promise((_res, rej) => init.signal!.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))),
      ),
    );
    const pending = checkForUpdate('0.0.1');
    await vi.advanceTimersByTimeAsync(6000);
    await expect(pending).resolves.toBeNull();
    vi.useRealTimers();
  });
});

describe('checkForUpdateDetailed', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('distinguishes available / none / error', async () => {
    vi.stubGlobal('fetch', respond(release('v0.0.2')));
    expect((await checkForUpdateDetailed('0.0.1')).status).toBe('available');
    vi.stubGlobal('fetch', respond(release('v0.0.1')));
    expect(await checkForUpdateDetailed('0.0.1')).toEqual({ status: 'none' });
    vi.stubGlobal('fetch', respond(release('v0.0.2', [])));
    expect(await checkForUpdateDetailed('0.0.1')).toEqual({ status: 'none' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await checkForUpdateDetailed('0.0.1')).toEqual({ status: 'error' });
    // 404 = no release published yet: nothing to install, not a connectivity problem
    vi.stubGlobal('fetch', respond({}, false, 404));
    expect(await checkForUpdateDetailed('0.0.1')).toEqual({ status: 'none' });
    vi.stubGlobal('fetch', respond({}, false, 403)); // e.g. rate limited
    expect(await checkForUpdateDetailed('0.0.1')).toEqual({ status: 'error' });
  });
});
