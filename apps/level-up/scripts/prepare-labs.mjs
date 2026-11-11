import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const dist = path.dirname(require.resolve('sql.js'));
const target = fileURLToPath(new URL('../public/labs/vendor/', import.meta.url));
await mkdir(target, { recursive: true });
for (const file of ['sql-wasm-browser.js', 'sql-wasm-browser.wasm']) {
  await copyFile(path.join(dist, file), path.join(target, file));
}
await copyFile(path.join(dist, '..', 'LICENSE'), path.join(target, 'sql.js-LICENSE.txt'));
console.log('Prepared SQLite browser assets.');
