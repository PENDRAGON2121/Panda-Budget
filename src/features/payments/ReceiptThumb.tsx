import { useEffect, useState } from 'react';
import { Button, Modal } from '@heroui/react';
import { useReceipt } from '../../db/hooks';

/** Tiny receipt preview; tapping it opens a full-size viewer. Object URLs are revoked on unmount. */
export function ReceiptThumb({ receiptId }: { receiptId: string }) {
  const receipt = useReceipt(receiptId);
  const [url, setUrl] = useState<string>();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!receipt) return;
    const u = URL.createObjectURL(receipt.blob);
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
      setUrl(undefined);
    };
  }, [receipt]);

  if (!url) return null;
  return (
    <>
      <Button
        isIconOnly
        variant="ghost"
        aria-label="Ver recibo"
        onPress={() => setOpen(true)}
        className="h-[34px] w-[34px] min-w-0 shrink-0 overflow-hidden rounded-[9px] border border-highlight p-0"
      >
        <img src={url} alt="Recibo adjunto" className="h-full w-full object-cover" />
      </Button>
      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container scroll="inside">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Recibo</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <img src={url} alt="Recibo ampliado" className="w-full rounded-md" />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
