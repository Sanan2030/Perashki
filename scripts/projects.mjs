import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { services } from '../shared/services.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const projects = services.map(service => ({
  ...service,
  directory: path.join(root, 'apps', service.id),
}));
