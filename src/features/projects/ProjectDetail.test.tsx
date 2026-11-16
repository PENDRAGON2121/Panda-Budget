import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach } from 'vitest';
import { db } from '../../db/db';
import { addPayment, createExpense, createProject } from '../../db/repos';
import { formatCRC } from '../../lib/money';
import { ProjectDetail } from './ProjectDetail';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

const segmentOf = (name: string) =>
  within(screen.getByRole('img', { name: /distribución/i }))
    .getAllByTestId('segment-expense')
    .find((el) => el.dataset.expense === name)!;

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/proyectos/${id}`]}>
      <Routes>
        <Route path="/proyectos/:id" element={<ProjectDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function seed(planned: number[], total = 1000000) {
  const p = await createProject({ name: 'Casa nueva', currency: 'CRC', totalBudget: total });
  const exps = [];
  for (const [i, amt] of planned.entries()) {
    exps.push(await createExpense({ projectId: p.id, name: `Gasto ${i + 1}`, type: 'single', plannedAmount: amt }));
  }
  return { p, exps };
}

test('renders pagado and disponible from projectSummary', async () => {
  const { p, exps } = await seed([400000, 300000]);
  await addPayment({ expenseId: exps[0].id, amount: 250000, date: Date.now() });
  renderAt(p.id);
  expect(await screen.findByText('Casa nueva')).toBeInTheDocument();
  expect(screen.getByTestId('pagado')).toHaveTextContent(formatCRC(250000));
  expect(screen.getByTestId('disponible')).toHaveTextContent(formatCRC(750000));
  expect(screen.getByText(/25% ejecutado/)).toBeInTheDocument();
});

test('shows over-allocation flag when planned exceeds total', async () => {
  const { p } = await seed([700000, 500000]);
  renderAt(p.id);
  expect(await screen.findByText(/sobreasignado/i)).toBeInTheDocument();
});

test('no over-allocation flag when within budget', async () => {
  const { p } = await seed([400000]);
  renderAt(p.id);
  await screen.findByRole('link', { name: /Gasto 1/ });
  expect(screen.queryByText(/sobreasignado/i)).not.toBeInTheDocument();
});

test('distribution bar has one segment per expense plus disponible', async () => {
  const { p } = await seed([400000, 300000, 100000]);
  renderAt(p.id);
  await screen.findByRole('link', { name: /Gasto 3/ });
  const bar = screen.getByRole('img', { name: /distribución/i });
  expect(within(bar).getAllByTestId('segment-expense')).toHaveLength(3);
  expect(within(bar).getAllByTestId('segment-disponible')).toHaveLength(1);
});

test('distribution segments are sized by PAID over the total; disponible matches the summary', async () => {
  const { p, exps } = await seed([400000, 300000]);
  await addPayment({ expenseId: exps[0].id, amount: 250000, date: Date.now() });
  renderAt(p.id);
  await screen.findByRole('link', { name: /Gasto 2/ });
  const bar = screen.getByRole('img', { name: /distribución/i });
  expect(segmentOf('Gasto 1')).toHaveStyle({ width: '25%' });
  expect(segmentOf('Gasto 2')).toHaveStyle({ width: '0%' });
  expect(within(bar).getByTestId('segment-disponible')).toHaveStyle({ width: '75%' });
  expect(screen.getByTestId('disponible')).toHaveTextContent(formatCRC(750000));
  expect(within(bar).queryByTestId('segment-over')).not.toBeInTheDocument();
});

test('a gasto paid over its plan is coloured danger in the distribution', async () => {
  const { p, exps } = await seed([100000, 300000]);
  await addPayment({ expenseId: exps[0].id, amount: 150000, date: Date.now() });
  renderAt(p.id);
  await screen.findByRole('link', { name: /Gasto 2/ });
  expect(segmentOf('Gasto 1')).toHaveClass('bg-danger');
  expect(segmentOf('Gasto 1')).toHaveStyle({ width: '15%' });
  expect(segmentOf('Gasto 2')).not.toHaveClass('bg-danger');
});

test('when paid exceeds the total the bar scales by paid and shows the overflow', async () => {
  const { p, exps } = await seed([1000000, 500000]);
  await addPayment({ expenseId: exps[0].id, amount: 1000000, date: Date.now() });
  await addPayment({ expenseId: exps[1].id, amount: 250000, date: Date.now() });
  renderAt(p.id);
  await screen.findByRole('link', { name: /Gasto 2/ });
  const bar = screen.getByRole('img', { name: /distribución/i });
  expect(segmentOf('Gasto 1')).toHaveStyle({ width: '80%' });
  expect(segmentOf('Gasto 2')).toHaveStyle({ width: '20%' });
  expect(within(bar).getByTestId('segment-disponible')).toHaveStyle({ width: '0%' });
  expect(within(bar).getByTestId('segment-over')).toHaveStyle({ width: '20%' });
  expect(screen.getByText('Sobregiro')).toBeInTheDocument();
});

test('over-allocation (planned > total) is the separate banner, not a bar segment', async () => {
  const { p } = await seed([700000, 500000]);
  renderAt(p.id);
  await screen.findByRole('link', { name: /Gasto 2/ });
  expect(screen.getByRole('status')).toHaveTextContent(/sobreasignado/i);
  expect(screen.queryByTestId('segment-over')).not.toBeInTheDocument();
  expect(screen.queryByText('Excedido')).not.toBeInTheDocument();
});

test('gastos rows link to /gastos/:id', async () => {
  const { p, exps } = await seed([400000]);
  renderAt(p.id);
  const link = await screen.findByRole('link', { name: /Gasto 1/ });
  expect(link).toHaveAttribute('href', `/gastos/${exps[0].id}`);
});

test('empty state when there are no expenses', async () => {
  const { p } = await seed([]);
  renderAt(p.id);
  expect(await screen.findByText(/agregá tu primer gasto/i)).toBeInTheDocument();
});

test('layoutId container renders before data resolves', () => {
  renderAt('does-not-matter-yet');
  expect(screen.getByTestId('detail-container')).toBeInTheDocument();
});

test('non-existent id shows not-found state with back link', async () => {
  renderAt('nope');
  expect(await screen.findByText('Proyecto no encontrado')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /volver a proyectos/i })).toHaveAttribute('href', '/proyectos');
  expect(screen.queryByTestId('detail-container')).not.toBeInTheDocument();
});

test('Agregar gasto FAB opens the expense form', async () => {
  const { p } = await seed([100000]);
  renderAt(p.id);
  await screen.findByText('Casa nueva');
  await userEvent.setup().click(screen.getByRole('button', { name: /agregar gasto/i }));
  expect(await screen.findByText('Nuevo gasto')).toBeInTheDocument();
});

test('Eliminar proyecto confirms, cascades and navigates to /proyectos', async () => {
  const { p, exps } = await seed([400000]);
  await addPayment({ expenseId: exps[0].id, amount: 1000, date: Date.now() });
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[`/proyectos/${p.id}`]}>
      <Routes>
        <Route path="/proyectos/:id" element={<ProjectDetail />} />
        <Route path="/proyectos" element={<p>Lista de proyectos</p>} />
      </Routes>
    </MemoryRouter>,
  );
  await user.click(await screen.findByRole('button', { name: 'Más opciones del proyecto' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar proyecto' }));
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent(/¿Eliminar el proyecto «Casa nueva»\?/);
  expect(dialog).toHaveTextContent(/Esta acción no se puede deshacer/);
  await user.click(screen.getByRole('button', { name: 'Eliminar' }));
  expect(await screen.findByText('Lista de proyectos')).toBeInTheDocument();
  expect(await db.projects.count()).toBe(0);
  expect(await db.expenses.count()).toBe(0);
  expect(await db.payments.count()).toBe(0);
});

test('over-budget: the "% ejecutado" chip uses danger when pct > 100', async () => {
  const { p, exps } = await seed([400000], 100000);
  await addPayment({ expenseId: exps[0].id, amount: 150000, date: Date.now() });
  renderAt(p.id);
  const chip = await screen.findByText('150% ejecutado');
  expect(chip).toHaveClass('text-danger-ink');
});

test('within budget: the "% ejecutado" chip is not danger', async () => {
  const { p, exps } = await seed([400000], 1000000);
  await addPayment({ expenseId: exps[0].id, amount: 250000, date: Date.now() });
  renderAt(p.id);
  expect(await screen.findByText('25% ejecutado')).not.toHaveClass('text-danger-ink');
});
