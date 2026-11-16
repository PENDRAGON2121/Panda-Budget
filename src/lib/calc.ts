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

export interface DistributionSegment {
  expenseId: string;
  /** Amount PAID for this gasto. */
  amount: number;
  /** Share of the bar (paid over max(totalBudget, total paid)). */
  pct: number;
  /** Paid more than planned for this gasto. */
  over: boolean;
}

/**
 * Project totals. `distribution` answers "en qué se fue la plata": each gasto's PAID amount over the total
 * budget, plus the free share (`freePct`, = max(0, total − paid), i.e. the Disponible number when not
 * overspent). If paid exceeds the total the bar is scaled by paid and `overflowPct` is the overspent share.
 * Over-allocation (planned > total) is a separate flag (`overAllocated`), not part of the bar.
 */
export function projectSummary(
  project: Project,
  expenses: Expense[],
  payments: Payment[],
): {
  paid: number;
  available: number;
  pct: number;
  overAllocated: boolean;
  distribution: DistributionSegment[];
  freePct: number;
  overflowPct: number;
} {
  const ids = new Set(expenses.map((e) => e.id));
  const mine = payments.filter((p) => ids.has(p.expenseId));
  const paid = sum(mine);
  const planned = expenses.reduce((s, e) => s + e.plannedAmount, 0);
  const denom = Math.max(project.totalBudget, paid);
  return {
    paid,
    available: project.totalBudget - paid,
    pct: pctOf(paid, project.totalBudget),
    overAllocated: planned > project.totalBudget,
    distribution: expenses.map((e) => {
      const amount = sum(mine.filter((p) => p.expenseId === e.id));
      return { expenseId: e.id, amount, pct: pctOf(amount, denom), over: amount > e.plannedAmount };
    }),
    freePct: pctOf(Math.max(0, project.totalBudget - paid), denom),
    overflowPct: pctOf(Math.max(0, paid - project.totalBudget), denom),
  };
}
