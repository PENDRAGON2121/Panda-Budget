import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Button, Card, Spinner } from '@heroui/react';
import { checkForUpdateDetailed, type UpdateInfo } from '../../lib/updates';
import { setLastUpdateCheck } from '../../lib/settings';
import { offerUpdate, reloadWebApp } from './updateStore';
import { checkWebUpdate } from './webUpdate';

type State =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'none' }
  | { kind: 'available'; update?: UpdateInfo }
  | { kind: 'offline' };

/**
 * Perfil: current version + manual "Buscar actualizaciones".
 * - Android: GitHub Releases check; a newer APK opens the same modal as the startup check.
 * - Web/PWA: asks the service worker to update; a new build surfaces the "Recargar" toast.
 */
export function UpdateCheckCard() {
  const [state, setStateRaw] = useState<State>({ kind: 'idle' });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const setState = (s: State) => {
    if (alive.current) setStateRaw(s);
  };

  const check = async () => {
    setState({ kind: 'checking' });
    if (Capacitor.isNativePlatform()) {
      const r = await checkForUpdateDetailed(__APP_VERSION__);
      if (r.status === 'error') return setState({ kind: 'offline' });
      setLastUpdateCheck(Date.now());
      if (r.status === 'none') return setState({ kind: 'none' });
      setState({ kind: 'available', update: r.update });
      offerUpdate(r.update);
      return;
    }
    const r = await checkWebUpdate();
    setState(r === 'error' ? { kind: 'offline' } : r === 'none' ? { kind: 'none' } : { kind: 'available' });
  };

  return (
    <Card className="rounded-card border border-hairline shadow-card">
      <Card.Content className="flex flex-col gap-2.5">
        <div>
          <h2 className="font-display text-[15px] font-extrabold text-ink">Actualizaciones</h2>
          <p className="text-[13px] text-ink-muted">Versión {__APP_VERSION__}</p>
        </div>
        <Button type="button" variant="secondary" isDisabled={state.kind === 'checking'} onPress={() => void check()}>
          Buscar actualizaciones
        </Button>
        <div aria-live="polite" className="min-h-[18px] text-[12.5px] font-bold">
          {state.kind === 'checking' && (
            <span className="flex items-center gap-2 text-ink-muted">
              <Spinner size="sm" color="current" />
              <span>Buscando actualizaciones…</span>
            </span>
          )}
          {state.kind === 'none' && <span className="text-green-deep">Estás al día</span>}
          {state.kind === 'available' && (
            <span className="text-green-deep">
              {state.update
                ? `Nueva versión v${state.update.version} disponible`
                : 'Hay una versión nueva. Tocá «Recargar» para usarla.'}
            </span>
          )}
          {state.kind === 'offline' && <span className="text-bamboo-ink">Sin conexión. Intentá más tarde.</span>}
        </div>
        {state.kind === 'available' && (
          <Button
            type="button"
            variant="secondary"
            onPress={() => (state.update ? offerUpdate(state.update) : reloadWebApp())}
          >
            {state.update ? 'Ver novedades' : 'Recargar'}
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}
