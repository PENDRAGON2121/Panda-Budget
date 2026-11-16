// One-off: renders PWA PNG icons from docs/assets SVGs into public/.
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const BG = '#c4e8c8';
const icon = await readFile('docs/assets/panda-app-icon.svg');
const bare = await readFile('docs/assets/panda-sin-fondo.svg');

for (const size of [192, 512]) {
  await sharp(icon, { density: 384 }).resize(size, size).png().toFile(`public/pwa-${size}x${size}.png`);
}

// Maskable: full-bleed #c4e8c8 square, panda centered inside the 80% safe zone.
const inner = Math.round(512 * 0.7);
const panda = await sharp(bare, { density: 384 })
  .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: BG } })
  .composite([{ input: panda, gravity: 'center' }])
  .png()
  .toFile('public/pwa-maskable-512x512.png');
console.log('icons written');
