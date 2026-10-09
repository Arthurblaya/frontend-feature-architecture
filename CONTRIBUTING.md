# Contributing

Thank you for helping improve Frontend Feature Architecture. Contributions should
make a concrete ownership decision or installation workflow easier to understand
and apply.

Keep the skill framework-independent, specific enough to guide real placement and
dependency decisions, and compatible with the portable Agent Skills format.

## Propose a change

For a bug, include the observed behavior, reproduction steps, affected skill version,
and relevant environment. For guidance changes, include a concrete frontend scenario
and explain the decision the skill should help make. The repository's issue forms
provide space for these details.

Keep pull requests focused on one coherent problem. Explain the resulting behavior
and the evidence used to validate it. Avoid changing unrelated guidance or imposing
a framework, dependency, or folder scaffold on consuming projects.

## Architecture guidance

- Preserve feature ownership and one-way dependencies across shared, feature, and
  application responsibilities.
- Use original framework-neutral examples. Existing project syntax remains a host
  concern, not a skill requirement.
- Add detail when it resolves a real ambiguity; avoid duplicate rules, empty folder
  templates, and mandatory abstraction layers.
- Keep the entrypoint concise and route substantial guidance to references.
- Do not add ESLint configuration, plugins, or setup instructions.
- Distinguish source observations from this project's additional recommendations.
  Update [sources](references/sources.md) when source research changes.

## Distribution changes

Keep one canonical payload. Installation and packaging must preserve every linked
reference, UI metadata, license, and attribution. Do not overwrite existing user
installations or bundle research transcripts, application source copies, caches,
credentials, or repository development tooling in the installed skill.

Recheck official harness documentation before changing discovery paths. Explain the
supported version or documentation date and any limits to verification.

## Verify a contribution

```bash
npm ci --ignore-scripts
npm run check
npm test
npm pack
```

For meaningful instruction changes, run the relevant
[evaluation cases](docs/evaluation-cases.md) in a temporary project and examine the
actual proposed or generated files. Record the harness, model, prompt, outcome, and
remaining limitations. Automated packaging checks do not evaluate architecture quality.

Describe the concrete problem, changed behavior, and validation in a contribution.
Keep `metadata.version` in `SKILL.md`, `package.json`, and `package-lock.json` in sync
for a release. See [releases](docs/releases.md) for the release procedure.

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>(optional-scope): <description>
```

| Type | Use |
| --- | --- |
| `feat` | New skill capability or installer behavior |
| `fix` | Correct an instruction or installer defect |
| `docs` | Documentation and examples |
| `test` | Distribution tests or behavioral evaluation cases |
| `ci` | Validation and release workflows |
| `chore` | Repository maintenance |

Useful scopes include `skill`, `cli`, `docs`, and `release`. Describe the concrete
result in the subject, for example `fix(cli): preserve existing skill directories`.
Use `!` and a `BREAKING CHANGE:` footer for an incompatible change.
