import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import {
  createProject,
  updateProject,
  deleteProject,
  createExpense,
  addPayment,
  deletePayment,
  deleteExpense,
} from './repos';

const blob = () => new Blob(['x'], { type: 'image/png' });

async function seedProject(name = 'Casa') {
  return createProject({ name, currency: 'CRC', totalBudget: 1000 });
}

describe('repos', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });

  it('createProject assigns id/createdAt; updateProject patches', async () => {
    const p = await seedProject();
    expect(p.id).toBeTruthy();
    expect(await db.projects.get(p.id)).toMatchObject({ name: 'Casa' });
    await updateProject(p.id, { name: 'Casa 2', totalBudget: 5 });
    expect(await db.projects.get(p.id)).toMatchObject({ name: 'Casa 2', totalBudget: 5, currency: 'CRC' });
  });

  it('createExpense with 3 installments persists 3 linked rows', async () => {
    const p = await seedProject();
    const e = await createExpense(
      { projectId: p.id, name: 'Cocina', type: 'installments', plannedAmount: 300 },
      [
        { index: 1, plannedAmount: 100 },
        { index: 2, plannedAmount: 100 },
        { index: 3, plannedAmount: 100 },
      ],
    );
    const rows = await db.installments.where('expenseId').equals(e.id).toArray();
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.index).sort()).toEqual([1, 2, 3]);
    expect(new Set(rows.map((r) => r.id)).size).toBe(3);
  });

  it('createExpense of type single ignores installments', async () => {
    const p = await seedProject();
    const e = await createExpense(
      { projectId: p.id, name: 'X', type: 'single', plannedAmount: 10 },
      [{ index: 1, plannedAmount: 10 }],
    );
    expect(await db.installments.where('expenseId').equals(e.id).count()).toBe(0);
  });

  it('addPayment with receipt stores a receipts row and links it', async () => {
    const p = await seedProject();
    const e = await createExpense({ projectId: p.id, name: 'X', type: 'single', plannedAmount: 10 });
    const pay = await addPayment({ expenseId: e.id, amount: 10, date: 1 }, { blob: blob(), mime: 'image/png' });
    expect(pay.receiptId).toBeTruthy();
    const r = await db.receipts.get(pay.receiptId!);
    expect(r?.mime).toBe('image/png');
    expect((await db.payments.get(pay.id))?.receiptId).toBe(pay.receiptId);
  });

  it('addPayment without receipt leaves receiptId undefined', async () => {
    const p = await seedProject();
    const e = await createExpense({ projectId: p.id, name: 'X', type: 'single', plannedAmount: 10 });
    const pay = await addPayment({ expenseId: e.id, amount: 10, date: 1 });
    expect(pay.receiptId).toBeUndefined();
    expect(await db.receipts.count()).toBe(0);
  });

  it('deletePayment frees its receipt, keeps shared receipts', async () => {
    const p = await seedProject();
    const e = await createExpense({ projectId: p.id, name: 'X', type: 'single', plannedAmount: 10 });
    const pay = await addPayment({ expenseId: e.id, amount: 1, date: 1 }, { blob: blob(), mime: 'image/png' });
    await deletePayment(pay.id);
    expect(await db.payments.count()).toBe(0);
    expect(await db.receipts.count()).toBe(0);

    // shared receipt stays while another payment references it
    const a = await addPayment({ expenseId: e.id, amount: 1, date: 1 }, { blob: blob(), mime: 'image/png' });
    await db.payments.add({ id: 'b', expenseId: e.id, amount: 1, date: 1, createdAt: 1, receiptId: a.receiptId });
    await deletePayment(a.id);
    expect(await db.receipts.count()).toBe(1);
    await deletePayment('b');
    expect(await db.receipts.count()).toBe(0);
  });

  it('deleteProject cascades with no orphans and spares other projects', async () => {
    const p = await seedProject('A');
    const q = await seedProject('B');
    const e = await createExpense(
      { projectId: p.id, name: 'E', type: 'installments', plannedAmount: 200 },
      [{ index: 1, plannedAmount: 100 }, { index: 2, plannedAmount: 100 }],
    );
    await addPayment({ expenseId: e.id, amount: 1, date: 1 }, { blob: blob(), mime: 'image/png' });
    await addPayment({ expenseId: e.id, amount: 1, date: 2 });
    const e2 = await createExpense({ projectId: q.id, name: 'Keep', type: 'single', plannedAmount: 5 });
    await addPayment({ expenseId: e2.id, amount: 1, date: 3 }, { blob: blob(), mime: 'image/png' });

    await deleteProject(p.id);

    expect(await db.projects.get(p.id)).toBeUndefined();
    expect(await db.expenses.where('projectId').equals(p.id).count()).toBe(0);
    expect(await db.installments.where('expenseId').equals(e.id).count()).toBe(0);
    expect(await db.payments.where('expenseId').equals(e.id).count()).toBe(0);
    // only the other project's data remains
    expect(await db.projects.count()).toBe(1);
    expect(await db.expenses.count()).toBe(1);
    expect(await db.payments.count()).toBe(1);
    expect(await db.receipts.count()).toBe(1);
  });
  it('deleteExpense cascades installments, payments and unshared receipts; keeps shared receipts and siblings', async () => {
    const p = await seedProject();
    const e = await createExpense(
      { projectId: p.id, name: 'E', type: 'installments', plannedAmount: 200 },
      [{ index: 1, plannedAmount: 100 }, { index: 2, plannedAmount: 100 }],
    );
    const other = await createExpense({ projectId: p.id, name: 'Other', type: 'single', plannedAmount: 50 });
    const insts = await db.installments.where('expenseId').equals(e.id).toArray();
    // own receipt (only used by e's payment)
    const own = await addPayment({ expenseId: e.id, installmentId: insts[0].id, amount: 100, date: 1 }, { blob: blob(), mime: 'image/png' });
    // shared receipt: referenced by e's payment and by a payment of the other expense
    const shared = await addPayment({ expenseId: other.id, amount: 10, date: 2 }, { blob: blob(), mime: 'image/png' });
    await db.payments.add({ id: 'dup', expenseId: e.id, amount: 5, date: 3, createdAt: 3, receiptId: shared.receiptId });

    await deleteExpense(e.id);

    expect(await db.expenses.get(e.id)).toBeUndefined();
    expect(await db.installments.where('expenseId').equals(e.id).count()).toBe(0);
    expect(await db.payments.where('expenseId').equals(e.id).count()).toBe(0);
    expect(await db.receipts.get(own.receiptId!)).toBeUndefined();
    expect(await db.receipts.get(shared.receiptId!)).toBeDefined();
    expect(await db.expenses.get(other.id)).toBeDefined();
    expect(await db.payments.get(shared.id)).toBeDefined();
    expect(await db.projects.get(p.id)).toBeDefined();
  });
});
