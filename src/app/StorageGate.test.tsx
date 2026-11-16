import { render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { db } from '../db/db';
import { StorageGate } from './StorageGate';

afterEach(() => vi.restoreAllMocks());

test('renders the app when the local database opens', async () => {
  render(<StorageGate><p>App lista</p></StorageGate>);
  expect(await screen.findByText('App lista')).toBeInTheDocument();
  expect(screen.queryByText(/no se pudo abrir el almacenamiento local/i)).not.toBeInTheDocument();
});

test('shows a clear error screen instead of a blank app when the database fails to open', async () => {
  vi.spyOn(db, 'open').mockRejectedValueOnce(new Error('InvalidStateError'));
  render(<StorageGate><p>App lista</p></StorageGate>);
  expect(await screen.findByRole('heading', { name: 'No se pudo abrir el almacenamiento local' })).toBeInTheDocument();
  expect(screen.queryByText('App lista')).not.toBeInTheDocument();
});
