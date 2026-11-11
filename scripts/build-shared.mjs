import { build } from 'esbuild';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { root } from './projects.mjs';

export async function buildShared() {
  await mkdir(path.join(root, 'public/generated'), { recursive: true });
  // Portal builds independently of the child services' dependency installs.
  const require = createRequire(import.meta.url);
  await build({ entryPoints: [path.join(root, 'shared/validators.ts')], outfile: path.join(root, 'public/generated/validators.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, alias: { zod: require.resolve('zod') } });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await buildShared();
