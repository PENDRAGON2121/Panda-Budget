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
