/**
 * In-app update check (Android/APK channel). This is the app's ONLY network call: an unauthenticated GET to the
 * public GitHub "latest release" endpoint. No user data is sent. Every failure resolves to a value; nothing throws.
 */
export const RELEASES_URL = 'https://api.github.com/repos/PENDRAGON2121/Panda-Budget/releases/latest';
const TIMEOUT_MS = 5000;

export interface UpdateInfo {
  /** Release version without the leading "v" (e.g. "0.0.2"). */
  version: string;
  /** Release notes (GitHub release body, Markdown as plain text). */
  notes: string;
  /** Direct download URL of the release's .apk asset. */
  apkUrl: string;
  /** Release page on GitHub. */
  htmlUrl: string;
}

export type UpdateCheck = { status: 'available'; update: UpdateInfo } | { status: 'none' } | { status: 'error' };

const stripV = (v: string) => v.trim().replace(/^v/i, '');

/**
 * Compares dotted numeric versions (a leading "v" and any pre-release suffix are ignored). Returns -1, 0 or 1.
 * Pre-release suffixes are dropped on purpose, so "1.2.3-beta" equals "1.2.3". That is safe here because GitHub's
 * /releases/latest never returns pre-releases (or drafts), so we never compare against one.
 */
export function compareSemver(a: string, b: string): number {
  const parts = (v: string) =>
    stripV(v)
      .split(/[-+]/)[0]
      .split('.')
      .map((n) => Number.parseInt(n, 10) || 0);
  const pa = parts(a);
  const pb = parts(b);
  for (let i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

const ALLOWED_HOSTS = new Set(['github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com']);

/** True only for https URLs on GitHub's own hosts (the APK is handed to the system browser, so be strict). */
function isTrustedUrl(u: unknown): u is string {
  if (typeof u !== 'string') return false;
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

interface GitHubAsset {
  name?: unknown;
  browser_download_url?: unknown;
}

/** Like checkForUpdate, but tells "up to date" apart from "could not check" (offline, timeout, rate limit). */
export async function checkForUpdateDetailed(current: string): Promise<UpdateCheck> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(RELEASES_URL, {
      method: 'GET',
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    if (res.status === 404) return { status: 'none' }; // no release published yet
    if (!res.ok) return { status: 'error' };
    const data = (await res.json()) as { tag_name?: unknown; body?: unknown; html_url?: unknown; assets?: unknown };
    if (typeof data.tag_name !== 'string' || !data.tag_name.trim()) return { status: 'error' };
    const version = stripV(data.tag_name);
    if (compareSemver(version, current) <= 0) return { status: 'none' };
    const assets = Array.isArray(data.assets) ? (data.assets as GitHubAsset[]) : [];
    const apk = assets.find(
      (a) => typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk') && isTrustedUrl(a.browser_download_url),
    );
    if (!apk) return { status: 'none' }; // nothing installable (or its URL is not a trusted GitHub https URL)
    return {
      status: 'available',
      update: {
        version,
        notes: typeof data.body === 'string' ? data.body.trim() : '',
        apkUrl: apk.browser_download_url as string,
        htmlUrl: isTrustedUrl(data.html_url) ? data.html_url : '',
      },
    };
  } catch {
    return { status: 'error' };
  } finally {
    clearTimeout(timer);
  }
}

/** The newer release with an .apk asset, or null (same/older version, no asset, offline, any error). Never throws. */
export async function checkForUpdate(current: string): Promise<UpdateInfo | null> {
  const r = await checkForUpdateDetailed(current);
  return r.status === 'available' ? r.update : null;
}
