import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach } from 'vitest';
import { db } from '../../db/db';
import { createExpense, createProject } from '../../db/repos';
import { HomeScreen } from './HomeScreen';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

async function seed() {
  // projects list is newest-first: B is index 0, A is index 1
  const a = await createProject({ name: 'Proyecto A', currency: 'CRC', totalBudget: 1000000 });
  await new Promise((r) => setTimeout(r, 5));
  const b = await createProject({ name: 'Proyecto B', currency: 'CRC', totalBudget: 2000000 });
  await createExpense({ projectId: a.id, name: 'Gasto de A', type: 'single', plannedAmount: 100000 });
  await createExpense({ projectId: b.id, name: 'Gasto de B', type: 'single', plannedAmount: 200000 });
}

const renderHome = () => render(<MemoryRouter><HomeScreen /></MemoryRouter>);

test('renders both projects in the carousel', async () => {
  await seed();
  renderHome();
  expect(await screen.findByLabelText('Proyecto Proyecto A')).toBeInTheDocument();
  expect(screen.getByLabelText('Proyecto Proyecto B')).toBeInTheDocument();
  expect(screen.getAllByRole('tab')).toHaveLength(2);
});

test('gastos follow the active project and switch when it changes', async () => {
  await seed();
  const user = userEvent.setup();
  renderHome();
  expect(await screen.findByText('Gasto de B')).toBeInTheDocument();
  expect(screen.queryByText('Gasto de A')).not.toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: 'Ir a Proyecto A' }));
  expect(await screen.findByText('Gasto de A')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByText('Gasto de B')).not.toBeInTheDocument());
});

test('shows the empty state when there are no projects', async () => {
  renderHome();
  expect(await screen.findByText('Agregá un proyecto')).toBeInTheDocument();
  expect(screen.queryByTestId('carousel')).not.toBeInTheDocument();
});
