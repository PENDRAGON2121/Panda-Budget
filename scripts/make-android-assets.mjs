// Builds the source images @capacitor/assets expects (assets/*.png) from the panda SVGs.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const BG = '#c4e8c8';
const full = 'docs/assets/panda-app-icon.svg';
const fg = 'docs/assets/panda-sin-fondo.svg';
mkdirSync('assets', { recursive: true });

const centered = (svg, size, canvas, bg) =>
  sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
    .then((buf) =>
      sharp({ create: { width: canvas, height: canvas, channels: 4, background: bg } })
        .composite([{ input: buf, gravity: 'center' }])
        .png(),
    );

const clear = { r: 0, g: 0, b: 0, alpha: 0 };
const green = { r: 0xc4, g: 0xe8, b: 0xc8, alpha: 1 };

await sharp(full, { density: 384 }).resize(1024, 1024).png().toFile('assets/icon-only.png');
// Adaptive-icon foreground: panda inside the ~66% safe zone.
await (await centered(fg, 640, 1024, clear)).toFile('assets/icon-foreground.png');
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: green } }).png().toFile('assets/icon-background.png');
await (await centered(fg, 900, 2732, green)).toFile('assets/splash.png');
await (await centered(fg, 900, 2732, green)).toFile('assets/splash-dark.png');
console.log('assets/ ready (bg ' + BG + ')');
