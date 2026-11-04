/**
 * Shrinks a photo in the browser before upload: longest side 640px, JPEG.
 * A 4 MB phone photo becomes roughly 40-80 KB, which keeps uploads fast and storage small.
 */
export async function compressImage(file: File, maxSide = 640): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('not-an-image');
  const bmp = await decode(file);
  const scale = Math.min(1, maxSide / Math.max(bmp.w, bmp.h));
  const w = Math.max(1, Math.round(bmp.w * scale));
  const h = Math.max(1, Math.round(bmp.h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no-canvas');
  ctx.fillStyle = '#fff'; // transparent PNGs get a white background instead of black
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp.source, 0, 0, w, h);
  for (const q of [0.82, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', q));
    if (blob && blob.size <= 400_000) return blob;
  }
  throw new Error('too-large');
}

async function decode(file: File): Promise<{ source: CanvasImageSource; w: number; h: number }> {
  try {
    const b = await createImageBitmap(file); // respects the photo's rotation (EXIF)
    return { source: b, w: b.width, h: b.height };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { source: img, w: img.naturalWidth, h: img.naturalHeight };
    } finally { URL.revokeObjectURL(url); }
  }
}
