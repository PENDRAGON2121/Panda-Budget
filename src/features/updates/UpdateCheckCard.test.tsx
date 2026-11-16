import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateCheckCard } from './UpdateCheckCard';
import { dismissUpdate, getAvailableUpdate, registerWebReload } from './updateStore';

const m = vi.hoisted(() => ({ native: true, check: vi.fn(), web: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => m.native } }));
vi.mock('../../lib/updates', () => ({ checkForUpdateDetailed: m.check }));
vi.mock('./webUpdate', () => ({ checkWebUpdate: m.web }));

const update = { version: '0.0.2', notes: '', apkUrl: 'https://x/app.apk', htmlUrl: 'https://x' };
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}
const press = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Buscar actualizaciones' }));
};

beforeEach(() => {
  vi.clearAllMocks();
  m.native = true;
  act(() => dismissUpdate());
});

describe('UpdateCheckCard (native)', () => {
  it('shows the current version', () => {
    render(<UpdateCheckCard />);
    expect(screen.getByText(`Versión ${__APP_VERSION__}`)).toBeInTheDocument();
  });

  it('goes buscando → al día', async () => {
    const d = deferred<{ status: 'none' }>();
    m.check.mockReturnValue(d.promise);
    render(<UpdateCheckCard />);
    await press();
    expect(screen.getByText('Buscando actualizaciones…')).toBeInTheDocument();
    await act(async () => d.resolve({ status: 'none' }));
    expect(screen.getByText('Estás al día')).toBeInTheDocument();
  });

  it('nueva versión: reports it and opens the update modal', async () => {
    m.check.mockResolvedValue({ status: 'available', update });
    render(<UpdateCheckCard />);
    await press();
    expect(await screen.findByText('Nueva versión v0.0.2 disponible')).toBeInTheDocument();
    expect(getAvailableUpdate()).toEqual(update);
  });

  it('"Ver novedades" reopens the modal after it was dismissed', async () => {
    m.check.mockResolvedValue({ status: 'available', update });
    render(<UpdateCheckCard />);
    await press();
    act(() => dismissUpdate());
    expect(getAvailableUpdate()).toBeNull();
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Ver novedades' }));
    expect(getAvailableUpdate()).toEqual(update);
  });

  it('does not set state after unmount', async () => {
    const d = deferred<{ status: 'none' }>();
    m.check.mockReturnValue(d.promise);
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<UpdateCheckCard />);
    await press();
    unmount();
    await act(async () => d.resolve({ status: 'none' }));
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });

  it('sin conexión', async () => {
    m.check.mockResolvedValue({ status: 'error' });
    render(<UpdateCheckCard />);
    await press();
    expect(await screen.findByText('Sin conexión. Intentá más tarde.')).toBeInTheDocument();
  });
});

describe('UpdateCheckCard (web)', () => {
  beforeEach(() => {
    m.native = false;
  });

  it('asks the service worker for an update instead of GitHub', async () => {
    m.web.mockResolvedValue('none');
    render(<UpdateCheckCard />);
    await press();
    expect(await screen.findByText('Estás al día')).toBeInTheDocument();
    expect(m.check).not.toHaveBeenCalled();
  });

  it('a new web version points to the reload prompt', async () => {
    m.web.mockResolvedValue('available');
    render(<UpdateCheckCard />);
    await press();
    expect(await screen.findByText('Hay una versión nueva. Tocá «Recargar» para usarla.')).toBeInTheDocument();
    const reload = vi.fn();
    registerWebReload(reload);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Recargar' }));
    expect(reload).toHaveBeenCalled();
    registerWebReload(null);
  });

  it('sin conexión on the web', async () => {
    m.web.mockResolvedValue('error');
    render(<UpdateCheckCard />);
    await press();
    expect(await screen.findByText('Sin conexión. Intentá más tarde.')).toBeInTheDocument();
  });
});
