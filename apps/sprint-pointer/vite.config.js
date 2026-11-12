import { defineConfig } from 'vite';
import { themeScript } from '../../shared/theme.mjs';

export default defineConfig({
  base: (process.env.PERASHKI_BASE_PATH ?? '/tools/sprint-pointer') + '/',
  esbuild: { jsx: 'automatic' },
  plugins: [{
    name: 'workspace-theme',
    transformIndexHtml() {
      return [{ tag: 'script', children: themeScript, injectTo: 'head-prepend' }];
    },
  }],
});
