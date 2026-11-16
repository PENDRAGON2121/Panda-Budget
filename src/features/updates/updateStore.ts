import { useSyncExternalStore } from 'react';
import type { UpdateInfo } from '../../lib/updates';

/**
 * The APK update currently offered to the user (native only). Shared by the startup auto-check and Perfil's
 * "Buscar actualizaciones", so both open the same modal.
 */
let current: UpdateInfo | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getAvailableUpdate(): UpdateInfo | null {
  return current;
}

export function offerUpdate(update: UpdateInfo): void {
  current = update;
  emit();
}

export function dismissUpdate(): void {
  if (current === null) return;
  current = null;
  emit();
}

/** Web/PWA: lets Perfil trigger the same "Recargar" as the toast (the handler lives with the service worker hook). */
let webReload: (() => void) | null = null;
export function registerWebReload(fn: (() => void) | null): void {
  webReload = fn;
}
export function reloadWebApp(): void {
  webReload?.();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useAvailableUpdate(): UpdateInfo | null {
  return useSyncExternalStore(subscribe, getAvailableUpdate, () => null);
}
