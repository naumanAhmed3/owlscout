// Rasterises assets/icon.svg into the PNG sizes the extension manifest
// needs. Run with: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const svg = readFileSync(resolve(root, 'assets/icon.svg'));
const sizes = [16, 32, 48, 96, 128];

mkdirSync(resolve(root, 'public/icon'), { recursive: true });

for (const size of sizes) {
  const out = resolve(root, `public/icon/${size}.png`);
  mkdirSync(dirname(out), { recursive: true });
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(out);
  console.log(`✓ public/icon/${size}.png`);
}
