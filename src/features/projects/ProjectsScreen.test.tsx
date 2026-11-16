import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { db } from '../../db/db';
import { addPayment, createExpense, createProject } from '../../db/repos';
import { formatCRC } from '../../lib/money';
import { ProjectsScreen } from './ProjectsScreen';
import { ProjectForm } from './ProjectForm';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});
afterEach(() => vi.restoreAllMocks());

test('shows a seeded project name and formatted total', async () => {
  await createProject({ name: 'Casa nueva', currency: 'CRC', totalBudget: 38000000 });
  render(<MemoryRouter><ProjectsScreen /></MemoryRouter>);
  expect(await screen.findByText('Casa nueva')).toBeInTheDocument();
  expect(screen.getByText(formatCRC(38000000))).toBeInTheDocument();
  expect(screen.getByText(/Nuevo proyecto/)).toBeInTheDocument();
});

test('shows the empty state when there are no projects', async () => {
  render(<MemoryRouter><ProjectsScreen /></MemoryRouter>);
  expect(await screen.findByText('Agregá un proyecto')).toBeInTheDocument();
});

test('form blocks names over 60 chars and accepts exactly 60', async () => {
  const user = userEvent.setup();
  render(<ProjectForm isOpen onOpenChange={() => {}} />);
  const input = screen.getByLabelText(/nombre/i) as HTMLInputElement;
  await user.type(screen.getByLabelText(/presupuesto/i), '1000');
  await user.type(input, 'a'.repeat(75));
  expect(input.value).toHaveLength(60);
  expect(input.value).toBe('a'.repeat(60));
  // exactly 60 enables submit
  expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeEnabled();
  // further input is blocked, stays at 60 and still valid
  await user.type(input, 'b');
  expect(input.value).toBe('a'.repeat(60));
  expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeEnabled();
});

test('submit is disabled for an empty name', () => {
  render(<ProjectForm isOpen onOpenChange={() => {}} />);
  expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeDisabled();
});

test('creating a project persists it', async () => {
  const user = userEvent.setup();
  render(<ProjectForm isOpen onOpenChange={() => {}} />);
  await user.type(screen.getByLabelText(/nombre/i), 'Viaje');
  await user.type(screen.getByLabelText(/presupuesto/i), '500000');
  await user.click(screen.getByRole('button', { name: /crear/i }));
  await waitFor(async () => expect(await db.projects.count()).toBe(1));
  const p = (await db.projects.toArray())[0];
  expect(p.name).toBe('Viaje');
  expect(p.totalBudget).toBe(500000);
});

test('a USD project renders $ amounts, not ₡', async () => {
  await createProject({ name: 'Viaje', currency: 'USD', totalBudget: 1500 });
  render(<MemoryRouter><ProjectsScreen /></MemoryRouter>);
  expect(await screen.findByText('Viaje')).toBeInTheDocument();
  expect(screen.getByText('$1.500')).toBeInTheDocument();
  expect(screen.queryByText('₡1.500')).not.toBeInTheDocument();
});

test('new project is created in the profile default currency (USD)', async () => {
  localStorage.setItem('panda-wallet:default-currency', 'USD');
  try {
    const user = userEvent.setup();
    render(<ProjectForm isOpen onOpenChange={() => {}} />);
    await user.type(screen.getByLabelText(/nombre/i), 'Viaje USD');
    await user.type(screen.getByLabelText(/presupuesto/i), '1500');
    await user.click(screen.getByRole('button', { name: /crear proyecto/i }));
    await waitFor(async () => {
      const all = await db.projects.toArray();
      expect(all).toHaveLength(1);
      expect(all[0].currency).toBe('USD');
    });
  } finally {
    localStorage.clear();
  }
});

test('total budget must be > 0: submit disabled with a hint until a positive budget is entered', async () => {
  const user = userEvent.setup();
  render(<ProjectForm isOpen onOpenChange={() => {}} />);
  await user.type(screen.getByLabelText(/nombre/i), 'Viaje');
  expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeDisabled();
  expect(screen.getByText('Ingresá un presupuesto mayor a 0')).toBeInTheDocument();
  await user.type(screen.getByLabelText(/presupuesto/i), '0');
  expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeDisabled();
  await user.clear(screen.getByLabelText(/presupuesto/i));
  await user.type(screen.getByLabelText(/presupuesto/i), '500000');
  expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeEnabled();
  expect(screen.queryByText('Ingresá un presupuesto mayor a 0')).not.toBeInTheDocument();
});

test('a rejected write shows an inline error and keeps the dialog open', async () => {
  vi.spyOn(db.projects, 'add').mockRejectedValueOnce(new Error('QuotaExceededError'));
  const onOpenChange = vi.fn();
  const user = userEvent.setup();
  render(<ProjectForm isOpen onOpenChange={onOpenChange} />);
  await user.type(screen.getByLabelText(/nombre/i), 'Viaje');
  await user.type(screen.getByLabelText(/presupuesto/i), '500000');
  await user.click(screen.getByRole('button', { name: /crear proyecto/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo guardar/i);
  expect(onOpenChange).not.toHaveBeenCalledWith(false);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /crear proyecto/i })).toBeEnabled();
});

test('double submit creates exactly one project', async () => {
  const user = userEvent.setup();
  render(<ProjectForm isOpen onOpenChange={() => {}} />);
  await user.type(screen.getByLabelText(/nombre/i), 'Viaje');
  await user.type(screen.getByLabelText(/presupuesto/i), '500000');
  const form = screen.getByRole('button', { name: /crear proyecto/i }).closest('form')!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(async () => expect(await db.projects.count()).toBe(1));
  await new Promise((r) => setTimeout(r, 50));
  expect(await db.projects.count()).toBe(1);
});

test('over-budget project card: progress fill and percentage use danger', async () => {
  const p = await createProject({ name: 'Casa', currency: 'CRC', totalBudget: 1000 });
  const e = await createExpense({ projectId: p.id, name: 'X', type: 'single', plannedAmount: 1000 });
  await addPayment({ expenseId: e.id, amount: 1500, date: Date.now() });
  render(<MemoryRouter><ProjectsScreen /></MemoryRouter>);
  await screen.findByText('Casa');
  expect(await screen.findByTestId('project-progress-fill')).toHaveClass('bg-danger');
  expect(screen.getByTestId('project-pct')).toHaveClass('text-danger');
  expect(screen.getByTestId('project-pct')).toHaveTextContent('150%');
});

test('within-budget project card keeps the leaf fill', async () => {
  const p = await createProject({ name: 'Casa', currency: 'CRC', totalBudget: 1000 });
  const e = await createExpense({ projectId: p.id, name: 'X', type: 'single', plannedAmount: 1000 });
  await addPayment({ expenseId: e.id, amount: 500, date: Date.now() });
  render(<MemoryRouter><ProjectsScreen /></MemoryRouter>);
  await screen.findByText('Casa');
  expect(await screen.findByTestId('project-progress-fill')).toHaveClass('bg-leaf');
  expect(screen.getByTestId('project-pct')).not.toHaveClass('text-danger');
});
