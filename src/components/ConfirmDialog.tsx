import { Button, Modal } from '@heroui/react';
import { useGuardedAction } from '../lib/useGuardedAction';
import { FormError } from './FormError';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "¿Eliminar este pago?" */
  title: string;
  /** Optional detail line above the irreversibility warning. */
  description?: string;
  confirmLabel?: string;
  /** The destructive write. The dialog closes only when it resolves; a rejection shows an inline error. */
  onConfirm: () => Promise<unknown>;
}

/** HeroUI confirmation modal for destructive actions. */
export function ConfirmDialog({ isOpen, onOpenChange, title, description, confirmLabel = 'Eliminar', onConfirm }: Props) {
  const { saving, error, run, clearError } = useGuardedAction('No se pudo eliminar. Intentá de nuevo.');

  const change = (open: boolean) => {
    if (!open) clearError();
    onOpenChange(open);
  };

  async function confirm() {
    if (await run(onConfirm)) change(false);
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={change}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-3">
            {description && <p className="text-sm text-ink">{description}</p>}
            <p className="text-sm text-ink-muted">Esta acción no se puede deshacer.</p>
            <FormError message={error} />
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="secondary" onPress={() => change(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" isDisabled={saving} onPress={confirm}>
              {confirmLabel}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
