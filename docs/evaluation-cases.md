# Behavioral evaluation cases

These are manual acceptance scenarios for evaluating the skill in a harness. They
are not a claim that all scenarios have been executed in all harnesses. Use an
isolated temporary project with representative files and its existing conventions.
Load [SKILL.md](../SKILL.md) and allow the agent to read its linked references.

For each run, record the harness and model version, input tree and prompt, actual
changes, commands run, result, and any unresolved issue. Judge real ownership and
imports rather than whether output headings match the guide.

## 1. New feature in an existing frontend

Prompt: add saved items with list, removal, label validation, and remote persistence.
The host has shared input/dialog primitives and a generic transport client.

Pass criteria: cohesive saved-items owner, feature-owned endpoint calls and rules,
reuse of existing foundations, application integration, no empty mandatory layers,
no framework replacement, and no lint configuration changes.

## 2. Cross-feature information

Prompt: catalog cards show a saved marker and allow saving. Catalog and saved items
already have separate owners and public queries.

Pass criteria: application supplies values and actions; no sibling imports, including
type-only imports; refresh and failure handling remain explicit. A public API must
not be treated as permission for direct sibling imports.

## 3. Shared permission exception

Input: a shared permission module fetches account limits and saved-item counts,
and the saved-items feature imports it.

Prompt: repair this boundary while preserving create behavior.

Pass criteria: localized saved-items policy, external facts supplied through
application orchestration or a narrow capability, no feature query moved into shared
as a bypass, and preserved authoritative enforcement and freshness.

## 4. Global-looking component

Input: shared header imports account and notifications queries.

Prompt: review this component's ownership; do not modify files.

Pass criteria: concrete shared-to-feature finding, application composition repair,
optional presentation frame only where useful, and no unsolicited migration.

## 5. Small feature

Prompt: add one local display preference using the existing storage capability.

Pass criteria: minimal files, correct preference ownership, existing storage reuse,
and no forced repository layer, global state library, or copied empty tree.

## 6. File migration

Input: saved-items UI, validation, and endpoint calls are scattered across technical
root folders, with route imports and tests using old paths.

Prompt: migrate only saved items, preserving behavior.

Pass criteria: complete coherent slice; importers, tests, and asset paths updated;
route remains an adapter; generic transport remains shared; unrelated features are
untouched; checks and remaining legacy violations are reported accurately.

## 7. Multiple runtimes

Input: a reporting aggregation entrypoint re-exports both portable UI and a privileged
server adapter. The client imports the aggregation entrypoint.

Prompt: repair the runtime boundary without rewriting the application.

Pass criteria: distinct safe surfaces or equivalent existing runtime mechanism,
transitive reachability examined, no client import of privileged implementation,
and preserved loading behavior.

## 8. Different platform, same ownership

Run the new-feature case against existing browser, device, and module-based frontend
projects with different file conventions.

Pass criteria: host framework and required registration paths preserved; the same
ownership model applied; examples do not turn into mandatory framework syntax;
platform-specific adapters are selected by application wiring.

## 9. Repository has explicit alternate boundaries

Input: project instructions explicitly permit one documented feature dependency.

Prompt: extend that integration.

Pass criteria: project instructions respected, deviation from this skill's default
model disclosed, no unrelated rewrite, and no claim of strict sibling independence.
