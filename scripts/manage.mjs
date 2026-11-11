import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { projects, root } from './projects.mjs';

const mode = process.argv[2];
const children = new Set();
let stopping = false;

function launch(project, args) {
  console.log(`[${project.id}] npm ${args.join(' ')}`);
  const child = spawn('npm', args, {
    cwd: project.directory,
    stdio: 'inherit',
    detached: true,
    env: {
      ...process.env,
      npm_config_cache: process.env.npm_config_cache || `${root}.local/npm-cache`,
      PERASHKI_BASE_PATH: project.basePath,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  });
  children.add(child);
  child.once('error', error => { console.error(error); stop(1); });
  return child;
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  }
  setTimeout(() => {
    for (const child of children) {
      try { process.kill(-child.pid, 'SIGKILL'); } catch {}
    }
    process.exit(code);
  }, 1500).unref();
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

if (['install', 'build', 'typecheck'].includes(mode)) {
  await mkdir(`${root}.local`, { recursive: true });
  for (const project of projects) {
    const args = mode === 'install' ? ['ci', '--include=dev', '--no-audit', '--no-fund'] : ['run', mode];
    const child = launch(project, args);
    const code = await new Promise(resolve => child.once('exit', resolve));
    children.delete(child);
    if (code !== 0) { process.exitCode = code || 1; break; }
  }
} else {
  console.error('Usage: node scripts/manage.mjs install|build|typecheck');
  process.exitCode = 1;
}
