import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach } from 'vitest';
import { db } from '../../db/db';
import { addPayment, createExpense, createProject, deletePayment } from '../../db/repos';
import { ProjectDetail } from './ProjectDetail';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${id}`]}>
      <Routes>
        <Route path="/proyectos/:id" element={<ProjectDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function seed(currency = 'CRC') {
  const p = await createProject({ name: 'Casa', currency, totalBudget: 1000 });
  const e = await createExpense({ projectId: p.id, name: 'Luz', type: 'single', plannedAmount: 500 });
  return { p, e };
}

async function openMovimientos() {
  await userEvent.click(await screen.findByRole('tab', { name: 'Movimientos' }));
  const panel = await screen.findByRole('tabpanel', { name: 'Movimientos' });
  await within(panel).findByText('Presupuesto inicial');
  return panel;
}

test('Gastos is the default tab and Movimientos is available', async () => {
  const { p } = await seed();
  renderAt(p.id);
  expect(await screen.findByRole('tab', { name: 'Gastos' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Movimientos' })).toHaveAttribute('aria-selected', 'false');
  expect(await screen.findByRole('link', { name: /Luz/ })).toBeInTheDocument();
});

test('switching tabs flips aria-selected and shows the right panel', async () => {
  const { p } = await seed();
  renderAt(p.id);
  const panel = await openMovimientos();
  expect(screen.getByRole('tab', { name: 'Movimientos' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Gastos' })).toHaveAttribute('aria-selected', 'false');
  expect(within(panel).getByText('Presupuesto inicial')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Gastos' }));
  expect(await screen.findByRole('tabpanel', { name: 'Gastos' })).toBeInTheDocument();
  await screen.findByRole('link', { name: /Luz/ });
  await waitFor(() => expect(screen.queryByText('Presupuesto inicial')).not.toBeInTheDocument());
});

test('arrow keys move between tabs', async () => {
  const { p } = await seed();
  renderAt(p.id);
  const gastos = await screen.findByRole('tab', { name: 'Gastos' });
  gastos.focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(screen.getByRole('tab', { name: 'Movimientos' })).toHaveAttribute('aria-selected', 'true');
  await userEvent.keyboard('{ArrowLeft}');
  expect(screen.getByRole('tab', { name: 'Gastos' })).toHaveAttribute('aria-selected', 'true');
});

test('lists newest first with signed amounts and running saldo', async () => {
  const { p, e } = await seed();
  await addPayment({ expenseId: e.id, amount: 300, date: 1000 });
  await addPayment({ expenseId: e.id, amount: 900, date: 2000 });
  renderAt(p.id);
  const panel = await openMovimientos();
  const rows = within(panel).getAllByRole('link');
  expect(rows).toHaveLength(2);
  expect(rows[0]).toHaveTextContent('−₡900');
  expect(rows[0]).toHaveTextContent('saldo -₡200');
  expect(rows[1]).toHaveTextContent('−₡300');
  expect(rows[1]).toHaveTextContent('saldo ₡700');
  expect(rows[0]).toHaveAttribute('href', `/gastos/${e.id}`);
  const entrada = within(panel).getByTestId('movement-entrada');
  expect(entrada).toHaveTextContent('+₡1.000');
  expect(entrada).toHaveTextContent('Presupuesto inicial');
  const all = within(panel).getAllByTestId(/^movement-/);
  expect(all[all.length - 1]).toBe(entrada);
});

test('uses the project currency', async () => {
  const { p, e } = await seed('USD');
  await addPayment({ expenseId: e.id, amount: 100, date: 5 });
  renderAt(p.id);
  const panel = await openMovimientos();
  expect(within(panel).getByText('+$1.000')).toBeInTheDocument();
  expect(within(panel).getByText('−$100')).toBeInTheDocument();
});

test('shows receipt thumb for payments with a receipt', async () => {
  const { p, e } = await seed();
  await addPayment({ expenseId: e.id, amount: 100, date: 5 }, { blob: new Blob(['x'], { type: 'image/png' }), mime: 'image/png' });
  URL.createObjectURL = () => 'blob:x';
  URL.revokeObjectURL = () => {};
  renderAt(p.id);
  const panel = await openMovimientos();
  expect(await within(panel).findByRole('button', { name: 'Ver recibo' })).toBeInTheDocument();
});

test('deleting a payment removes its movement', async () => {
  const { p, e } = await seed();
  const pay = await addPayment({ expenseId: e.id, amount: 300, date: 5 });
  renderAt(p.id);
  const panel = await openMovimientos();
  expect(within(panel).getAllByRole('link')).toHaveLength(1);
  await deletePayment(pay.id);
  await waitFor(() => expect(within(panel).queryAllByRole('link')).toHaveLength(0));
  expect(within(panel).getByText('Presupuesto inicial')).toBeInTheDocument();
});
