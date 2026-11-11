import { build } from 'esbuild';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { root } from './projects.mjs';

export async function buildShared() {
  await mkdir(path.join(root, 'public/generated'), { recursive: true });
  await build({ entryPoints: [path.join(root, 'shared/validators.ts')], outfile: path.join(root, 'public/generated/validators.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await buildShared();
