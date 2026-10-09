import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const NAME = 'frontend-feature-architecture';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const PAYLOAD_FILES = ['SKILL.md', 'LICENSE', 'NOTICE'];
export const PAYLOAD_DIRS = ['references', 'agents'];

export function isWithin(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export async function payloadFiles(root = ROOT) {
  const files = [];
  async function visit(relative) {
    const absolute = path.join(root, relative);
    const stat = await lstat(absolute);
    if (stat.isSymbolicLink()) throw new Error(`Symlinks are not allowed in the payload: ${relative}`);
    if (stat.isDirectory()) {
      const children = (await readdir(absolute)).sort();
      for (const child of children) await visit(path.join(relative, child));
    } else if (stat.isFile()) {
      files.push(relative);
    } else {
      throw new Error(`Unsupported payload entry: ${relative}`);
    }
  }
  for (const relative of PAYLOAD_FILES) {
    if (!(await lstat(path.join(root, relative))).isFile()) throw new Error(`Missing regular payload file: ${relative}`);
    await visit(relative);
  }
  for (const relative of PAYLOAD_DIRS) {
    if (!(await lstat(path.join(root, relative))).isDirectory()) throw new Error(`Missing payload directory: ${relative}`);
    await visit(relative);
  }
  return files;
}
