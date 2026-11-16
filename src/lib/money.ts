const SYMBOLS: Record<string, string> = { CRC: '₡', USD: '$' };

/** Symbol for a currency code; unknown codes fall back to ₡. */
export const currencySymbol = (currency: string): string => SYMBOLS[currency] ?? '₡';

/** Period-grouped integer with currency prefix: (38000000,'CRC') -> "₡38.000.000", (1500,'USD') -> "$1.500". */
export function formatMoney(n: number, currency: string): string {
  const value = Number.isFinite(n) ? Math.round(n) : 0;
  const sign = value < 0 ? '-' : '';
  const digits = String(Math.abs(value));
  return `${sign}${currencySymbol(currency)}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** Colón amount: 38000000 -> "₡38.000.000". */
export const formatCRC = (n: number): string => formatMoney(n, 'CRC');

/**
 * Parse user input to a non-negative whole amount. A trailing `.` or `,` followed by exactly 1–2 digits is a
 * decimal part (rounded to the nearest unit); any other separator groups thousands. Signs, symbols and spaces
 * are ignored. Non-numeric -> 0.
 *   '12.50' -> 13 · '12,4' -> 12 · '1.250' -> 1250 · '₡1.200.000' -> 1200000 · '-500' -> 500
 */
export function parseAmount(input: string): number {
  const clean = (input ?? '').replace(/[^\d.,]/g, '');
  const m = /^(.*)[.,](\d{1,2})$/.exec(clean);
  const intDigits = (m ? m[1] : clean).replace(/\D/g, '');
  const fraction = m ? Number(`0.${m[2]}`) : 0;
  if (!intDigits && !m) return 0;
  const n = Math.round((intDigits ? parseInt(intDigits, 10) : 0) + fraction);
  return Number.isFinite(n) ? n : 0;
}
