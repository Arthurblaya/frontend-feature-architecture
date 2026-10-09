---
name: frontend-feature-architecture
description: Organize frontend code by feature with explicit ownership and one-way dependencies. Use when adding a frontend feature, deciding file placement, reviewing architecture, or migrating a frontend folder structure across web, mobile, and desktop projects.
license: MIT
metadata:
  author: Artur Blaya
  version: "1.0.0"
  source-author: Kyle Cook (Web Dev Simplified)
  source-video: https://www.youtube.com/watch?v=xyxrB2Aa7KE
  source-repository: https://github.com/WebDevSimplified/parity-deals-clone/tree/feature-folder-structure
---

# Frontend Feature Architecture

Organize code around the product capabilities it implements. Keep each feature's UI,
rules, state, validation, and data access together; keep reusable foundations separate;
use the application layer to compose them. Apply this to the project's existing
language, framework, platform, and tooling.

## Required reading

Before making architectural decisions, read
[architecture](references/architecture.md) for ownership and file placement and
[boundaries](references/boundaries.md) for dependency rules and integration.
Then read only the resources needed for the current request:

| Request | Read |
| --- | --- |
| Add or extend a feature | [Feature workflow](references/feature-workflow.md) |
| Resolve a placement or integration ambiguity | Relevant case in [examples](references/examples.md) |
| Move an existing project toward this structure | [Migration](references/migration.md) |
| Review architecture or finish an implementation | [Review](references/review.md) |
| Check original claims, provenance, or known source exceptions | [Sources](references/sources.md) |

Resolve these paths relative to this skill's directory. The skill works offline;
source links are attribution, not required runtime dependencies.

## Core rules

1. **Assign ownership before choosing a directory.** A feature is a cohesive product
   capability, not a file type, route, database table, or individual UI element.
   Put code in the narrowest meaningful owner. Do not create a new feature for every
   button, form, or endpoint.
2. **Keep feature-specific code within its feature.** Reuse across two screens does
   not make a feature's code application-wide shared code.
3. **Keep shared foundations independent.** Shared code may depend on other shared
   code; it must not import a feature, application module, or executable entrypoint.
4. **Keep sibling features independent.** A feature may import its own internals and
   shared foundations. It must not import another feature or the application layer,
   even through a public entrypoint, type-only import, registry, or re-export.
5. **Compose above features.** Application modules may import feature contracts and
   shared foundations. Supply cross-feature data and dependencies there through
   values, callbacks, or small capability interfaces.
6. **Make the dependency graph acyclic.** Folder names and import aliases do not
   establish isolation. Follow transitive imports, side effects, and runtime wiring.
7. **Create only useful structure.** A small feature may have two files. Add role
   folders when their actual contents make navigation easier; never scaffold empty
   directories or mandatory layers.
8. **Keep runtime boundaries real.** Client and device code must not transitively
   load server secrets or privileged implementations. Use the platform's existing
   boundary mechanisms and separate entrypoints when necessary.

Dependency arrows below mean **imports / depends on**, not runtime data movement:

```text
application ──> feature A ──> shared foundations
     │      └─> feature B ──> shared foundations
     └─────────────────────> shared foundations

feature A  -X-> feature B
shared     -X-> features or application
features   -X-> application
```

## Workflow and scope

Inspect the existing project instructions, source tree, imports, runtime targets,
entrypoints, test conventions, and a comparable feature. Identify the requested
capability and the files it should own. Explain the planned ownership and integration
briefly, then implement within the user's scope.

Use existing folder names when they express the same responsibilities. A literal
`shared/` folder, `index` file, `src/` root, or particular extension is not required.
Respect framework-required route, module, registration, and generated-file locations;
keep those files as integration adapters and place feature behavior with its owner.

For existing violations, fix the dependencies needed by the current change and
report remaining issues accurately. Do not rewrite unrelated features or claim that
moving files alone removed coupling. If a repository explicitly mandates different
dependency rules, follow its instructions and disclose the difference from this model.

Do not add or configure ESLint, lint plugins, import-enforcement tooling, or lint
configuration as part of this skill. Verify architecture by inspecting code and
imports and running relevant existing behavioral, type, and build checks.

For review requests, report findings without applying a migration unless requested.
For implementation requests, finish the requested code and its necessary integration;
do not stop at a suggested tree. Close with what changed, where the feature lives,
how it connects, what was verified, and any material unresolved boundary.

## Attribution

The frontend organization approach comes from **Kyle Cook / Web Dev Simplified**, his
[video](https://www.youtube.com/watch?v=xyxrB2Aa7KE), and the
[example repository](https://github.com/WebDevSimplified/parity-deals-clone/tree/feature-folder-structure).
**Artur Blaya** adapted the source material into this skill and maintains its distribution.
The detailed workflows and neutral examples are this skill's adaptation. See
[sources](references/sources.md) and [NOTICE](NOTICE) for provenance.
