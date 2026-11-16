import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach } from 'vitest';
import { db } from '../../db/db';
import { addPayment, createExpense, createProject } from '../../db/repos';
import { CalendarScreen } from './CalendarScreen';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

const may = (d: number) => new Date(2026, 4, d).getTime();

async function seed() {
  const p = await createProject({ name: 'Casa nueva', currency: 'CRC', totalBudget: 5000000 });
  const e = await createExpense({ projectId: p.id, name: 'Cocina', type: 'single', plannedAmount: 900000 });
  await addPayment({ expenseId: e.id, amount: 100000, date: may(15) });
  await addPayment({ expenseId: e.id, amount: 50000, date: may(15) });
  await addPayment({ expenseId: e.id, amount: 7000, date: may(20) });
}

const renderCal = () => render(<CalendarScreen initialDate={new Date(2026, 4, 15)} />);

test('shows month header and Monday-first weekday labels', async () => {
  renderCal();
  expect(await screen.findByText('Mayo 2026')).toBeInTheDocument();
  expect(screen.getAllByTestId('weekday').map((w) => w.textContent)).toEqual(['L', 'M', 'M', 'J', 'V', 'S', 'D']);
});

test('lists both payments of the selected day and totals them', async () => {
  await seed();
  renderCal();
  expect(await screen.findByText('Viernes 15 de mayo')).toBeInTheDocument();
  expect(await screen.findAllByText('Cocina')).toHaveLength(2);
  expect(screen.getAllByText('Casa nueva')).toHaveLength(2);
  expect(screen.getByText('₡150.000 · 2 pagos')).toBeInTheDocument();
});

test('marks days with payments with a dot', async () => {
  await seed();
  renderCal();
  await screen.findAllByText('Cocina');
  expect(within(screen.getByRole('button', { name: /^20 de mayo/ })).getByTestId('dot')).toBeInTheDocument();
  expect(within(screen.getByRole('button', { name: /^21 de mayo/ })).queryByTestId('dot')).toBeNull();
});

test('a day without payments shows the empty state; tapping a day switches records', async () => {
  await seed();
  const user = userEvent.setup();
  renderCal();
  await screen.findAllByText('Cocina');
  await user.click(screen.getByRole('button', { name: /^21 de mayo/ }));
  expect(await screen.findByText('Sin registros este día')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /^20 de mayo/ }));
  expect(await screen.findByText('₡7.000 · 1 pago')).toBeInTheDocument();
});

test('month navigation changes the header and selection', async () => {
  const user = userEvent.setup();
  renderCal();
  await user.click(await screen.findByRole('button', { name: 'Mes siguiente' }));
  expect(screen.getByText('Junio 2026')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Mes anterior' }));
  await user.click(screen.getByRole('button', { name: 'Mes anterior' }));
  expect(screen.getByText('Abril 2026')).toBeInTheDocument();
  expect(screen.getByText('Sin registros este día')).toBeInTheDocument();
});

test('mixed-currency day shows one total per currency, never mixed', async () => {
  const crc = await createProject({ name: 'Casa', currency: 'CRC', totalBudget: 5000000 });
  const usd = await createProject({ name: 'Viaje', currency: 'USD', totalBudget: 5000 });
  const e1 = await createExpense({ projectId: crc.id, name: 'Cocina', type: 'single', plannedAmount: 2000000 });
  const e2 = await createExpense({ projectId: usd.id, name: 'Vuelos', type: 'single', plannedAmount: 900 });
  await addPayment({ expenseId: e1.id, amount: 1800000, date: may(15) });
  await addPayment({ expenseId: e2.id, amount: 500, date: may(15) });
  renderCal();
  expect(await screen.findByText('₡1.800.000 + $500 · 2 pagos')).toBeInTheDocument();
  expect(screen.getByText('$500')).toBeInTheDocument();
  expect(screen.getByText('₡1.800.000')).toBeInTheDocument();
});
