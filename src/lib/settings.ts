export type Currency = 'CRC' | 'USD';
const KEY = 'panda-wallet:default-currency';

/** Preference kept in localStorage (tiny, synchronous); failures fall back to CRC. */
export function getDefaultCurrency(): Currency {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'USD' ? 'USD' : 'CRC';
  } catch {
    return 'CRC';
  }
}

export function setDefaultCurrency(c: Currency): void {
  try {
    localStorage.setItem(KEY, c);
  } catch {
    /* storage unavailable: preference lasts for the session only */
  }
}

/* ---- User name (first-launch welcome + Perfil) ---- */
export const MAX_NAME_LENGTH = 40;
const NAME_KEY = 'panda-wallet:user-name';
let memoryName = ''; // set only when a localStorage write failed (session-only fallback)
const listeners = new Set<() => void>();

/** Trim and cap to MAX_NAME_LENGTH. */
export function normalizeName(raw: string): string {
  return raw.trim().slice(0, MAX_NAME_LENGTH).trim();
}

export function getUserName(): string {
  try {
    // The in-memory value exists only when the latest write failed, so it is newer than anything stored.
    return memoryName || localStorage.getItem(NAME_KEY) || '';
  } catch {
    return memoryName;
  }
}

/** Stores the normalized name; returns false (and stores nothing) when it is empty. */
export function setUserName(raw: string): boolean {
  const name = normalizeName(raw);
  if (!name) return false;
  try {
    localStorage.setItem(NAME_KEY, name);
    memoryName = '';
  } catch {
    memoryName = name; // storage unavailable: name lasts for the session only
  }
  listeners.forEach((l) => l());
  return true;
}

export function subscribeUserName(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener('storage', cb); // other tabs
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

/* ---- Update check (native auto-check throttle) ---- */
const UPDATE_CHECK_KEY = 'panda-wallet:last-update-check';
const DAY_MS = 24 * 60 * 60 * 1000;
let memoryUpdateCheck = 0; // set only when a localStorage write failed

/** Epoch ms of the last completed update check (0 = never). */
export function getLastUpdateCheck(): number {
  if (memoryUpdateCheck) return memoryUpdateCheck; // set only when the latest write failed: newer than storage
  try {
    const raw = localStorage.getItem(UPDATE_CHECK_KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function setLastUpdateCheck(ts: number): void {
  try {
    localStorage.setItem(UPDATE_CHECK_KEY, String(ts));
    memoryUpdateCheck = 0;
  } catch {
    memoryUpdateCheck = ts; // storage unavailable: throttle lasts for the session only
  }
}

/** True when no update check completed in the last 24h (or the clock went backwards). */
export function shouldAutoCheckUpdates(now: number = Date.now()): boolean {
  const last = getLastUpdateCheck();
  return !last || now - last >= DAY_MS || now < last;
}
