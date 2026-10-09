import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { NAME, ROOT, isWithin, payloadFiles } from '../lib/bundle.js';

const errors = [];
const files = await payloadFiles();
const skill = await readFile(path.join(ROOT, 'SKILL.md'), 'utf8');
const manifest = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const lockfile = JSON.parse(await readFile(path.join(ROOT, 'package-lock.json'), 'utf8'));
const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1];
if (!frontmatter) throw new Error('SKILL.md must start with YAML frontmatter');
// Validate this project's simple manifest convention, not arbitrary YAML syntax.
const fields = Object.fromEntries([...frontmatter.matchAll(/^([a-z-]+): (.+)$/gm)].map(match => [match[1], match[2]]));
if (fields.name !== NAME || manifest.name !== NAME) errors.push('Skill and npm package names must match');
if (!fields.description || fields.description.length > 1024) errors.push('Skill description must contain 1–1024 characters');
if (fields.license !== 'MIT' || manifest.license !== 'MIT') errors.push('Manifest licenses must match LICENSE');
if (!frontmatter.includes('  author: Artur Blaya') || manifest.author !== 'Artur Blaya') errors.push('Author attribution is missing');
const version = /^  version: "(\d+\.\d+\.\d+)"$/m.exec(frontmatter)?.[1];
if (version !== manifest.version) errors.push('Skill and npm versions must match');
if (lockfile.version !== manifest.version || lockfile.packages?.['']?.version !== manifest.version) errors.push('npm lockfile version must match package.json');
if (manifest.private !== true) errors.push('The release package must be protected from registry publication');
const { values } = parseArgs({ options: { 'release-tag': { type: 'string' } }, strict: true });
if (values['release-tag'] && values['release-tag'] !== `v${manifest.version}`) errors.push('Release tag must match the package and skill version');
if (manifest.scripts?.postinstall || manifest.scripts?.install || manifest.scripts?.preinstall) errors.push('Skill installation must be explicit, not an npm lifecycle side effect');

const markdown = [...files.filter(file => file.endsWith('.md')), 'README.md', 'CONTRIBUTING.md', 'docs/evaluation-cases.md', 'docs/releases.md'];
for (const relative of markdown) {
  const file = path.join(ROOT, relative);
  const text = (await readFile(file, 'utf8')).replace(/```[\s\S]*?```/g, '');
  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const link = match[1];
    if (link.includes('://') || link.startsWith('#') || link.startsWith('mailto:')) continue;
    const destination = path.resolve(path.dirname(file), link.split('#')[0]);
    let exists = false;
    try { exists = (await stat(destination)).isFile(); } catch { /* Report below. */ }
    if (!isWithin(destination, ROOT) || !exists) errors.push(`Broken or escaping link in ${relative}: ${link}`);
  }
}
for (const relative of files.filter(file => file.startsWith(`references${path.sep}`) && file.endsWith('.md'))) {
  if (!skill.includes(relative.split(path.sep).join('/'))) errors.push(`Reference not routed from SKILL.md: ${relative}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Skill manifest, npm metadata, documentation links, reference routing, and payload checks passed.');
}
