import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

export function useProjects() {
  return useLiveQuery(() => db.projects.orderBy('createdAt').reverse().toArray(), []);
}

export function useProject(id: string | undefined) {
  return useLiveQuery(() => (id ? db.projects.get(id) : undefined), [id]);
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
