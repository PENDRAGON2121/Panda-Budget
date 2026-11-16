import { db } from './db';
import type { Project, Expense, Installment, Payment } from './types';

const uid = () => crypto.randomUUID();

export type NewProject = Omit<Project, 'id' | 'createdAt'>;
export type NewExpense = Omit<Expense, 'id' | 'createdAt'>;
export type NewInstallment = Omit<Installment, 'id' | 'expenseId'>;
export type NewPayment = Omit<Payment, 'id' | 'createdAt' | 'receiptId'>;

export async function createProject(data: NewProject): Promise<Project> {
  const project: Project = { ...data, id: uid(), createdAt: Date.now() };
  await db.projects.add(project);
  return project;
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.projects.update(id, patch);
}

/** Removes a receipt only if no remaining payment references it. Must run inside a transaction. */
async function freeReceiptIfUnreferenced(receiptId: string | undefined): Promise<void> {
  if (!receiptId) return;
  const refs = await db.payments.filter((p) => p.receiptId === receiptId).count();
  if (refs === 0) await db.receipts.delete(receiptId);
}

export async function deleteProject(id: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.projects, db.expenses, db.installments, db.payments, db.receipts],
    async () => {
      const expenseIds = (await db.expenses.where('projectId').equals(id).primaryKeys()) as string[];
      const payments = await db.payments.where('expenseId').anyOf(expenseIds).toArray();
      const receiptIds = [...new Set(payments.map((p) => p.receiptId).filter((r): r is string => !!r))];

      await db.payments.where('expenseId').anyOf(expenseIds).delete();
      await db.installments.where('expenseId').anyOf(expenseIds).delete();
      await db.expenses.where('projectId').equals(id).delete();
      await db.projects.delete(id);

      // receipts owned only by the deleted payments (skip any still referenced elsewhere)
      for (const rid of receiptIds) await freeReceiptIfUnreferenced(rid);
    },
  );
}

export async function createExpense(
  data: NewExpense,
  installments: NewInstallment[] = [],
): Promise<Expense> {
  const expense: Expense = { ...data, id: uid(), createdAt: Date.now() };
  await db.transaction('rw', [db.expenses, db.installments], async () => {
    await db.expenses.add(expense);
    if (expense.type === 'installments' && installments.length > 0) {
      await db.installments.bulkAdd(
        installments.map((i) => ({ ...i, id: uid(), expenseId: expense.id })),
      );
    }
  });
  return expense;
}

export async function addPayment(
  data: NewPayment,
  receipt?: { blob: Blob; mime: string },
): Promise<Payment> {
  const payment: Payment = { ...data, id: uid(), createdAt: Date.now() };
  await db.transaction('rw', [db.payments, db.receipts], async () => {
    if (receipt) {
      const receiptId = uid();
      await db.receipts.add({ id: receiptId, blob: receipt.blob, mime: receipt.mime });
      payment.receiptId = receiptId;
    }
    await db.payments.add(payment);
  });
  return payment;
}

export async function deletePayment(id: string): Promise<void> {
  await db.transaction('rw', [db.payments, db.receipts], async () => {
    const payment = await db.payments.get(id);
    if (!payment) return;
    await db.payments.delete(id);
    await freeReceiptIfUnreferenced(payment.receiptId);
  });
}

export async function deleteExpense(id: string): Promise<void> {
  await db.transaction('rw', [db.expenses, db.installments, db.payments, db.receipts], async () => {
    const payments = await db.payments.where('expenseId').equals(id).toArray();
    const receiptIds = [...new Set(payments.map((p) => p.receiptId).filter((r): r is string => !!r))];

    await db.payments.where('expenseId').equals(id).delete();
    await db.installments.where('expenseId').equals(id).delete();
    await db.expenses.delete(id);

    for (const rid of receiptIds) await freeReceiptIfUnreferenced(rid);
  });
}
