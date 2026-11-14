import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach } from 'vitest';
import { db } from '../../db/db';
import { addPayment, createExpense, createProject } from '../../db/repos';
import { formatCRC } from '../../lib/money';
import { ExpenseDetail } from './ExpenseDetail';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/gastos/${id}`]}>
      <Routes>
        <Route path="/gastos/:id" element={<ExpenseDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function seedInstallments() {
  const p = await createProject({ name: 'Casa', currency: 'CRC', totalBudget: 10000000 });
  const e = await createExpense(
    { projectId: p.id, name: 'Constructora', type: 'installments', plannedAmount: 3000000 },
    [1, 2, 3].map((i) => ({ index: i, plannedAmount: 1000000 })),
  );
  const insts = await db.installments.where('expenseId').equals(e.id).sortBy('index');
  return { p, e, insts };
}

test('shows planeado, pagado and restante', async () => {
  const { e, insts } = await seedInstallments();
  await addPayment({ expenseId: e.id, installmentId: insts[0].id, amount: 1000000, date: Date.now() });
  renderAt(e.id);
  expect(await screen.findByText('Constructora')).toBeInTheDocument();
  expect(await screen.findByTestId('planeado')).toHaveTextContent(formatCRC(3000000));
  expect(await screen.findByTestId('pagado')).toHaveTextContent(formatCRC(1000000));
  expect(screen.getByTestId('restante')).toHaveTextContent(formatCRC(2000000));
  expect(screen.getByTestId('pagado')).not.toHaveClass('text-danger');
});

test('marks the earliest unpaid cuota as proxima and the paid one as pagada', async () => {
  const { e, insts } = await seedInstallments();
  await addPayment({ expenseId: e.id, installmentId: insts[0].id, amount: 1000000, date: Date.now() });
  renderAt(e.id);
  const items = await screen.findAllByTestId('cuota');
  expect(items).toHaveLength(3);
  expect(items[0]).toHaveAttribute('data-status', 'pagada');
  expect(items[1]).toHaveAttribute('data-status', 'proxima');
  expect(items[2]).toHaveAttribute('data-status', 'pendiente');
});

test('flags over-spend in red when paid exceeds planned', async () => {
  const { e, insts } = await seedInstallments();
  await addPayment({ expenseId: e.id, installmentId: insts[0].id, amount: 3500000, date: Date.now() });
  renderAt(e.id);
  const pagado = await screen.findByTestId('pagado');
  await screen.findByTestId('restante');
  expect(pagado).toHaveTextContent(formatCRC(3500000));
  expect(pagado).toHaveClass('text-danger');
  expect(screen.getByTestId('restante')).toHaveClass('text-danger');
});

test('single expense has no timeline', async () => {
  const p = await createProject({ name: 'Casa', currency: 'CRC', totalBudget: 1000 });
  const e = await createExpense({ projectId: p.id, name: 'Nevera', type: 'single', plannedAmount: 500 });
  renderAt(e.id);
  expect(await screen.findByText('Nevera')).toBeInTheDocument();
  expect(screen.queryByTestId('cuota')).toBeNull();
});

test('unknown id shows not-found with back link', async () => {
  renderAt('nope');
  expect(await screen.findByText('Gasto no encontrado')).toBeInTheDocument();
});

test('FAB and per-cuota Pagar open the payment sheet', async () => {
  const { e } = await seedInstallments();
  renderAt(e.id);
  const user = (await import('@testing-library/user-event')).default.setup();
  await user.click(await screen.findByRole('button', { name: /pagar cuota 2/i }));
  expect(await screen.findByRole('heading', { name: /registrar pago/i })).toBeInTheDocument();
});
