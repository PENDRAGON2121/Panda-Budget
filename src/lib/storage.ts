let pending: Promise<boolean> | undefined;

/**
 * Asks the browser to keep IndexedDB data from being evicted. Called once at startup; later calls reuse the
 * first result. Resolves false when the Storage API is missing or the request fails.
 */
export function requestPersistence(): Promise<boolean> {
  pending ??= (async () => {
    try {
      return (await navigator.storage?.persist?.()) ?? false;
    } catch {
      return false;
    }
  })();
  return pending;
}

/** Whether storage is currently persisted (false when unknown/unsupported). */
export async function isPersisted(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted?.()) ?? false;
  } catch {
    return false;
  }
}
