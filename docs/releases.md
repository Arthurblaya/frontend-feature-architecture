# GitHub releases

Distribute the installer as a versioned `.tgz` asset on the public
[GitHub repository](https://github.com/Arthurblaya/frontend-feature-architecture).
Users run that asset with `npx`, which downloads it and executes the package's CLI.
The asset contains the complete skill and installer, with no third-party dependencies.

The package uses the standard npm tarball format. Installation uses the public
release asset directly and does not require a registry account or authentication.
The supported installer environment is Node.js 22+ with npm.

## Prepare a release

Keep `package.json`, `package-lock.json`, and `metadata.version` in `SKILL.md` in sync.
Release tags use `v` followed by that version, for example `v1.0.0`.
Update the versioned installation URLs in the README when preparing a new release.

From the repository root:

```bash
npm ci --ignore-scripts
npm run check -- --release-tag v1.0.0
npm pack
```

`npm pack` runs the repository checks and tests through `prepack`. It produces
`frontend-feature-architecture-1.0.0.tgz`. The allowlist includes the installer, its
libraries, the skill, all references, UI metadata, license, attribution, and documentation.
It excludes tests, development scripts, CI configuration, research transcripts, caches,
and previous build artifacts.

The tests exercise the packed artifact in an isolated consumer project, including
downloading a tarball over HTTP and executing its CLI with `npx`.
They verify installation into all three supported harness directories.

## Publish the version

Review and commit the release content using the project's normal Git workflow.
For a release whose content is already committed on `main`:

```bash
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

The release workflow runs checks and tests on Node.js 22 and 24, verifies that the
tag matches the package version, builds the tarball, and creates a GitHub Release
with the asset attached. It uses the workflow's GitHub token with repository content
write permission; no additional publishing account or token is needed.

Wait for the workflow to succeed and verify the attached asset on the
[releases page](https://github.com/Arthurblaya/frontend-feature-architecture/releases).
Do not move a released tag to different source content or replace its asset.

## Verify installation

From an existing disposable consumer project (omit `--allow-remote=all` with npm 11
or earlier):

```bash
npx --allow-remote=all https://github.com/Arthurblaya/frontend-feature-architecture/releases/download/v1.0.0/frontend-feature-architecture-1.0.0.tgz --version
npx --allow-remote=all https://github.com/Arthurblaya/frontend-feature-architecture/releases/download/v1.0.0/frontend-feature-architecture-1.0.0.tgz install --harness codex --dry-run
npx --allow-remote=all https://github.com/Arthurblaya/frontend-feature-architecture/releases/download/v1.0.0/frontend-feature-architecture-1.0.0.tgz install --harness codex
```

The installer refuses to overwrite an existing skill. Verify the files and load the
skill in the harness. Node and npm are required for installation, not for reading
the installed skill afterward.

## Release an update

Choose an appropriate semantic version and update npm metadata without an automatic
Git tag:

```bash
npm version patch --no-git-tag-version
```

Use `minor` or `major` when appropriate. Set the same `metadata.version` in `SKILL.md`,
update the README's URLs, and repeat the release preparation with the new version.
Commit the result, create the matching tag, and push it to run the release workflow.
Users explicitly update their harness copy; downloading a new installer does not
overwrite an existing skill.

## Implementation references

- [npm package sources](https://docs.npmjs.com/cli/v11/using-npm/package-spec/): remote tarball URLs are supported package specifications.
- [npm remote-download configuration](https://docs.npmjs.com/cli/v12/using-npm/config/#allow-remote): npm 12 requires an explicit opt-in for remote tarball sources.
- [npm exec / npx](https://docs.npmjs.com/cli/v11/commands/npm-exec/): execute a package's exposed CLI without adding it as a project dependency.
- [GitHub release creation](https://cli.github.com/manual/gh_release_create): attach the built asset to an existing verified tag.
