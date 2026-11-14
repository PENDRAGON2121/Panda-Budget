import type { Project, Expense, Installment, Payment } from '../db/types';

const sum = (payments: Payment[]): number => payments.reduce((s, p) => s + p.amount, 0);

/** Percentage of `part` over `whole`; 0 when `whole` is not positive (avoids NaN/Infinity). Not clamped. */
function pctOf(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

export function expenseProgress(
  expense: Expense,
  payments: Payment[],
): { paid: number; remaining: number; pct: number; over: boolean } {
  const paid = sum(payments.filter((p) => p.expenseId === expense.id));
  return {
    paid,
    remaining: expense.plannedAmount - paid,
    pct: pctOf(paid, expense.plannedAmount),
    over: paid > expense.plannedAmount,
  };
}

export function installmentStatus(
  inst: Installment,
  payments: Payment[],
  siblings: Installment[],
): 'pagada' | 'proxima' | 'pendiente' {
  const isPaid = (i: Installment): boolean =>
    sum(payments.filter((p) => p.installmentId === i.id)) >= i.plannedAmount;

  if (isPaid(inst)) return 'pagada';
  const next = [...siblings]
    .filter((s) => !isPaid(s))
    .sort((a, b) => a.index - b.index)[0];
  return next && next.id === inst.id ? 'proxima' : 'pendiente';
}

export function projectSummary(
  project: Project,
  expenses: Expense[],
  payments: Payment[],
): {
  paid: number;
  available: number;
  pct: number;
  overAllocated: boolean;
  distribution: { expenseId: string; amount: number; pct: number }[];
} {
  const ids = new Set(expenses.map((e) => e.id));
  const paid = sum(payments.filter((p) => ids.has(p.expenseId)));
  const planned = expenses.reduce((s, e) => s + e.plannedAmount, 0);
  return {
    paid,
    available: project.totalBudget - paid,
    pct: pctOf(paid, project.totalBudget),
    overAllocated: planned > project.totalBudget,
    distribution: expenses.map((e) => ({
      expenseId: e.id,
      amount: e.plannedAmount,
      pct: pctOf(e.plannedAmount, project.totalBudget),
    })),
  };
}
