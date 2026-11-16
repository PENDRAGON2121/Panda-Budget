import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from '@heroui/react';
import { UpdateManager } from './UpdateManager';
import { dismissUpdate } from './updateStore';
import { getLastUpdateCheck, setLastUpdateCheck } from '../../lib/settings';

const m = vi.hoisted(() => ({
  native: false,
  needRefresh: false,
  setNeedRefresh: vi.fn(),
  updateServiceWorker: vi.fn(() => Promise.resolve()),
  useRegisterSW: vi.fn(),
  browserOpen: vi.fn(() => Promise.resolve()),
  check: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => m.native } }));
vi.mock('@capacitor/browser', () => ({ Browser: { open: m.browserOpen } }));
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (opts: unknown) => {
    m.useRegisterSW(opts);
    return {
      needRefresh: [m.needRefresh, m.setNeedRefresh],
      offlineReady: [false, vi.fn()],
      updateServiceWorker: m.updateServiceWorker,
    };
  },
}));
vi.mock('../../lib/updates', () => ({ checkForUpdateDetailed: m.check }));

const update = {
  version: '0.0.2',
  notes: '- Exportar datos\n- Arreglos',
  apkUrl: 'https://github.com/x/releases/download/v0.0.2/panda-wallet-0.0.2.apk',
  htmlUrl: 'https://github.com/x/releases/tag/v0.0.2',
};

beforeEach(() => {
  localStorage.clear();
  m.native = false;
  m.needRefresh = false;
  vi.clearAllMocks();
  act(() => dismissUpdate());
});
afterEach(() => act(() => toast.clear()));

describe('UpdateManager on the web (PWA)', () => {
  it('registers the service worker in prompt mode and never calls GitHub', () => {
    render(<UpdateManager />);
    expect(m.useRegisterSW).toHaveBeenCalled();
    expect(m.check).not.toHaveBeenCalled();
    expect(screen.queryByText('Hay una versión nueva')).not.toBeInTheDocument();
  });

  it('shows a "Hay una versión nueva / Recargar" toast that reloads into the new service worker', async () => {
    const user = userEvent.setup();
    m.needRefresh = true;
    render(<UpdateManager />);
    expect(await screen.findByText('Hay una versión nueva')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Recargar' }));
    expect(m.updateServiceWorker).toHaveBeenCalledWith(true);
  });
});

describe('UpdateManager in the native shell', () => {
  beforeEach(() => {
    m.native = true;
  });

  it('does not register a service worker', () => {
    m.check.mockResolvedValue({ status: 'none' });
    render(<UpdateManager />);
    expect(m.useRegisterSW).not.toHaveBeenCalled();
  });

  it('checks on startup and offers the new version in a modal', async () => {
    const user = userEvent.setup();
    m.check.mockResolvedValue({ status: 'available', update });
    render(<UpdateManager />);
    expect(await screen.findByRole('heading', { name: 'Nueva versión v0.0.2' })).toBeInTheDocument();
    expect(m.check).toHaveBeenCalledWith(__APP_VERSION__);
    expect(screen.getByText(/Exportar datos/)).toBeInTheDocument();
    expect(getLastUpdateCheck()).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Descargar e instalar' }));
    expect(m.browserOpen).toHaveBeenCalledWith({ url: update.apkUrl });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('"Más tarde" closes the modal without downloading', async () => {
    const user = userEvent.setup();
    m.check.mockResolvedValue({ status: 'available', update });
    render(<UpdateManager />);
    await user.click(await screen.findByRole('button', { name: 'Más tarde' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(m.browserOpen).not.toHaveBeenCalled();
  });

  it('checks at most once per 24h', () => {
    setLastUpdateCheck(Date.now() - 60_000);
    render(<UpdateManager />);
    expect(m.check).not.toHaveBeenCalled();
  });

  it('a failed check (offline) is not recorded, so the next launch retries', async () => {
    m.check.mockResolvedValue({ status: 'error' });
    render(<UpdateManager />);
    await waitFor(() => expect(m.check).toHaveBeenCalled());
    await act(async () => {});
    expect(getLastUpdateCheck()).toBe(0);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
