import { describe, it, expect } from 'vitest';
import { formatCRC, parseAmount } from './money';

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
});
