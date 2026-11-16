import { describe, it, expect } from 'vitest';
import { formatAmountInput, formatCRC, parseAmount, formatMoney } from './money';

describe('formatCRC', () => {
  it('formats zero', () => expect(formatCRC(0)).toBe('₡0'));
  it('formats small', () => expect(formatCRC(999)).toBe('₡999'));
  it('groups thousands with periods', () => expect(formatCRC(1000)).toBe('₡1.000'));
  it('formats millions', () => expect(formatCRC(38000000)).toBe('₡38.000.000'));
  it('formats 1.200.000', () => expect(formatCRC(1200000)).toBe('₡1.200.000'));
  it('formats negatives', () => expect(formatCRC(-1500)).toBe('-₡1.500'));
  it('never emits commas or currency code', () => {
    const s = formatCRC(1234567);
    expect(s).not.toMatch(/,|CRC/);
  });
});

describe('parseAmount', () => {
  it('parses formatted', () => expect(parseAmount('₡1.200.000')).toBe(1200000));
  it('parses plain digits', () => expect(parseAmount('5000')).toBe(5000));
  it('non-numeric -> 0', () => expect(parseAmount('abc')).toBe(0));
  it('empty -> 0', () => expect(parseAmount('')).toBe(0));
  it('strips spaces and commas', () => expect(parseAmount(' 1,200 ')).toBe(1200));
  it('never negative', () => expect(parseAmount('-500')).toBe(500));
  it('round-trips', () => expect(parseAmount(formatCRC(38000000))).toBe(38000000));
  it.each([
    ['12.50', 13],
    ['12,4', 12],
    ['12,49', 12],
    ['1.250', 1250],
    ['1.250.000', 1250000],
    ['₡1.200.000', 1200000],
    ['1.250.000,75', 1250001],
    ['$1,250.5', 1251],
    ['abc', 0],
    ['-500', 500],
  ])('decimals vs thousands: %s -> %d', (input, expected) => expect(parseAmount(input)).toBe(expected));
});

describe('formatMoney', () => {
  it('USD uses $ prefix and period grouping', () => expect(formatMoney(1500, 'USD')).toBe('$1.500'));
  it('CRC uses ₡ prefix', () => expect(formatMoney(38000000, 'CRC')).toBe('₡38.000.000'));
  it('unknown codes fall back to ₡', () => expect(formatMoney(2500, 'EUR')).toBe('₡2.500'));
  it('negative keeps sign before symbol', () => expect(formatMoney(-1500, 'USD')).toBe('-$1.500'));
  it('formatCRC delegates to CRC', () => expect(formatCRC(1500)).toBe(formatMoney(1500, 'CRC')));
});

describe('formatAmountInput', () => {
  it.each([
    ['', ''],
    ['5', '5'],
    ['1234', '1.234'],
    ['1250000', '1.250.000'],
    ['1.250.0001', '12.500.001'],
    ['₡ 2 000', '2.000'],
    ['00012', '12'],
    ['0', '0'],
    [1500000, '1.500.000'],
  ])('%s → %s', (raw, out) => {
    expect(formatAmountInput(raw)).toBe(out);
  });

  it('round-trips through parseAmount', () => {
    for (const n of [0, 7, 999, 1000, 25000, 1250000, 38000000]) {
      expect(parseAmount(formatAmountInput(n))).toBe(n);
    }
  });
});
