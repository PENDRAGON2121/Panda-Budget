import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test } from 'vitest';
import { db } from '../../db/db';
import { createExpense, createProject } from '../../db/repos';
import { PaymentSheet } from './PaymentSheet';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

async function seed() {
  const p = await createProject({ name: 'Casa', currency: 'CRC', totalBudget: 10000000 });
  const e = await createExpense(
    { projectId: p.id, name: 'Constructora', type: 'installments', plannedAmount: 2000000 },
    [1, 2].map((i) => ({ index: i, plannedAmount: 1000000 })),
  );
  const insts = await db.installments.where('expenseId').equals(e.id).sortBy('index');
  return { e, insts };
}

function startOfToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

test('saves a payment with parsed amount, today, target cuota and no receipt', async () => {
  const { e, insts } = await seed();
  const user = userEvent.setup();
  render(<PaymentSheet expenseId={e.id} installmentId={insts[1].id} isOpen onOpenChange={() => {}} />);
  expect(await screen.findByText(/sin recibo/i)).toBeInTheDocument();
  await user.type(screen.getByLabelText(/monto/i), '₡1.250.000');
  await user.type(screen.getByLabelText(/nota/i), 'adelanto');
  await user.click(screen.getByRole('button', { name: /guardar pago/i }));
  await waitFor(async () => expect(await db.payments.count()).toBe(1));
  const [pay] = await db.payments.toArray();
  expect(pay.amount).toBe(1250000);
  expect(pay.expenseId).toBe(e.id);
  expect(pay.installmentId).toBe(insts[1].id);
  expect(pay.date).toBe(startOfToday());
  expect(pay.receiptId).toBeUndefined();
  expect(pay.note).toBe('adelanto');
  expect(await db.receipts.count()).toBe(0);
});

test('saves the chosen date', async () => {
  const { e } = await seed();
  const user = userEvent.setup();
  render(<PaymentSheet expenseId={e.id} isOpen onOpenChange={() => {}} />);
  await user.type(screen.getByLabelText(/monto/i), '5000');
  for (const [name, val] of [['month', '03'], ['day', '15'], ['year', '2026']] as const) {
    const seg = await screen.findByRole('spinbutton', { name: new RegExp(name, 'i') });
    await user.click(seg);
    await user.keyboard(val);
  }
  await user.click(screen.getByRole('button', { name: /guardar pago/i }));
  await waitFor(async () => expect(await db.payments.count()).toBe(1));
  const [pay] = await db.payments.toArray();
  expect(pay.date).toBe(new Date(2026, 2, 15).getTime());
  expect(pay.installmentId).toBeUndefined();
});

test('save is disabled until an amount is entered', async () => {
  const { e } = await seed();
  render(<PaymentSheet expenseId={e.id} isOpen onOpenChange={() => {}} />);
  expect(await screen.findByRole('button', { name: /guardar pago/i })).toBeDisabled();
});
