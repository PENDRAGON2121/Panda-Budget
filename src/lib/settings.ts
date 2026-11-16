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
let memoryName = ''; // only used if localStorage is unavailable
const listeners = new Set<() => void>();

/** Trim and cap to MAX_NAME_LENGTH. */
export function normalizeName(raw: string): string {
  return raw.trim().slice(0, MAX_NAME_LENGTH).trim();
}

export function getUserName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return memoryName;
  }
}

/** Stores the normalized name; returns false (and stores nothing) when it is empty. */
export function setUserName(raw: string): boolean {
  const name = normalizeName(raw);
  if (!name) return false;
  memoryName = name;
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* storage unavailable: name lasts for the session only */
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
