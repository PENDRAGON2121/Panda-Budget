export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

export const WEEKDAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local-time YYYY-MM-DD for a date. */
export function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local-time YYYY-MM-DD for a ms timestamp. */
export function isoOf(ms: number): string {
  return isoFromDate(new Date(ms));
}

/** Local midnight ms for a YYYY-MM-DD string. */
export function msOfIso(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Monday-first grid of full weeks for a month (month is 0-based), with leading/trailing filler days. */
export function monthGrid(year: number, month: number): { iso: string; inMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // Mon=0 .. Sun=6
  const days = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((lead + days) / 7) * 7;
  const out: { iso: string; inMonth: boolean }[] = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(year, month, 1 - lead + i);
    out.push({ iso: isoFromDate(d), inMonth: d.getMonth() === month });
  }
  return out;
}
