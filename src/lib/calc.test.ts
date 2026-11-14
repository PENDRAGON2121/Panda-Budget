import { describe, it, expect } from 'vitest';
import { expenseProgress, installmentStatus, projectSummary } from './calc';
import type { Project, Expense, Installment, Payment } from '../db/types';

const exp = (id: string, planned: number): Expense => ({
  id, projectId: 'p', name: id, type: 'single', plannedAmount: planned, createdAt: 0,
});
let seq = 0;
const pay = (expenseId: string, amount: number, installmentId?: string): Payment => ({
  id: `pay-${seq++}`,
  expenseId, installmentId, amount, date: 0, createdAt: 0,
});
const inst = (id: string, expenseId: string, index: number, planned: number): Installment => ({
  id, expenseId, index, plannedAmount: planned,
});
const proj = (total: number): Project => ({
  id: 'p', name: 'P', currency: 'CRC', totalBudget: total, createdAt: 0,
});

describe('expenseProgress', () => {
  const e = exp('e1', 1000);
  it('paid < planned', () => {
    expect(expenseProgress(e, [pay('e1', 400)])).toEqual({ paid: 400, remaining: 600, pct: 40, over: false });
  });
  it('paid = planned', () => {
    expect(expenseProgress(e, [pay('e1', 600), pay('e1', 400)])).toEqual({ paid: 1000, remaining: 0, pct: 100, over: false });
  });
  it('paid > planned', () => {
    const r = expenseProgress(e, [pay('e1', 1500)]);
    expect(r.over).toBe(true);
    expect(r.remaining).toBe(-500);
    expect(r.paid).toBe(1500);
    expect(r.pct).toBe(150);
  });
  it('ignores other expenses payments', () => {
    expect(expenseProgress(e, [pay('other', 999)]).paid).toBe(0);
  });
  it('no payments', () => {
    expect(expenseProgress(e, [])).toEqual({ paid: 0, remaining: 1000, pct: 0, over: false });
  });
  it('planned 0 -> no NaN', () => {
    const z = exp('z', 0);
    expect(expenseProgress(z, [])).toEqual({ paid: 0, remaining: 0, pct: 0, over: false });
    const r = expenseProgress(z, [pay('z', 50)]);
    expect(Number.isFinite(r.pct)).toBe(true);
    expect(r.over).toBe(true);
    expect(r.remaining).toBe(-50);
  });
});

describe('installmentStatus', () => {
  const sibs = [inst('i1', 'e', 1, 100), inst('i2', 'e', 2, 100), inst('i3', 'e', 3, 100)];
  it('paid / next / pending', () => {
    const pays = [pay('e', 100, 'i1')];
    expect(installmentStatus(sibs[0], pays, sibs)).toBe('pagada');
    expect(installmentStatus(sibs[1], pays, sibs)).toBe('proxima');
    expect(installmentStatus(sibs[2], pays, sibs)).toBe('pendiente');
  });
  it('none paid: first is proxima', () => {
    expect(installmentStatus(sibs[0], [], sibs)).toBe('proxima');
    expect(installmentStatus(sibs[1], [], sibs)).toBe('pendiente');
  });
  it('partial payment is not pagada', () => {
    const pays = [pay('e', 60, 'i1')];
    expect(installmentStatus(sibs[0], pays, sibs)).toBe('proxima');
  });
  it('multiple partials summing to planned are pagada', () => {
    const pays = [pay('e', 60, 'i1'), pay('e', 40, 'i1')];
    expect(installmentStatus(sibs[0], pays, sibs)).toBe('pagada');
    expect(installmentStatus(sibs[1], pays, sibs)).toBe('proxima');
  });
  it('over-payment on one cuota stays pagada and does not pay others', () => {
    const pays = [pay('e', 250, 'i1')];
    expect(installmentStatus(sibs[0], pays, sibs)).toBe('pagada');
    expect(installmentStatus(sibs[1], pays, sibs)).toBe('proxima');
    expect(installmentStatus(sibs[2], pays, sibs)).toBe('pendiente');
  });
  it('earliest unpaid by index even if siblings unordered / gap paid', () => {
    const shuffled = [sibs[2], sibs[0], sibs[1]];
    const pays = [pay('e', 100, 'i1'), pay('e', 100, 'i3')];
    expect(installmentStatus(sibs[1], pays, shuffled)).toBe('proxima');
    expect(installmentStatus(sibs[2], pays, shuffled)).toBe('pagada');
  });
  it('all paid -> all pagada', () => {
    const pays = sibs.map((s) => pay('e', 100, s.id));
    sibs.forEach((s) => expect(installmentStatus(s, pays, sibs)).toBe('pagada'));
  });
});

describe('projectSummary', () => {
  it('normal case', () => {
    const exps = [exp('a', 600), exp('b', 400)];
    const r = projectSummary(proj(1000), exps, [pay('a', 300), pay('b', 100)]);
    expect(r.paid).toBe(400);
    expect(r.available).toBe(600);
    expect(r.pct).toBe(40);
    expect(r.overAllocated).toBe(false);
    expect(r.distribution).toEqual([
      { expenseId: 'a', amount: 600, pct: 60 },
      { expenseId: 'b', amount: 400, pct: 40 },
    ]);
  });
  it('sum planned == total is not over-allocated', () => {
    expect(projectSummary(proj(1000), [exp('a', 1000)], []).overAllocated).toBe(false);
  });
  it('sum planned > total -> overAllocated, available negative when overspent', () => {
    const exps = [exp('a', 800), exp('b', 700)];
    const r = projectSummary(proj(1000), exps, [pay('a', 800), pay('b', 700)]);
    expect(r.overAllocated).toBe(true);
    expect(r.paid).toBe(1500);
    expect(r.available).toBe(-500);
    expect(r.pct).toBe(150);
    expect(r.distribution[0].pct).toBe(80);
    expect(r.distribution[1].pct).toBe(70);
  });
  it('over-allocated but not yet paid: available positive', () => {
    const r = projectSummary(proj(1000), [exp('a', 1500)], [pay('a', 100)]);
    expect(r.overAllocated).toBe(true);
    expect(r.available).toBe(900);
  });
  it('ignores payments of expenses not in the project', () => {
    const r = projectSummary(proj(1000), [exp('a', 500)], [pay('a', 100), pay('zzz', 999)]);
    expect(r.paid).toBe(100);
  });
  it('totalBudget 0 -> no NaN/Infinity', () => {
    const r = projectSummary(proj(0), [exp('a', 100)], [pay('a', 50)]);
    expect(Number.isFinite(r.pct)).toBe(true);
    expect(Number.isFinite(r.distribution[0].pct)).toBe(true);
    expect(r.overAllocated).toBe(true);
    expect(r.available).toBe(-50);
  });
  it('empty project', () => {
    expect(projectSummary(proj(1000), [], [])).toEqual({
      paid: 0, available: 1000, pct: 0, overAllocated: false, distribution: [],
    });
  });
});
