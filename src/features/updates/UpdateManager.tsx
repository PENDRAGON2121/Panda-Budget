import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Toast, toast } from '@heroui/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { checkForUpdateDetailed } from '../../lib/updates';
import { setLastUpdateCheck, shouldAutoCheckUpdates } from '../../lib/settings';
import { offerUpdate } from './updateStore';
import { UpdateModal } from './UpdateModal';

/** Android: check GitHub Releases on startup, at most once per 24h (failed checks are retried next launch). */
function NativeAutoCheck() {
  useEffect(() => {
    if (!shouldAutoCheckUpdates()) return;
    let alive = true;
    void checkForUpdateDetailed(__APP_VERSION__).then((r) => {
      if (r.status === 'error') return;
      setLastUpdateCheck(Date.now());
      if (alive && r.status === 'available') offerUpdate(r.update);
    });
    return () => {
      alive = false;
    };
  }, []);
  return null;
}

/**
 * Web/PWA: registers the service worker in "prompt" mode and, when a new build is waiting, shows a persistent
 * toast "Hay una versión nueva — Recargar". Never mounted in the native shell (assets are bundled locally there).
 */
function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  useEffect(() => {
    if (!needRefresh) return;
    const id = toast('Hay una versión nueva', {
      timeout: 0,
      actionProps: { children: 'Recargar', onPress: () => void updateServiceWorker(true) },
      onClose: () => setNeedRefresh(false),
    });
    return () => toast.close(id);
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}

/** App-level update plumbing: toast region + the platform's update flow. */
export function UpdateManager() {
  const native = Capacitor.isNativePlatform();
  return (
    <>
      {/* Top placement keeps toasts clear of the floating tab bar. */}
      <Toast.Provider placement="top" />
      {native ? (
        <>
          <NativeAutoCheck />
          <UpdateModal />
        </>
      ) : (
        <PwaUpdatePrompt />
      )}
    </>
  );
}
