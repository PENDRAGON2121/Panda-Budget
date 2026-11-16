import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

export function useProjects() {
  return useLiveQuery(() => db.projects.orderBy('createdAt').reverse().toArray(), []);
}

export function useProject(id: string | undefined) {
  /** undefined = still loading; null = resolved, not found. */
  return useLiveQuery(async () => (id ? ((await db.projects.get(id)) ?? null) : null), [id]);
}

export function useExpense(id: string | undefined) {
  /** undefined = still loading; null = resolved, not found. */
  return useLiveQuery(async () => (id ? ((await db.expenses.get(id)) ?? null) : null), [id]);
}

export function useExpenses(projectId: string | undefined) {
  return useLiveQuery(
    () => (projectId ? db.expenses.where('projectId').equals(projectId).toArray() : []),
    [projectId],
  );
}

export function usePayments(expenseId: string | undefined) {
  return useLiveQuery(
    () => (expenseId ? db.payments.where('expenseId').equals(expenseId).sortBy('date') : []),
    [expenseId],
  );
}

export function useInstallments(expenseId: string | undefined) {
  return useLiveQuery(
    () => (expenseId ? db.installments.where('expenseId').equals(expenseId).sortBy('index') : []),
    [expenseId],
  );
}

/** Payments with date in [startMs, endMs). */
export function usePaymentsBetween(startMs: number, endMs: number) {
  return useLiveQuery(
    () => db.payments.where('date').between(startMs, endMs, true, false).toArray(),
    [startMs, endMs],
  );
}

export function useAllExpenses() {
  return useLiveQuery(() => db.expenses.toArray(), []);
}

export function useAllPayments() {
  return useLiveQuery(() => db.payments.toArray(), []);
}

export function useReceipt(id: string | undefined) {
  /** undefined = loading; null = none/not found. */
  return useLiveQuery(async () => (id ? ((await db.receipts.get(id)) ?? null) : null), [id]);
}

/**
 * Currency code of a project. undefined = still loading (gate money text on it so a USD project never
 * flashes ₡); 'CRC' once resolved when the project is unknown.
 */
export function useProjectCurrency(projectId: string | undefined): string | undefined {
  return useLiveQuery(
    async () => (projectId ? (await db.projects.get(projectId))?.currency : undefined) ?? 'CRC',
    [projectId],
  );
}

/** Currency code of the project owning an expense. undefined = still loading; 'CRC' when unknown. */
export function useExpenseCurrency(expenseId: string | undefined): string | undefined {
  return useLiveQuery(async () => {
    const e = expenseId ? await db.expenses.get(expenseId) : undefined;
    return (e ? (await db.projects.get(e.projectId))?.currency : undefined) ?? 'CRC';
  }, [expenseId]);
}

/** All installments of every expense of a project. */
export function useProjectInstallments(projectId: string | undefined) {
  return useLiveQuery(async () => {
    if (!projectId) return [];
    const ids = (await db.expenses.where('projectId').equals(projectId).primaryKeys()) as string[];
    return db.installments.where('expenseId').anyOf(ids).toArray();
  }, [projectId]);
}
