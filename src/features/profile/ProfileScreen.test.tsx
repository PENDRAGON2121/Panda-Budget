import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfileScreen } from './ProfileScreen';

const ui = () => (
  <MemoryRouter>
    <ProfileScreen />
  </MemoryRouter>
);

describe('ProfileScreen', () => {
  beforeEach(() => localStorage.clear());

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
