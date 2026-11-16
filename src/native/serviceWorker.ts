/**
 * Registers the PWA service worker, except inside the Capacitor native shell (assets are bundled locally
 * there, so a service worker only adds stale-cache risk). `register` is injected so it can be tested.
 */
export function setupServiceWorker(isNative: boolean, register: () => unknown): boolean {
  if (isNative) return false;
  void register();
  return true;
}
