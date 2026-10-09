# Migrate an existing frontend

Contents: classify; choose a slice; move; repair seams; preserve runtime behavior;
verify and report. Migrate only the scope the user authorized.

## Classify current ownership

Inspect both the source tree and the dependency graph. Inventory the capability's
UI, state, rules, data access, validation, assets, tests, and application integrations.
Search for all consumers of files that will move, including tests, stories, dynamic
imports, re-exports, registries, and side-effect registration.

Classify each file or responsibility:

| Classification | Destination |
| --- | --- |
| Specific to the capability | Owning feature |
| Independently reusable foundation | Existing shared root or shared directory |
| Connects capabilities or binds the runtime | Application composition |
| Externally executed bootstrap or handler | Entrypoint location required by the runtime |
| Generated or tool-owned artifact | Existing required location |

A mixed file may need a split before moving. A transport client and a feature-specific
endpoint function in the same file have different owners. Moving the whole file
to shared preserves feature leakage; moving it all to a feature can strand legitimate
shared consumers.

Use a concise movement plan when useful:

```text
current components/SavedItemsPanel.* -> features/saved-items/SavedItemsPanel.*
current services/saved-items.*       -> features/saved-items/saved-items-data.*
current utils/saved-label.*          -> features/saved-items/saved-items-validation.*
current pages/saved-items.*          -> stays as route adapter
current services/http-client.*      -> stays as shared transport
```

## Select a coherent slice

Prefer one feature and its integrations over moving one technical category across
every feature. Moving only UI while leaving its rules and data access scattered
does not produce a complete ownership boundary.

For a whole-project migration, sequence independent feature slices and keep the
application runnable between them. For a feature request, migrate only the pieces
needed by that feature and disclose larger legacy issues. Do not expand a small
request into a repository-wide architecture rewrite.

Preserve existing naming, package layout, and routing constraints when possible.
Do not introduce path aliases, state libraries, generators, or build tools purely
to accommodate the migration.

## Separate relocation from behavioral repair

First move cohesive files and update their importers, exports, tests, and asset paths.
Keep behavior intact where it is already correctly separated. Avoid unrelated
renaming, formatting, and redesign in a relocation change.

Then repair seams that cannot be fixed by relocation:

- Shared modules importing feature queries or state.
- Sibling features reaching into one another's internals.
- Feature rules embedded in routes.
- Global permission logic fetching facts from several features.
- Shared registration files eagerly importing feature implementations.

Move orchestration above features, pass minimum inputs or callbacks, and split
generic mechanisms from concrete wiring. Read [boundaries](boundaries.md) for the
appropriate bridge. A permission function may need a signature change to accept
facts rather than fetch them; call sites must supply those facts with the required
lifetime and authorization semantics.

## Temporary compatibility paths

An old root path re-exporting a feature can hide a shared-to-feature dependency.
Prefer updating consumers within the authorized migration. If a temporary shim is
necessary for an external consumer, classify it explicitly as a compatibility adapter,
restrict its consumers to authorized application integrations, and document its
removal condition. Do not call the resulting graph fully compliant.

Avoid circular re-exports and broad wildcard barrels. Do not keep two authoritative
implementations of the same behavior. Remove an obsolete path only after verifying
its actual consumers have been updated.

## Preserve runtime behavior while moving

Check consequences beyond static imports:

- Route discovery, navigation names, module registration, and dependency assembly.
- Lazy imports, package exports, build inclusion, and side-effect initialization.
- Styles, assets, translation namespaces, and relative resource paths.
- Client/server/device/worker entrypoint reachability.
- State registration keys, persisted identifiers, and cache invalidation behavior.
- Tests and tool configuration already responsible for resolving moved modules.

Paths can be behavioral contracts when a runtime discovers modules by location.
Retain required adapters and relocate their feature behavior behind them. A file
move must not silently invalidate stored data, change a public route, or expose a
privileged implementation through a newly shared barrel.

## Finish and verify

Inspect the migrated dependency subgraph and all changed consumers. Use existing
tests, type checks, and builds appropriate to the moved files. Verify a representative
application entry still integrates the feature correctly.

Delete obsolete files and empty source folders only when they are no longer used.
Do not delete unrelated user work. Report new ownership, repaired integration seams,
commands run, observed results, and remaining exceptions. Distinguish a completed
feature slice from a fully migrated repository.
