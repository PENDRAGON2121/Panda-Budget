import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach } from 'vitest';
import { db } from '../../db/db';
import { createExpense, createProject, deleteProject } from '../../db/repos';
import type { Project } from '../../db/types';
import { HomeScreen } from './HomeScreen';
import { buildLoopSlides, SLIDE_BASIS_PCT } from './ProjectCarousel';

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

test('greeting header shows the logo, greeting and the page heading', async () => {
  await seed();
  renderHome();
  expect(await screen.findByRole('heading', { level: 1, name: 'Bienvenido' })).toBeInTheDocument();
  expect(screen.getByText('¡Hola! 👋')).toBeInTheDocument();
  expect(screen.getByAltText('Panda Wallet')).toBeInTheDocument();
});

test('empty-state + button opens the new-project form', async () => {
  const user = userEvent.setup();
  renderHome();
  await user.click(await screen.findByRole('button', { name: 'Nuevo proyecto' }));
  expect(await screen.findByRole('heading', { name: 'Nuevo proyecto' })).toBeInTheDocument();
});

test('deleting the active last project clamps the carousel to a valid project', async () => {
  const a = await createProject({ name: 'Proyecto A', currency: 'CRC', totalBudget: 1000000 });
  await new Promise((r) => setTimeout(r, 5));
  const b = await createProject({ name: 'Proyecto B', currency: 'CRC', totalBudget: 1000000 });
  await new Promise((r) => setTimeout(r, 5));
  await createProject({ name: 'Proyecto C', currency: 'CRC', totalBudget: 1000000 });
  await createExpense({ projectId: b.id, name: 'Gasto de B', type: 'single', plannedAmount: 1000 });
  const user = userEvent.setup();
  renderHome();
  // newest-first: C(0), B(1), A(2); select A (last index) then delete it
  await user.click(await screen.findByRole('tab', { name: 'Ir a Proyecto A' }));
  await waitFor(() => expect(screen.getByRole('tab', { name: 'Ir a Proyecto A' })).toHaveAttribute('aria-selected', 'true'));
  await deleteProject(a.id);
  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(2));
  await waitFor(() =>
    expect(screen.getAllByRole('tab').filter((t) => t.getAttribute('aria-selected') === 'true')).toHaveLength(1),
  );
  expect(screen.getByRole('tab', { name: 'Ir a Proyecto B' })).toHaveAttribute('aria-selected', 'true');
  expect(await screen.findByText('Gasto de B')).toBeInTheDocument();
});

describe('loop slides', () => {
  const mk = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }) as Project);

  test('with 2 projects embla can loop: enough slide content beyond the viewport', () => {
    const slides = buildLoopSlides(mk(2));
    // embla.canLoop: sum of all other slides >= viewport  =>  (n - 1) * basis >= 100%
    expect((slides.length - 1) * SLIDE_BASIS_PCT).toBeGreaterThanOrEqual(100);
    expect(slides.map((s) => s.realIndex)).toEqual([0, 1, 0, 1]);
    expect(slides.filter((s) => s.isClone)).toHaveLength(2);
  });

  test('3+ projects are not duplicated, 1 project is not duplicated', () => {
    expect(buildLoopSlides(mk(3))).toHaveLength(3);
    expect(buildLoopSlides(mk(1))).toHaveLength(1);
  });

  test('renders 4 slides for 2 projects but only 2 labelled/real cards and 2 dots', async () => {
    await seed();
    renderHome();
    await screen.findByLabelText('Proyecto Proyecto A');
    expect(screen.getAllByLabelText(/^Proyecto Proyecto/)).toHaveLength(2);
    expect(screen.getAllByTestId('carousel-slide')).toHaveLength(4);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });
});
