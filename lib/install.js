import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { NAME, ROOT, isWithin, payloadFiles } from './bundle.js';

export const PROJECT_DIRS = {
  codex: '.agents/skills',
  'claude-code': '.claude/skills',
  opencode: '.opencode/skills',
};

export async function destinations({ harness, scope = 'project', project, cwd = process.cwd(), home = os.homedir(), env = process.env }) {
  if (![...Object.keys(PROJECT_DIRS), 'all'].includes(harness)) throw new Error('Choose --harness codex, claude-code, opencode, or all');
  if (!['project', 'user'].includes(scope)) throw new Error('Choose --scope project or user');
  const harnesses = harness === 'all' ? Object.keys(PROJECT_DIRS) : [harness];
  if (scope === 'project') {
    const directory = path.resolve(cwd, project ?? '.');
    if (!(await fs.stat(directory)).isDirectory()) throw new Error(`Project is not a directory: ${directory}`);
    const resolved = await fs.realpath(directory);
    return harnesses.map(item => path.join(resolved, PROJECT_DIRS[item], NAME));
  }
  if (project !== undefined) throw new Error('--project is only valid with --scope project');
  const configHome = env.XDG_CONFIG_HOME || path.join(home, '.config');
  if (harnesses.includes('opencode') && !path.isAbsolute(configHome)) throw new Error('XDG_CONFIG_HOME must be an absolute path');
  const bases = {
    codex: path.join(home, '.agents/skills'),
    'claude-code': path.join(home, '.claude/skills'),
    opencode: path.join(configHome, 'opencode/skills'),
  };
  return harnesses.map(item => path.join(bases[item], NAME));
}

async function existsIncludingSymlink(file) {
  try {
    await fs.lstat(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function resolvedParent(directory) {
  try {
    return await fs.realpath(directory);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = path.dirname(directory);
    if (parent === directory) throw error;
    return path.join(await resolvedParent(parent), path.basename(directory));
  }
}

export async function installSkill(targets, { dryRun = false, log = console.log, copyFile = fs.copyFile, root = ROOT } = {}) {
  const files = await payloadFiles(root);
  const sourceRoot = await fs.realpath(root);
  // Preflight every destination before creating any selected installation.
  for (const target of targets) {
    if (await existsIncludingSymlink(target)) throw new Error(`Destination already exists; no files replaced: ${target}`);
    if (isWithin(await resolvedParent(path.dirname(target)), sourceRoot)) {
      throw new Error('Install into a consuming project or user skills directory, not this package checkout');
    }
    for (let parent = path.dirname(target); ; parent = path.dirname(parent)) {
      if (await existsIncludingSymlink(parent)) {
        if (!(await fs.stat(parent)).isDirectory()) throw new Error(`Destination parent is not a directory: ${parent}`);
      }
      if (path.dirname(parent) === parent) break;
    }
  }
  for (const target of targets) log(`${dryRun ? 'Would install' : 'Installing'} ${NAME} -> ${target}`);
  if (dryRun) return;
  const completed = [];
  try {
    for (const target of targets) {
      await fs.mkdir(path.dirname(target), { recursive: true });
      // Exclusive reservation protects pre-existing and concurrent installations.
      await fs.mkdir(target);
      completed.push(target);
      const staged = await fs.mkdtemp(path.join(path.dirname(target), `.${NAME}-`));
      try {
        for (const relative of files) {
          const output = path.join(staged, relative);
          await fs.mkdir(path.dirname(output), { recursive: true });
          await copyFile(path.join(root, relative), output);
        }
        for (const child of await fs.readdir(staged)) await fs.rename(path.join(staged, child), path.join(target, child));
      } finally {
        await fs.rm(staged, { recursive: true, force: true });
      }
    }
  } catch (error) {
    for (const target of completed.reverse()) await fs.rm(target, { recursive: true, force: true });
    throw error;
  }
}
