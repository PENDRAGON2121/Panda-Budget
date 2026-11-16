import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfileScreen } from './ProfileScreen';
import pkg from '../../../package.json';

const ui = () => (
  <MemoryRouter>
    <ProfileScreen />
  </MemoryRouter>
);

describe('ProfileScreen', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('shows "Almacenamiento protegido" when storage is persisted', async () => {
    vi.stubGlobal('navigator', { ...navigator, storage: { persisted: () => Promise.resolve(true) } });
    render(ui());
    expect(await screen.findByText('Almacenamiento protegido')).toBeInTheDocument();
  });

  it('warns the browser could clear data when storage is not persisted', async () => {
    vi.stubGlobal('navigator', { ...navigator, storage: { persisted: () => Promise.resolve(false) } });
    render(ui());
    expect(await screen.findByText('El navegador podría borrar los datos')).toBeInTheDocument();
  });


  it('renders the default-currency control (CRC selected by default)', () => {
    render(ui());
    expect(screen.getByRole('radiogroup', { name: /moneda predeterminada/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /colones/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /dólares/i })).not.toBeChecked();
  });

  it('shows the local-data note and the disabled fase-2 backup item', () => {
    render(ui());
    expect(screen.getByText(/datos locales/i)).toBeInTheDocument();
    expect(screen.getByText(/solo en este dispositivo/i)).toBeInTheDocument();
    expect(screen.getByText(/respaldo \/ exportar \(próximamente\)/i)).toBeInTheDocument();
  });

  it('persists the currency preference across re-renders', async () => {
    const user = userEvent.setup();
    const { unmount } = render(ui());
    await user.click(screen.getByRole('radio', { name: /dólares/i }));
    expect(screen.getByRole('radio', { name: /dólares/i })).toBeChecked();
    unmount();
    render(ui());
    expect(screen.getByRole('radio', { name: /dólares/i })).toBeChecked();
  });
});

describe('ProfileScreen version', () => {
  it('shows the app version injected at build time', () => {
    render(ui());
    expect(screen.getByText(`Panda Wallet · versión ${pkg.version}`)).toBeInTheDocument();
  });
});
