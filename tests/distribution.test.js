import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { NAME, ROOT, payloadFiles } from '../lib/bundle.js';
import { destinations, installSkill } from '../lib/install.js';

const quiet = { log() {} };
async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'skill test '));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}
async function exists(file) {
  try { await fs.lstat(file); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}
function run(command, args, cwd) {
  const env = { ...process.env };
  // Keep fixture creation independent of an inherited npm dry-run setting.
  for (const key of Object.keys(env)) if (key.toLowerCase() === 'npm_config_dry_run') delete env[key];
  const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout: 60000 });
  assert.equal(result.status, 0, `${result.error ?? ''}\n${result.stdout}\n${result.stderr}`);
  return result;
}

test('all harnesses receive the complete identical skill payload', async t => {
  const project = await fixture(t);
  const targets = await destinations({ harness: 'all', project });
  await installSkill(targets, quiet);
  for (const target of targets) {
    const files = await payloadFiles(target);
    assert.deepEqual(files, await payloadFiles());
    for (const relative of files) assert.deepEqual(await fs.readFile(path.join(target, relative)), await fs.readFile(path.join(ROOT, relative)));
    assert.equal(await exists(path.join(target, 'bin')), false);
    assert.equal(await exists(path.join(target, 'package.json')), false);
  }
});

test('dry run writes no files or parent directories', async t => {
  const project = await fixture(t);
  await installSkill(await destinations({ harness: 'all', project }), { ...quiet, dryRun: true });
  assert.deepEqual(await fs.readdir(project), []);
});

test('preflight collision preserves existing content and creates no other installs', async t => {
  const project = await fixture(t);
  const targets = await destinations({ harness: 'all', project });
  await fs.mkdir(targets[2], { recursive: true });
  const sentinel = path.join(targets[2], 'user-content');
  await fs.writeFile(sentinel, 'retain this');
  await assert.rejects(installSkill(targets, quiet), /already exists/);
  assert.equal(await exists(targets[0]), false);
  assert.equal(await exists(targets[1]), false);
  assert.equal(await fs.readFile(sentinel, 'utf8'), 'retain this');
});

test('dangling destination symlink is never replaced', async t => {
  const project = await fixture(t);
  const target = path.join(project, 'skill');
  await fs.symlink(path.join(project, 'missing'), target);
  await assert.rejects(installSkill([target], quiet), /already exists/);
  assert.equal((await fs.lstat(target)).isSymbolicLink(), true);
});

test('copy failure rolls back only directories created by this invocation', async t => {
  const project = await fixture(t);
  const targets = await destinations({ harness: 'all', project });
  const payloadLength = (await payloadFiles()).length;
  let copies = 0;
  const copyFile = async (source, output) => {
    if (++copies === payloadLength + 1) throw new Error('simulated copy failure');
    return fs.copyFile(source, output);
  };
  await assert.rejects(installSkill(targets, { ...quiet, copyFile }), /simulated copy failure/);
  for (const target of targets) assert.equal(await exists(target), false);
  for (const target of targets.slice(0, 2)) assert.deepEqual(await fs.readdir(path.dirname(target)), []);
});

test('concurrent collision preserves another process installation', async t => {
  const project = await fixture(t);
  const targets = await destinations({ harness: 'all', project });
  const sentinel = path.join(targets[1], 'other-install');
  let competing = false;
  const copyFile = async (source, output) => {
    if (!competing) {
      competing = true;
      await fs.mkdir(targets[1], { recursive: true });
      await fs.writeFile(sentinel, 'other process');
    }
    return fs.copyFile(source, output);
  };
  await assert.rejects(installSkill(targets, { ...quiet, copyFile }), { code: 'EEXIST' });
  assert.equal(await exists(targets[0]), false);
  assert.equal(await fs.readFile(sentinel, 'utf8'), 'other process');
});

test('user paths honor absolute XDG_CONFIG_HOME', async t => {
  const home = await fixture(t);
  const targets = await destinations({ harness: 'all', scope: 'user', home, env: { XDG_CONFIG_HOME: path.join(home, 'config') } });
  assert.deepEqual(targets, [
    path.join(home, '.agents/skills', NAME),
    path.join(home, '.claude/skills', NAME),
    path.join(home, 'config/opencode/skills', NAME),
  ]);
});

test('user paths default to the conventional config directory', async t => {
  const home = await fixture(t);
  assert.deepEqual(await destinations({ harness: 'opencode', scope: 'user', home, env: {} }), [path.join(home, '.config/opencode/skills', NAME)]);
});

test('relative XDG config is rejected only when OpenCode is selected', async t => {
  const home = await fixture(t);
  const options = { scope: 'user', home, env: { XDG_CONFIG_HOME: 'relative-config' } };
  await assert.rejects(destinations({ ...options, harness: 'opencode' }), /absolute path/);
  assert.deepEqual(await destinations({ ...options, harness: 'codex' }), [path.join(home, '.agents/skills', NAME)]);
});

test('invalid project and option combinations are rejected', async t => {
  const project = await fixture(t);
  await assert.rejects(destinations({ harness: 'codex', project: path.join(project, 'missing') }), { code: 'ENOENT' });
  await assert.rejects(destinations({ harness: 'codex', scope: 'user', project }), /only valid/);
  await assert.rejects(destinations({ harness: 'unknown', project }), /Choose --harness/);
  await assert.rejects(destinations({ harness: 'codex', scope: 'global', project }), /Choose --scope/);
});

test('installation inside its own checkout is rejected without writes', async () => {
  await assert.rejects(installSkill([path.join(ROOT, '.agents/skills', NAME)], { ...quiet, dryRun: true }), /not this package checkout/);
});

test('symlinked parent cannot bypass source-checkout protection', async t => {
  const project = await fixture(t);
  const link = path.join(project, 'source');
  await fs.symlink(ROOT, link);
  await assert.rejects(installSkill([path.join(link, '.agents/skills', NAME)], { ...quiet, dryRun: true }), /not this package checkout/);
});

test('symlinked payload resources are rejected', async t => {
  const root = await fixture(t);
  for (const file of ['SKILL.md', 'LICENSE', 'NOTICE']) await fs.copyFile(path.join(ROOT, file), path.join(root, file));
  await fs.symlink(path.join(ROOT, 'references'), path.join(root, 'references'));
  await assert.rejects(payloadFiles(root), /payload directory/);
});

test('CLI accepts project paths with spaces and refuses a second install', async t => {
  const project = await fixture(t);
  const bin = path.join(ROOT, 'bin/frontend-feature-architecture.js');
  const args = [bin, 'install', '--harness', 'all', '--project', project];
  run(process.execPath, [...args, '--dry-run'], project);
  assert.deepEqual(await fs.readdir(project), []);
  run(process.execPath, args, project);
  const second = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(second.status, 1);
  assert.match(second.stderr, /already exists/);
});

test('help and version do not install anything; malformed CLI options fail', async t => {
  const project = await fixture(t);
  const bin = path.join(ROOT, 'bin/frontend-feature-architecture.js');
  assert.match(run(process.execPath, [bin, '--help'], project).stdout, /Usage:/);
  const manifest = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(run(process.execPath, [bin, '--version'], project).stdout.trim(), manifest.version);
  assert.match(run(process.execPath, [bin], project).stdout, /Usage:/);
  for (const args of [['install'], ['install', '--unknown'], ['delete', '--harness', 'all']]) {
    assert.equal(spawnSync(process.execPath, [bin, ...args], { cwd: project }).status, 1);
  }
  assert.deepEqual(await fs.readdir(project), []);
});

test('npm tarball installs and runs offline with complete resources', async t => {
  const temporary = await fixture(t);
  // Skip lifecycle scripts to avoid recursively running this test while packing.
  const output = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], ROOT).stdout);
  // npm 12 returns a name-keyed object; earlier npm versions return an array.
  const packed = Array.isArray(output) ? output[0] : output[NAME];
  const names = new Set(packed.files.map(file => file.path));
  for (const relative of await payloadFiles()) assert.equal(names.has(relative.split(path.sep).join('/')), true, relative);
  assert.equal(names.has('bin/frontend-feature-architecture.js'), true);
  for (const file of names) assert.equal(/^(tests|scripts|dist|\.github)\//.test(file), false, file);
  const project = path.join(temporary, 'consumer');
  await fs.mkdir(project);
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', path.join(temporary, packed.filename)], project);
  assert.equal(await exists(path.join(project, '.agents')), false, 'npm install must not install the skill as a side effect');
  const result = run('npm', ['exec', '--offline', '--', NAME, 'install', '--harness', 'all'], project);
  assert.match(result.stdout, /Skill installed/);
  for (const target of await destinations({ harness: 'all', project })) {
    for (const relative of await payloadFiles()) assert.deepEqual(await fs.readFile(path.join(target, relative)), await fs.readFile(path.join(ROOT, relative)));
  }
});

test('npx downloads a remote release tarball and installs without a registry account', async t => {
  const temporary = await fixture(t);
  const output = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], ROOT).stdout);
  const packed = Array.isArray(output) ? output[0] : output[NAME];
  const bytes = await fs.readFile(path.join(temporary, packed.filename));
  let requests = 0;
  const server = createServer((request, response) => {
    if (request.url !== `/${packed.filename}`) {
      response.writeHead(404).end();
      return;
    }
    requests += 1;
    response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': bytes.length });
    response.end(bytes);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const project = path.join(temporary, 'consumer');
  await fs.mkdir(project);
  const config = path.join(temporary, 'empty.npmrc');
  await fs.writeFile(config, '');
  const env = { ...process.env, npm_config_audit: 'false', npm_config_fund: 'false', npm_config_userconfig: config };
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === 'npm_config_dry_run' || /token/i.test(key)) delete env[key];
  }
  const url = `http://127.0.0.1:${server.address().port}/${packed.filename}`;
  env.npm_config_registry = `http://127.0.0.1:${server.address().port}/registry/`;
  const npmMajor = Number(run('npm', ['--version'], ROOT).stdout.trim().split('.')[0]);
  const remoteOptions = npmMajor >= 12 ? ['--allow-remote=all'] : [];
  const args = ['--yes', ...remoteOptions, '--cache', path.join(temporary, 'cache'), url, 'install', '--harness', 'all'];
  const { stdout } = await promisify(execFile)('npx', args, { cwd: project, env, timeout: 60000 });
  assert.match(stdout, /Skill installed/);
  assert.ok(requests > 0, 'npx must download the tarball from its URL');
  assert.equal(await exists(path.join(project, 'package.json')), false, 'npx must not add a project dependency');
  for (const target of await destinations({ harness: 'all', project })) {
    for (const relative of await payloadFiles()) assert.deepEqual(await fs.readFile(path.join(target, relative)), await fs.readFile(path.join(ROOT, relative)));
  }
});

test('release checks accept matching tags and reject a mismatched version', async () => {
  const check = path.join(ROOT, 'scripts/check.js');
  const manifest = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
  run(process.execPath, [check, '--release-tag', `v${manifest.version}`], ROOT);
  const mismatch = spawnSync(process.execPath, [check, '--release-tag', 'v0.0.0'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(mismatch.status, 1);
  assert.match(mismatch.stderr, /Release tag must match/);
});
