// Copies the built SDK into the demo site's public/ folder so it can be
// served by the demo site's own dev server / static host, the same way a
// merchant would pull it from a CDN in production.
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, 'dist', 'dodo-checkout.js');
const destDir = join(__dirname, '..', 'demo-site', 'public');
const dest = join(destDir, 'dodo-checkout.js');

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`Copied SDK build to ${dest}`);
