const MAX_SIDE = 1600;
const QUALITY = 0.8;

/** Downscale (max 1600px) and re-encode as JPEG. Falls back to the original file if decoding fails. */
export async function compressImage(file: File): Promise<{ blob: Blob; mime: string }> {
  const fallback = { blob: file as Blob, mime: file.type || 'application/octet-stream' };
  try {
    if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return fallback;
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallback;
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', QUALITY));
    return blob ? { blob, mime: 'image/jpeg' } : fallback;
  } catch {
    return fallback;
  }
}
