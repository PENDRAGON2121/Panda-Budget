import { render, screen } from '@testing-library/react';
import type { Installment, Payment } from '../../db/types';
import { InstallmentTimeline } from './InstallmentTimeline';

const insts: Installment[] = [1, 2, 3, 4].map((i) => ({
  id: `i${i}`,
  expenseId: 'e1',
  index: i,
  plannedAmount: 1000,
}));
const pay = (instId: string): Payment => ({
  id: `p-${instId}`,
  expenseId: 'e1',
  installmentId: instId,
  amount: 1000,
  date: 1,
  createdAt: 1,
});
const cane = () => screen.getByTestId('bamboo-cane');

test('the bamboo is a short stub when nothing is paid', () => {
  render(<InstallmentTimeline installments={insts} payments={[]} />);
  expect(cane()).toHaveAttribute('data-grown', '0');
  expect(cane()).toHaveAttribute('data-total', '4');
});

test('the bamboo grows up to the próxima cuota (paid progress)', () => {
  render(<InstallmentTimeline installments={insts} payments={[pay('i1'), pay('i2')]} />);
  expect(cane()).toHaveAttribute('data-grown', '2');
});

test('the bamboo reaches the full length when every cuota is paid', () => {
  render(<InstallmentTimeline installments={insts} payments={insts.map((i) => pay(i.id))} />);
  expect(cane()).toHaveAttribute('data-grown', '4');
});

test('shows two leaves at the growing tip', () => {
  render(<InstallmentTimeline installments={insts} payments={[pay('i1')]} />);
  expect(screen.getAllByTestId('bamboo-leaf')).toHaveLength(2);
});
