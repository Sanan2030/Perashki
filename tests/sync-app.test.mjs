import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { syncApp } from '../scripts/sync-app.mjs';

const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
async function fixture(t, conflict = false) {
  const dir = await mkdtemp(path.join(tmpdir(), 'perashki-sync-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'source');
  const repo = path.join(dir, 'portal');
  for (const cwd of [source, repo]) {
    await mkdir(cwd);
    git(cwd, 'init', '-b', 'main');
    git(cwd, 'config', 'user.name', 'Sync test');
    git(cwd, 'config', 'user.email', 'sync@example.test');
  }
  const original = 'first\nkeep 1\nkeep 2\nkeep 3\nkeep 4\nkeep 5\nlast\n';
  await writeFile(path.join(source, 'app.txt'), original);
  await writeFile(path.join(source, 'removed.txt'), 'old');
  git(source, 'add', '.'); git(source, 'commit', '-m', 'Original');
  const previous = git(source, 'rev-parse', 'HEAD');
  await mkdir(path.join(repo, 'apps/sloth-ai'), { recursive: true });
  await mkdir(path.join(repo, 'docs'));
  await writeFile(path.join(repo, 'apps/sloth-ai/app.txt'), original.replace(conflict ? 'first' : 'last', 'local integration'));
  await writeFile(path.join(repo, 'apps/sloth-ai/removed.txt'), 'old');
  await writeFile(path.join(repo, 'apps/sloth-ai/theme.css'), 'local theme stays');
  await writeFile(path.join(repo, 'docs/sources.json'), JSON.stringify([{ name: 'sloth-ai', source, branch: 'main', commit: previous }]));
  git(repo, 'add', '.'); git(repo, 'commit', '-m', 'Integrated app');
  const head = git(repo, 'rev-parse', 'HEAD');
  await writeFile(path.join(source, 'app.txt'), original.replace('first', 'upstream feature'));
  await rm(path.join(source, 'removed.txt'));
  await writeFile(path.join(source, 'new.bin'), Buffer.from([0, 255, 16, 0, 234]));
  git(source, 'add', '.'); git(source, 'commit', '-m', 'Upstream improvement');
  const target = git(source, 'rev-parse', 'HEAD');
  return { source, repo, previous, target, head, dir };
}

test('source check is read-only; merge preserves local integration, binary adds and deletions', async t => {
  const f = await fixture(t);
  const check = await syncApp('sloth-ai', { repoRoot: f.repo, check: true });
  assert.equal(check.target, f.target);
  assert.equal(git(f.repo, 'status', '--porcelain'), '');
  const result = await syncApp('sloth-ai', { repoRoot: f.repo, worktreePath: path.join(f.dir, 'update') });
  assert.deepEqual(result.conflicts, []);
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.head);
  assert.equal(git(f.repo, 'status', '--porcelain'), '');
  const merged = await readFile(path.join(result.workspace, 'apps/sloth-ai/app.txt'), 'utf8');
  assert.match(merged, /upstream feature/);
  assert.match(merged, /local integration/);
  assert.equal(await readFile(path.join(result.workspace, 'apps/sloth-ai/theme.css'), 'utf8'), 'local theme stays');
  assert.deepEqual(await readFile(path.join(result.workspace, 'apps/sloth-ai/new.bin')), Buffer.from([0, 255, 16, 0, 234]));
  await assert.rejects(readFile(path.join(result.workspace, 'apps/sloth-ai/removed.txt')));
  const [record] = JSON.parse(await readFile(path.join(result.workspace, 'docs/sources.json'), 'utf8'));
  assert.equal(record.commit, f.target);
  assert.equal(record.importCommit, f.previous);
  git(result.workspace, 'add', '.'); git(result.workspace, 'commit', '-m', 'Accept update');
  const again = await syncApp('sloth-ai', { repoRoot: result.workspace });
  assert.equal(again.changed, false);
});

test('conflicts stay reviewable on a separate branch without changing main', async t => {
  const f = await fixture(t, true);
  const result = await syncApp('sloth-ai', { repoRoot: f.repo, worktreePath: path.join(f.dir, 'conflict') });
  assert.deepEqual(result.conflicts, ['apps/sloth-ai/app.txt']);
  assert.match(await readFile(path.join(result.workspace, 'apps/sloth-ai/app.txt'), 'utf8'), /<<<<<<< ours/);
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.head);
  assert.equal(git(f.repo, 'status', '--porcelain'), '');
});

test('unsaved local work blocks a sync and remains untouched', async t => {
  const f = await fixture(t);
  await writeFile(path.join(f.repo, 'apps/sloth-ai/theme.css'), 'unfinished theme');
  await assert.rejects(syncApp('sloth-ai', { repoRoot: f.repo }), /commit et/);
  assert.equal(await readFile(path.join(f.repo, 'apps/sloth-ai/theme.css'), 'utf8'), 'unfinished theme');
});

test('rewritten source history requires review and leaves the main branch untouched', async t => {
  const f = await fixture(t);
  const tree = git(f.source, 'rev-parse', 'HEAD^{tree}');
  const rewritten = git(f.source, 'commit-tree', tree, '-m', 'Rewritten history');
  git(f.source, 'update-ref', 'refs/heads/main', rewritten);
  await assert.rejects(syncApp('sloth-ai', { repoRoot: f.repo }), /force push\/rebase/);
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.head);
  assert.equal(git(f.repo, 'status', '--porcelain'), '');
});
