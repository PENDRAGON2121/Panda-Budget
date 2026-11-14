import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach } from 'vitest';
import { db } from '../../db/db';
import { createProject } from '../../db/repos';
import { formatCRC } from '../../lib/money';
import { ProjectsScreen } from './ProjectsScreen';
import { ProjectForm } from './ProjectForm';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

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
  await user.type(input, 'a'.repeat(75));
  expect(input.value).toHaveLength(60);
  expect(input.value).toBe('a'.repeat(60));
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
