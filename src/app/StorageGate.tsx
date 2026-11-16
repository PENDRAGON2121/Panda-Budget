import { useEffect, useState, type ReactNode } from 'react';
import { Card } from '@heroui/react';
import { db } from '../db/db';

/**
 * Opens the local database up front. The app renders immediately; if opening fails (private mode, blocked
 * storage, corrupted/old DB) a clear error screen replaces it instead of a blank page.
 */
export function StorageGate({ children }: { children: ReactNode }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    db.open().catch(() => {
      if (alive) setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!failed) return <>{children}</>;
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-[18px] pt-[env(safe-area-inset-top)]">
      <Card role="alert" className="w-full rounded-card border border-hairline shadow-card text-center">
        <Card.Content className="flex flex-col items-center gap-2 py-8">
          <div aria-hidden className="text-5xl">🐼</div>
          <h1 className="font-display text-[19px] font-black text-ink">No se pudo abrir el almacenamiento local</h1>
          <p className="text-sm text-ink-muted">
            Panda Wallet guarda tus datos en este navegador y no pudo acceder a ellos. Revisá que no estés en
            modo privado y que el sitio tenga permiso para guardar datos, y volvé a cargar la página.
          </p>
        </Card.Content>
      </Card>
    </div>
  );
}
