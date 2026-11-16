import { isoOf, monthGrid, MONTHS_ES } from './calendar';

test('monthGrid(2026, 4) is May 2026: Monday-first, 31 in-month days, filler to full weeks', () => {
  const g = monthGrid(2026, 4);
  // 1 May 2026 is a Friday -> 4 leading fillers (Mon..Thu)
  expect(g.slice(0, 4).map((c) => c.iso)).toEqual(['2026-04-27', '2026-04-28', '2026-04-29', '2026-04-30']);
  expect(g.slice(0, 4).every((c) => !c.inMonth)).toBe(true);
  expect(g[4]).toEqual({ iso: '2026-05-01', inMonth: true });
  expect(g.filter((c) => c.inMonth)).toHaveLength(31);
  expect(g.length % 7).toBe(0);
  expect(g[g.length - 1].iso).toBe('2026-05-31');
});

test('monthGrid handles a month starting on Monday without leading filler', () => {
  const g = monthGrid(2026, 5); // June 2026 starts Monday
  expect(g[0]).toEqual({ iso: '2026-06-01', inMonth: true });
});

test('isoOf uses local time and names are Spanish', () => {
  expect(isoOf(new Date(2026, 4, 5).getTime())).toBe('2026-05-05');
  expect(MONTHS_ES[0]).toBe('Enero');
  expect(MONTHS_ES[11]).toBe('Diciembre');
});
