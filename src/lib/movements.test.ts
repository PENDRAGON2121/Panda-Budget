import type { Expense, Installment, Payment, Project } from '../db/types';
import { projectMovements } from './movements';

const project: Project = { id: 'p1', name: 'Casa', currency: 'CRC', totalBudget: 1000, createdAt: 1 };
const exp = (id: string, name: string, projectId = 'p1'): Expense => ({
  id, projectId, name, type: 'single', plannedAmount: 500, createdAt: 1,
});
const pay = (id: string, expenseId: string, amount: number, date: number, createdAt = date, extra: Partial<Payment> = {}): Payment => ({
  id, expenseId, amount, date, createdAt, ...extra,
});

test('only the initial entrada when there are no payments', () => {
  const m = projectMovements(project, [], [], []);
  expect(m).toEqual([
    { id: 'budget-p1', kind: 'entrada', date: 1, label: 'Presupuesto inicial', amount: 1000, balance: 1000 },
  ]);
});

test('salidas in date order with running balance', () => {
  const m = projectMovements(project, [exp('e1', 'Luz'), exp('e2', 'Agua')], [], [
    pay('b', 'e2', 300, 20), pay('a', 'e1', 100, 10),
  ]);
  expect(m.map((x) => [x.kind, x.label, x.amount, x.balance])).toEqual([
    ['entrada', 'Presupuesto inicial', 1000, 1000],
    ['salida', 'Luz', 100, 900],
    ['salida', 'Agua', 300, 600],
  ]);
  expect(m[1].expenseId).toBe('e1');
});

test('ties on date broken by createdAt', () => {
  const m = projectMovements(project, [exp('e1', 'Luz')], [], [pay('late', 'e1', 50, 10, 99), pay('early', 'e1', 70, 10, 5)]);
  expect(m.slice(1).map((x) => x.id)).toEqual(['early', 'late']);
});

test('cuota detail and receiptId', () => {
  const inst: Installment = { id: 'i3', expenseId: 'e1', index: 3, plannedAmount: 100 };
  const m = projectMovements(project, [exp('e1', 'Moto')], [inst], [pay('x', 'e1', 100, 10, 10, { installmentId: 'i3', receiptId: 'r1' })]);
  expect(m[1].detail).toBe('Cuota 3');
  expect(m[1].receiptId).toBe('r1');
});

test('installment label is used when present', () => {
  const inst: Installment = { id: 'i1', expenseId: 'e1', index: 1, label: 'Prima', plannedAmount: 100 };
  const m = projectMovements(project, [exp('e1', 'Moto')], [inst], [pay('x', 'e1', 100, 10, 10, { installmentId: 'i1' })]);
  expect(m[1].detail).toBe('Prima');
});

test('balance goes negative on over-spend', () => {
  const m = projectMovements(project, [exp('e1', 'Luz')], [], [pay('a', 'e1', 1500, 10)]);
  expect(m[1].balance).toBe(-500);
});

test('payments of other projects are excluded', () => {
  const m = projectMovements(project, [exp('e1', 'Luz'), exp('e9', 'Otro', 'p2')], [], [pay('a', 'e1', 100, 10), pay('b', 'e9', 999, 11)]);
  expect(m).toHaveLength(2);
});
