import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  expect(screen.getByTestId('pagado')).not.toHaveClass('text-danger-ink');
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
  expect(pagado).toHaveClass('text-danger-ink');
  expect(screen.getByTestId('restante')).toHaveClass('text-danger-ink');
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

test('FAB and per-cuota Pagar open the payment sheet, the latter pre-selecting its cuota', async () => {
  const { e } = await seedInstallments();
  renderAt(e.id);
  const user = userEvent.setup();

  await user.click(await screen.findByRole('button', { name: 'Registrar pago' }));
  expect(await screen.findByRole('heading', { name: /registrar pago/i })).toBeInTheDocument();
  // no cuota given: defaults to the next (proxima) cuota
  await waitFor(() => expect(screen.getByRole('button', { name: /aplicar a/i })).toHaveTextContent(/cuota 1/i));
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('heading', { name: /registrar pago/i })).not.toBeInTheDocument());

  await user.click(screen.getByRole('button', { name: /pagar cuota 2/i }));
  expect(await screen.findByRole('heading', { name: /registrar pago/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /aplicar a/i })).toHaveTextContent(/cuota 2/i);
});

function renderWithProjectRoute(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/gastos/${id}`]}>
      <Routes>
        <Route path="/gastos/:id" element={<ExpenseDetail />} />
        <Route path="/proyectos/:id" element={<p>Pantalla de proyecto</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('deletion', () => {
  test('Eliminar gasto asks for confirmation, cascades and navigates back to its project', async () => {
    const { e, insts } = await seedInstallments();
    await addPayment({ expenseId: e.id, installmentId: insts[0].id, amount: 1000000, date: Date.now() });
    const user = userEvent.setup();
    renderWithProjectRoute(e.id);
    await screen.findByTestId('planeado');
    expect(screen.queryByRole('button', { name: 'Eliminar gasto' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Más opciones del gasto' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar gasto' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(/¿Eliminar el gasto «Constructora»\?/);
    expect(dialog).toHaveTextContent(/Esta acción no se puede deshacer/);
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByText('Pantalla de proyecto')).toBeInTheDocument();
    expect(await db.expenses.count()).toBe(0);
    expect(await db.installments.count()).toBe(0);
    expect(await db.payments.count()).toBe(0);
  });

  test('cancelling the confirmation keeps the gasto', async () => {
    const { e } = await seedInstallments();
    const user = userEvent.setup();
    renderWithProjectRoute(e.id);
    await user.click(await screen.findByRole('button', { name: 'Más opciones del gasto' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar gasto' }));
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await db.expenses.count()).toBe(1);
    expect(screen.getByText('Constructora')).toBeInTheDocument();
  });

  test('a paid cuota row can delete its payment after confirmation', async () => {
    const { e, insts } = await seedInstallments();
    await addPayment({ expenseId: e.id, installmentId: insts[0].id, amount: 1000000, date: Date.now() });
    const user = userEvent.setup();
    renderAt(e.id);
    await user.click(await screen.findByRole('button', { name: 'Eliminar pago de cuota 1' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent(/¿Eliminar este pago\?/);
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(async () => expect(await db.payments.count()).toBe(0));
    await waitFor(() => expect(screen.getAllByTestId('cuota')[0]).toHaveAttribute('data-status', 'proxima'));
  });

  test('a single gasto lists its payments (date, amount) and can delete one', async () => {
    const p = await createProject({ name: 'Casa', currency: 'CRC', totalBudget: 1000000 });
    const e = await createExpense({ projectId: p.id, name: 'Nevera', type: 'single', plannedAmount: 500000 });
    await addPayment({ expenseId: e.id, amount: 200000, date: new Date(2026, 4, 15).getTime() });
    await addPayment({ expenseId: e.id, amount: 100000, date: new Date(2026, 4, 20).getTime() });
    const user = userEvent.setup();
    renderAt(e.id);
    const list = await screen.findByRole('list', { name: 'Pagos' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent(formatCRC(200000));
    expect(rows[0]).toHaveTextContent(/15 may/i);
    await user.click(within(rows[0]).getByRole('button', { name: /eliminar pago/i }));
    await user.click(await screen.findByRole('button', { name: 'Eliminar' }));
    await waitFor(async () => expect(await db.payments.count()).toBe(1));
    expect((await db.payments.toArray())[0].amount).toBe(100000);
    await waitFor(() => expect(within(screen.getByRole('list', { name: 'Pagos' })).getAllByRole('listitem')).toHaveLength(1));
  });
});

test('a USD gasto never flashes ₡ while its currency loads', async () => {
  const p = await createProject({ name: 'Viaje', currency: 'USD', totalBudget: 5000 });
  const e = await createExpense({ projectId: p.id, name: 'Vuelos', type: 'single', plannedAmount: 900 });
  await addPayment({ expenseId: e.id, amount: 300, date: Date.now() });
  let sawColon = false;
  const mo = new MutationObserver(() => {
    if (document.body.textContent?.includes('₡')) sawColon = true;
  });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  renderAt(e.id);
  expect(await screen.findByTestId('planeado')).toHaveTextContent('$900');
  mo.disconnect();
  expect(sawColon).toBe(false);
});
