import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export const syncableApps = ['sloth-ai', 'visio-generator', 'overtimer', 'level-up', 'sprint-pointer'];

function git(cwd, args, options = {}) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) throw new Error(result.stderr.trim() || result.stdout.trim() || `git ${args[0]} failed`);
  return result;
}

/** Merge only the upstream delta into an isolated, reviewable worktree. */
export async function syncApp(name, { repoRoot = root, check = false, worktreePath } = {}) {
  if (!syncableApps.includes(name)) throw new Error(`Tətbiqi seç: ${syncableApps.join(', ')}.`);
  const manifestPath = path.join(repoRoot, 'docs/sources.json');
  const sources = JSON.parse(await readFile(manifestPath, 'utf8'));
  const source = sources.find(item => item.name === name);
  if (!source || !/^[a-f0-9]{40}$/.test(source.commit || '') || !source.branch || !source.source) throw new Error('Mənbə commit-i docs/sources.json faylında yoxdur.');

  // Each source has its own ref, so updating two apps cannot race over
  // FETCH_HEAD. Only this tracking ref may move backwards; main never moves.
  const sourceRef = `refs/perashki/sources/${name}`;
  git(repoRoot, ['fetch', '--no-tags', '--', source.source, `+refs/heads/${source.branch}:${sourceRef}`]);
  const target = git(repoRoot, ['rev-parse', `${sourceRef}^{commit}`]).stdout.trim();
  const previous = source.commit;
  if (target === previous) return { name, changed: false, target };
  if (git(repoRoot, ['cat-file', '-e', `${previous}^{commit}`], { allowFailure: true }).status !== 0) {
    git(repoRoot, ['fetch', '--no-tags', '--', source.source, previous]);
  }
  if (git(repoRoot, ['merge-base', '--is-ancestor', previous, target], { allowFailure: true }).status !== 0) {
    throw new Error('Mənbə tarixçəsi dəyişdirilib (force push/rebase). Avtomatik yeniləmə dayandırıldı; commit-lər ayrıca müqayisə edilməlidir.');
  }
  const summary = git(repoRoot, ['diff', '--stat', previous, target]).stdout.trim();
  if (check) return { name, changed: true, previous, target, summary };
  if (git(repoRoot, ['status', '--porcelain']).stdout.trim()) throw new Error('Əvvəlcə hazırkı dəyişiklikləri commit et. Yeniləmə üçün iş qovluğu təmiz olmalıdır.');

  const branch = `sync/${name}/${target.slice(0, 8)}-${Date.now()}`;
  const workspace = path.resolve(worktreePath || path.join(repoRoot, '.local/sync', `${name}-${target.slice(0, 8)}-${Date.now()}`));
  await mkdir(path.dirname(workspace), { recursive: true });
  git(repoRoot, ['worktree', 'add', '-b', branch, workspace, 'HEAD']);
  const patch = git(repoRoot, ['diff', '--binary', '--full-index', '--no-renames', previous, target]).stdout;
  const applied = patch ? git(workspace, ['apply', '--3way', '--index', '--whitespace=nowarn', `--directory=apps/${name}`], { input: patch, allowFailure: true }) : { status: 0 };
  const conflicts = git(workspace, ['diff', '--name-only', '--diff-filter=U']).stdout.trim().split('\n').filter(Boolean);
  if (applied.status !== 0 && !conflicts.length) {
    throw new Error(`Yeniləmə tətbiq edilmədi. Əsas qovluq dəyişməyib; yoxlama qovluğu: ${workspace}\n${applied.stderr}`);
  }
  // A conflicted branch records its intended merge target. Git prevents a
  // commit until every conflict is resolved; the main worktree stays intact.
  source.importCommit ||= previous;
  source.commit = target;
  await writeFile(path.join(workspace, 'docs/sources.json'), JSON.stringify(sources, null, 2) + '\n');
  git(workspace, ['add', 'docs/sources.json']);
  return { name, changed: true, previous, target, summary, branch, workspace, conflicts };
}

async function cli() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help')) {
    console.log('İstifadə: npm run sync:app -- sloth-ai [--check] [--worktree /tam/yol]\nTətbiqlər: ' + syncableApps.join(', ') + '\nƏmr mənbənin main dəyişikliklərini ayrıca budağa gətirir; commit/push etmir.');
    return;
  }
  const name = args.shift();
  const options = {};
  while (args.length) {
    const flag = args.shift();
    if (flag === '--check') options.check = true;
    else if (flag === '--worktree' && args[0]) options.worktreePath = args.shift();
    else throw new Error(`Naməlum parametr: ${flag}`);
  }
  const result = await syncApp(name, options);
  if (process.env.GITHUB_OUTPUT) {
    const lines = [`changed=${result.changed}`, `branch=${result.branch || ''}`, `workspace=${result.workspace || ''}`];
    await writeFile(process.env.GITHUB_OUTPUT, lines.join('\n') + '\n', { flag: 'a' });
  }
  if (!result.changed) console.log(`${name}: mənbə ilə eynidir (${result.target.slice(0, 8)}).`);
  else if (options.check) console.log(`${name}: ${result.previous.slice(0, 8)} → ${result.target.slice(0, 8)}\n${result.summary}`);
  else {
    console.log(`Budaq: ${result.branch}\nQovluq: ${result.workspace}\n${result.summary}`);
    if (result.conflicts.length) {
      console.error(`Konfliktləri bu qovluqda həll edib git add ilə işarələ:\n${result.conflicts.join('\n')}\nƏsas qovluq dəyişdirilməyib.`);
      process.exitCode = 1;
    } else console.log('Dəyişikliklər hazırdır. Bu qovluqda npm ci --include=dev, npm run setup, npm test, npm run typecheck və npm run build ilə yoxla, sonra commit/push et.');
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { await cli(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
