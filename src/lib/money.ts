/** Format a colón amount with period-grouped thousands: 38000000 -> "₡38.000.000". */
export function formatCRC(n: number): string {
  const value = Number.isFinite(n) ? Math.round(n) : 0;
  const sign = value < 0 ? '-' : '';
  const digits = String(Math.abs(value));
  return `${sign}₡${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** Parse user input to a non-negative integer by keeping digits only. Non-numeric -> 0. */
export function parseAmount(input: string): number {
  const digits = (input ?? '').replace(/\D/g, '');
  if (!digits) return 0;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : 0;
}
