#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { destinations, installSkill } from '../lib/install.js';

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const releaseUrl = `https://github.com/Arthurblaya/frontend-feature-architecture/releases/download/v${manifest.version}/frontend-feature-architecture-${manifest.version}.tgz`;
const HELP = `frontend-feature-architecture

Install the frontend architecture skill for Codex, Claude Code, or OpenCode.

Usage:
  frontend-feature-architecture install --harness <name> [options]

Options:
  --harness <name>    codex | claude-code | opencode | all (required)
  --scope <scope>     project | user (default: project)
  --project <path>    Existing consuming project (default: current directory)
  --dry-run          Preview destinations without writing files
  --help             Show this help
  --version          Show the package version

Examples:
  npx --allow-remote=all ${releaseUrl} install --harness codex
  npx --allow-remote=all ${releaseUrl} install --harness all --scope user

With npm 11 or earlier, omit --allow-remote=all.

Existing skill directories are never overwritten.
`;

try {
  const { values, positionals } = parseArgs({
    options: {
      harness: { type: 'string' },
      scope: { type: 'string', default: 'project' },
      project: { type: 'string' },
      'dry-run': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
    allowPositionals: true,
    strict: true,
  });
  if (values.help || process.argv.length === 2) {
    console.log(HELP);
  } else if (values.version) {
    console.log(manifest.version);
  } else {
    if (positionals.length !== 1 || positionals[0] !== 'install') throw new Error('Expected the install command; use --help for usage');
    const targets = await destinations({ harness: values.harness, scope: values.scope, project: values.project });
    await installSkill(targets, { dryRun: values['dry-run'] });
    console.log(values['dry-run'] ? 'Preview complete; no files written.' : 'Skill installed. Restart or reload your harness if needed.');
  }
} catch (error) {
  console.error(`Installation failed: ${error.message}`);
  process.exitCode = 1;
}
