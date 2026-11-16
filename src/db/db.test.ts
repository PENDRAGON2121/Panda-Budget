import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import type { Project, Payment } from './types';

describe('db', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });

  it('round-trips a project by id', async () => {
    const p: Project = {
      id: crypto.randomUUID(),
      name: 'Casa',
      icon: '🏠',
      currency: 'CRC',
      totalBudget: 1000000,
      note: 'nota',
      createdAt: Date.now(),
    };
    await db.projects.add(p);
    expect(await db.projects.get(p.id)).toEqual(p);
  });

  it('queries payments by the date index', async () => {
    const mk = (date: number): Payment => ({
      id: crypto.randomUUID(),
      expenseId: 'e1',
      amount: 100,
      date,
      createdAt: 0,
    });
    await db.payments.bulkAdd([mk(10), mk(20), mk(30)]);
    const r = await db.payments.where('date').between(15, 35, true, true).toArray();
    expect(r.map((x) => x.date).sort()).toEqual([20, 30]);
  });
});
