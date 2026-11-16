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

/** Parse user input to a non-negative integer by keeping digits only. Non-numeric -> 0. */
export function parseAmount(input: string): number {
  const digits = (input ?? '').replace(/\D/g, '');
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}
