import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
const firstPort = Number(process.env.PERASHKI_FIRST_APP_PORT || 3101);
export const projects = ['sloth-ai', 'visio-generator', 'overtimer', 'level-up'].map((id, index) => ({
  id,
  directory: path.join(root, 'apps', id),
  basePath: `/tools/${id}`,
  port: firstPort + index,
}));
