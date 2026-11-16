import { useCallback, useRef, useState } from 'react';

export const SAVE_ERROR = 'No se pudo guardar. Intentá de nuevo.';

/**
 * Shared write guard for forms and confirmations: `saving` disables the submit control, a ref blocks a
 * second run fired before React re-renders (double tap), and a rejected write becomes an inline `error`
 * instead of an unhandled rejection. `run` resolves to true only when the action succeeded.
 */
export function useGuardedAction(message: string = SAVE_ERROR) {
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      if (busy.current) return false;
      busy.current = true;
      setSaving(true);
      setError(null);
      try {
        await action();
        return true;
      } catch {
        setError(message);
        return false;
      } finally {
        busy.current = false;
        setSaving(false);
      }
    },
    [message],
  );

  const clearError = useCallback(() => setError(null), []);
  return { saving, error, run, clearError };
}
