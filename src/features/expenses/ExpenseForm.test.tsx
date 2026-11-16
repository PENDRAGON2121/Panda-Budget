import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, vi } from 'vitest';
import { db } from '../../db/db';
import { ExpenseForm } from './ExpenseForm';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(() => vi.restoreAllMocks());

test('creates a single expense', async () => {
  const user = userEvent.setup();
  render(<ExpenseForm projectId="p1" isOpen onOpenChange={() => {}} />);
  await user.type(screen.getByLabelText(/nombre/i), 'Nevera');
  await user.type(screen.getByLabelText(/monto planeado/i), '450000');
  await user.click(screen.getByRole('button', { name: /crear gasto/i }));
  await waitFor(async () => expect(await db.expenses.count()).toBe(1));
  const e = (await db.expenses.toArray())[0];
  expect(e).toMatchObject({ projectId: 'p1', name: 'Nevera', type: 'single', plannedAmount: 450000 });
  expect(await db.installments.count()).toBe(0);
});

test('installments expense with count 8 persists 8 cuotas with the given amounts', async () => {
  const user = userEvent.setup();
  render(<ExpenseForm projectId="p1" isOpen onOpenChange={() => {}} />);
  await user.type(screen.getByLabelText(/nombre/i), 'Constructora');
  await user.click(screen.getByRole('button', { name: /^cuotas$/i }));
  await user.type(screen.getByLabelText(/número de cuotas/i), '8');
  const amounts = [4000000, 3000000, 3000000, 2000000, 2000000, 2000000, 2000000, 1000000];
  for (const [i, a] of amounts.entries()) {
    await user.type(screen.getByLabelText(`Monto cuota ${i + 1}`), String(a));
  }
  await user.click(screen.getByRole('button', { name: /crear gasto/i }));
  await waitFor(async () => expect(await db.installments.count()).toBe(8));
  const e = (await db.expenses.toArray())[0];
  expect(e.type).toBe('installments');
  expect(e.plannedAmount).toBe(19000000);
  const insts = (await db.installments.where('expenseId').equals(e.id).sortBy('index'));
  expect(insts.map((i) => i.plannedAmount)).toEqual(amounts);
  expect(insts.map((i) => i.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
});

test('name is limited to 60 chars at input', async () => {
  const user = userEvent.setup();
  render(<ExpenseForm projectId="p1" isOpen onOpenChange={() => {}} />);
  const input = screen.getByLabelText(/nombre/i) as HTMLInputElement;
  await user.type(input, 'a'.repeat(75));
  expect(input.value).toBe('a'.repeat(60));
  await user.type(screen.getByLabelText(/monto planeado/i), '1000');
  expect(screen.getByRole('button', { name: /crear gasto/i })).toBeEnabled();
});

test('submit is disabled for empty name or zero amount', async () => {
  const user = userEvent.setup();
  render(<ExpenseForm projectId="p1" isOpen onOpenChange={() => {}} />);
  expect(screen.getByRole('button', { name: /crear gasto/i })).toBeDisabled();
  await user.type(screen.getByLabelText(/nombre/i), 'X');
  expect(screen.getByRole('button', { name: /crear gasto/i })).toBeDisabled();
});

test('a rejected write shows an inline error and keeps the dialog open', async () => {
  vi.spyOn(db.expenses, 'add').mockRejectedValueOnce(new Error('QuotaExceededError'));
  const onOpenChange = vi.fn();
  const user = userEvent.setup();
  render(<ExpenseForm projectId="p1" isOpen onOpenChange={onOpenChange} />);
  await user.type(screen.getByLabelText(/nombre/i), 'Nevera');
  await user.type(screen.getByLabelText(/monto planeado/i), '450000');
  await user.click(screen.getByRole('button', { name: /crear gasto/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo guardar/i);
  expect(onOpenChange).not.toHaveBeenCalledWith(false);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(await db.expenses.count()).toBe(0);
});

test('double submit creates exactly one gasto', async () => {
  const user = userEvent.setup();
  render(<ExpenseForm projectId="p1" isOpen onOpenChange={() => {}} />);
  await user.type(screen.getByLabelText(/nombre/i), 'Nevera');
  await user.type(screen.getByLabelText(/monto planeado/i), '450000');
  const form = screen.getByRole('button', { name: /crear gasto/i }).closest('form')!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(async () => expect(await db.expenses.count()).toBe(1));
  await new Promise((r) => setTimeout(r, 50));
  expect(await db.expenses.count()).toBe(1);
});

test('amount fields group thousands while typing and save whole units', async () => {
  const user = userEvent.setup();
  render(<ExpenseForm projectId="p1" isOpen onOpenChange={() => {}} />);
  await user.type(screen.getByLabelText(/nombre/i), 'Nevera');
  const amount = screen.getByLabelText(/monto planeado/i);
  await user.type(amount, '1250000');
  expect(amount).toHaveValue('1.250.000');
  await user.click(screen.getByRole('button', { name: /crear gasto/i }));
  await waitFor(async () => expect(await db.expenses.count()).toBe(1));
  expect((await db.expenses.toArray())[0].plannedAmount).toBe(1250000);
});
