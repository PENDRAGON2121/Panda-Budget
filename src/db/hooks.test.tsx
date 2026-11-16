import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { db } from './db';
import { useExpenseCurrency, useProjectCurrency } from './hooks';
import { createExpense, createProject } from './repos';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

test('useProjectCurrency is undefined while loading, then the project currency', async () => {
  const p = await createProject({ name: 'Viaje', currency: 'USD', totalBudget: 1 });
  const { result } = renderHook(() => useProjectCurrency(p.id));
  expect(result.current).toBeUndefined();
  await waitFor(() => expect(result.current).toBe('USD'));
});

test('useExpenseCurrency is undefined while loading, then the owning project currency', async () => {
  const p = await createProject({ name: 'Viaje', currency: 'USD', totalBudget: 1 });
  const e = await createExpense({ projectId: p.id, name: 'X', type: 'single', plannedAmount: 1 });
  const { result } = renderHook(() => useExpenseCurrency(e.id));
  expect(result.current).toBeUndefined();
  await waitFor(() => expect(result.current).toBe('USD'));
});
