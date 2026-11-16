import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
}

/** Optional receipt capture: camera or gallery. Shows "sin recibo" when empty. */
export function ReceiptPicker({ file, onChange }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();

  useEffect(() => {
    if (!file) {
      setPreview(undefined);
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files?.[0] ?? null);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink">Captura (opcional)</span>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden aria-label="Tomar foto" onChange={pick} />
      <input ref={galleryRef} type="file" accept="image/*" hidden aria-label="Elegir de galería" onChange={pick} />
      {file ? (
        <div className="flex items-center gap-3">
          {preview && <img src={preview} alt="Vista previa del recibo" className="h-14 w-14 rounded-md object-cover" />}
          <Button type="button" size="sm" variant="secondary" onPress={() => onChange(null)}>
            Quitar
          </Button>
        </div>
      ) : (
        <>
          <p className="text-[12px] font-semibold text-ink-muted">sin recibo</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onPress={() => cameraRef.current?.click()}>
              📷 Cámara
            </Button>
            <Button type="button" size="sm" variant="secondary" onPress={() => galleryRef.current?.click()}>
              🖼️ Galería
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
