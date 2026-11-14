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

test('over-spend portion uses danger segment', async () => {
  const { p } = await seed([700000, 500000]);
  renderAt(p.id);
  await screen.findByRole('link', { name: /Gasto 2/ });
  expect(screen.getByTestId('segment-over')).toBeInTheDocument();
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
