#!/usr/bin/env node
/**
 * Regenerate extension icons from assets/icon.png
 * Requires: npm install (sharp is a devDependency)
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourcePath = join(root, 'assets', 'icon.png');
const outDir = join(root, 'public', 'icon');
const sizes = [16, 32, 48, 96, 128];

await mkdir(outDir, { recursive: true });

for (const size of sizes) {
  await sharp(sourcePath)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(join(outDir, `${size}.png`));
  console.log(`Wrote public/icon/${size}.png`);
}

console.log('Done.');
