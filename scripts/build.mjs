import { cp, mkdir, readdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import { projects, root } from './projects.mjs';
import { serviceRoutes } from './deployment.mjs';
import { buildShared } from './build-shared.mjs';

const output = path.join(root, '.vercel/output');
const staging = path.join(root, '.local/static-build');
await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'static'), { recursive: true });
await buildShared();
await cp(path.join(root, 'public'), path.join(output, 'static'), { recursive: true });

for (const project of projects) {
  console.log(`\n[${project.id}] Building the frontend for the shared Vercel deployment`);
  const directory = path.join(staging, project.id);
  await rm(directory, { recursive: true, force: true });
  await cp(project.directory, directory, {
    recursive: true,
    filter: source => !['node_modules', '.next', '.git', 'out', '.vercel', '.local'].includes(path.basename(source)),
  });
  await symlink(path.join(project.directory, 'node_modules'), path.join(directory, 'node_modules'), 'dir');
  // API routes retain their original implementations in self-contained Vercel
  // Functions. Only the disposable frontend build omits server-only routes.
  const appDirectory = path.join(directory, project.id === 'overtimer' ? 'src/app' : 'app');
  await rm(path.join(appDirectory, 'api'), { recursive: true, force: true });
  await rm(path.join(directory, 'proxy.ts'), { force: true });
  // Frontend staging excludes API-only tests; original checkouts keep all
  // routes and tests and are checked separately with npm run typecheck.
  const tsconfigFile = path.join(directory, 'tsconfig.json');
  const tsconfig = JSON.parse(await readFile(tsconfigFile, 'utf8'));
  tsconfig.exclude = [...(tsconfig.exclude || []), 'tests', '**/*.test.ts', 'playwright.config.ts'];
  await writeFile(tsconfigFile, JSON.stringify(tsconfig, null, 2));
  if (project.id === 'level-up') {
    for (const file of ['robots.ts', 'sitemap.ts', 'opengraph-image.tsx']) {
      const filename = path.join(appDirectory, file);
      await writeFile(filename, `export const dynamic = 'force-static';\n${await readFile(filename, 'utf8')}`);
    }
    const entry = path.join(appDirectory, '(entry)');
    await mkdir(entry, { recursive: true });
    await writeFile(path.join(entry, 'layout.tsx'), `export default function Layout({children}:{children:React.ReactNode}){return <html lang="az"><body>{children}</body></html>}`);
    await writeFile(path.join(entry, 'page.tsx'), `'use client';
import {useEffect} from 'react';
export default function Entry(){useEffect(()=>{const locale=document.cookie.split(';').some(c=>c.trim()==='level-up.locale=az')?'az':'en';location.replace(${JSON.stringify(project.basePath)}+'/'+locale+'/');},[]);return <p><a href="${project.basePath}/az/">Azərbaycan dili</a> · <a href="${project.basePath}/en/">English</a></p>}`);
  }
  const child = spawn('npm', ['run', 'build'], {
    cwd: directory, stdio: 'inherit', env: {
      ...process.env, NEXT_TELEMETRY_DISABLED: '1', PERASHKI_BASE_PATH: project.basePath,
      PERASHKI_STATIC_EXPORT: '1', PERASHKI_REPO_ROOT: root,
      ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? { NEXT_PUBLIC_SITE_URL: `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}${project.basePath}` } : {}),
      npm_config_cache: process.env.npm_config_cache || path.join(root, '.local/npm-cache'),
    },
  });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  if (code !== 0) throw new Error(`${project.id} frontend build failed (${code}).`);
  await cp(path.join(directory, 'out'), path.join(output, 'static', project.basePath), { recursive: true });
}

for (const route of serviceRoutes) {
  const project = projects.find(project => project.id === route.app);
  const directory = path.join(output, 'functions', `${route.path}.func`);
  await mkdir(directory, { recursive: true });
  await build({
    stdin: {
      contents: `import * as route from ${JSON.stringify(path.join(project.directory, route.file))};\n${await readFile(path.join(root, 'scripts/function-adapter.txt'), 'utf8')}`,
      resolveDir: root, sourcefile: 'handler.mjs', loader: 'js',
    },
    outfile: path.join(directory, 'index.mjs'), bundle: true, platform: 'node', format: 'esm', target: 'node24',
    // The staged prebuild produced Sloth AI's verified dictionary. Resolve @/
    // imports there, including on a fresh clone without generated files.
    tsconfig: path.join(staging, project.id, 'tsconfig.json'),
    banner: { js: "import {createRequire as __createRequire} from 'node:module'; const require=__createRequire(import.meta.url);" },
    plugins: [{
      name: 'standard-web-response',
      setup(build) {
        build.onResolve({ filter: /^next\/server$/ }, () => ({ path: 'web-response', namespace: 'standard-web' }));
        build.onLoad({ filter: /.*/, namespace: 'standard-web' }, () => ({ contents: 'export const NextRequest = Request; export const NextResponse = Response;', loader: 'js' }));
      },
    }],
  });
  await writeFile(path.join(directory, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs24.x', handler: 'index.mjs', launcherType: 'Nodejs', maxDuration: 60 }));
}

await cp(path.join(root, 'public'), path.join(output, 'static'), { recursive: true });
await writeFile(path.join(output, 'static/api-health.json'), JSON.stringify({ status: 'ok', apps: projects.map(project => ({ id: project.id, ready: true })) }));
await writeFile(path.join(output, 'config.json'), JSON.stringify({
  version: 3,
  routes: [
    { src: '/(.*)', headers: { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN' }, continue: true },
    { src: '^/api/health$', dest: '/api-health.json' },
    { handle: 'filesystem' },
    { src: '^/(sloth-ai|visio-generator|sprint-pointer|overtimer|level-up|calendar|todo)/?$', dest: '/index.html' },
    { src: '^/tools/(.+?)/?$', dest: '/tools/$1/index.html' },
    { src: '^/$', dest: '/index.html' },
  ],
}, null, 2));
console.log('\nSingle-project Vercel Build Output is ready in .vercel/output. Nothing was deployed.');
