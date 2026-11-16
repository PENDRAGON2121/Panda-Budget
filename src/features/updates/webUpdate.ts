export type WebUpdateCheck = 'available' | 'none' | 'error';

/**
 * Web/PWA manual check: asks the browser to re-fetch the service worker script from this app's own origin
 * (no third-party call, no user data). When a new worker is found, `useRegisterSW` flips `needRefresh` and the
 * "Hay una versión nueva — Recargar" toast appears; this function only reports the outcome for Perfil.
 */
export async function checkWebUpdate(): Promise<WebUpdateCheck> {
  if (navigator.onLine === false) return 'error';
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (!reg) return 'none'; // dev server / unsupported browser: nothing to update
    await reg.update();
    return reg.waiting || reg.installing ? 'available' : 'none';
  } catch {
    return 'error';
  }
}
