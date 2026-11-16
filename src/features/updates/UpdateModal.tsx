import { useState } from 'react';
import { Button, Modal } from '@heroui/react';
import { Browser } from '@capacitor/browser';
import { dismissUpdate, useAvailableUpdate } from './updateStore';

/** Native-only: offers a newer APK. "Descargar e instalar" opens the APK URL; Android handles the install. */
export function UpdateModal() {
  const update = useAvailableUpdate();
  // Keep showing the last offer while the modal plays its exit animation (the store is already cleared).
  const [shown, setShown] = useState(update);
  if (update && update !== shown) setShown(update);

  const download = () => {
    if (!update) return;
    void Browser.open({ url: update.apkUrl }).catch(() => {});
    dismissUpdate();
  };

  return (
    <Modal.Backdrop isOpen={update !== null} onOpenChange={(open) => !open && dismissUpdate()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Nueva versión v{shown?.version}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-2">
            <p className="text-sm text-ink-muted">
              Hay una versión nueva de Panda Wallet. Tus datos se quedan en este dispositivo.
            </p>
            {shown?.notes && (
              <div className="max-h-56 overflow-y-auto rounded-sm border border-hairline bg-control px-3 py-2 text-[13px] leading-snug whitespace-pre-wrap text-ink">
                {shown.notes}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="secondary" onPress={dismissUpdate}>
              Más tarde
            </Button>
            <Button type="button" onPress={download}>
              Descargar e instalar
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
