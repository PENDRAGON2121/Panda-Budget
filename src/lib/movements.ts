import type { Expense, Installment, Payment, Project } from '../db/types';

export interface Movement {
  id: string;
  kind: 'entrada' | 'salida';
  date: number;
  label: string;
  detail?: string;
  amount: number;
  balance: number;
  receiptId?: string;
  expenseId?: string;
}

/**
 * Derived history of a project: the initial budget is the first entrada, every payment of the project's
 * expenses a salida. Oldest -> newest, with a running balance (may go negative). Never stored.
 */
export function projectMovements(
  project: Project,
  expenses: Expense[],
  installments: Installment[],
  payments: Payment[],
): Movement[] {
  const byExpense = new Map(expenses.filter((e) => e.projectId === project.id).map((e) => [e.id, e]));
  const byInstallment = new Map(installments.map((i) => [i.id, i]));

  const movements: Movement[] = [
    {
      id: `budget-${project.id}`,
      kind: 'entrada',
      date: project.createdAt,
      label: 'Presupuesto inicial',
      amount: project.totalBudget,
      balance: project.totalBudget,
    },
  ];

  let balance = project.totalBudget;
  const own = payments
    .filter((p) => byExpense.has(p.expenseId))
    .sort((a, b) => a.date - b.date || a.createdAt - b.createdAt);
  for (const p of own) {
    balance -= p.amount;
    const inst = p.installmentId ? byInstallment.get(p.installmentId) : undefined;
    const m: Movement = {
      id: p.id,
      kind: 'salida',
      date: p.date,
      label: byExpense.get(p.expenseId)!.name,
      amount: p.amount,
      balance,
      expenseId: p.expenseId,
    };
    if (inst) m.detail = inst.label ?? `Cuota ${inst.index}`;
    if (p.receiptId) m.receiptId = p.receiptId;
    movements.push(m);
  }
  return movements;
}
