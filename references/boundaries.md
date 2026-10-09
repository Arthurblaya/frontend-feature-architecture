# Dependencies and integration

Contents: allowed imports; contracts; cross-feature workflows; permissions;
events and registries; cycles; runtime boundaries.

## Read the graph as dependencies

An arrow `A -> B` means A imports or statically depends on B. It does not describe
the direction in which values or events move at runtime. A feature can emit a
result to an application-supplied callback without importing the application.

| Importing code | May depend on | Must not depend on |
| --- | --- | --- |
| Shared foundation | Other shared foundations; appropriate external libraries | Features, application modules, executable entrypoints |
| Feature A | Feature A internals; shared foundations; appropriate external libraries | Feature B, application modules, executable entrypoints |
| Application | Features' intended public surfaces; shared foundations; application modules | Executable entrypoints as reusable libraries |
| Externally invoked entrypoint | Its authorized application wiring, feature surfaces, shared foundations | Other executable entrypoints as utility modules |

All allowed edges must also respect runtime compatibility and avoid cycles.
External libraries do not count as sibling features, but they can introduce runtime
requirements or initialization effects that need consideration.

Use application-to-application imports for composition helpers and layouts; maintain
an acyclic graph. Never make a feature import a route to access navigation or a
shared value. Pass navigation callbacks or move an independently reusable value to
its proper foundation.

## Feature surfaces and internals

Choose a deliberate public surface containing the smallest capabilities needed by
the application: an entry view, query, command, lifecycle factory, or input/output
contract. Internal views, state helpers, validators, and transport mapping stay
private by convention or through existing package mechanisms.

A public file such as `public.*` is useful, but not mandatory. Explicit documented
exports from selected modules can serve the same purpose. Prefer explicit exports
over exporting every file. Do not introduce a root barrel exposing all features.

An entrypoint does not grant permission for sibling features to import it. Public
means available to an authorized consumer, chiefly the application layer.

Within a feature, import internal files directly. Avoid importing the feature's own
public aggregation file from an internal module: it can create a cycle or load
unrelated implementations. Use existing aliases only when they already work; path
alias setup is not part of this architecture.

Do not combine server, client, worker, or platform-exclusive implementations into
one barrel. Module evaluation and bundling can load transitive dependencies even
when a caller needs only one export. Preserve lazy-loading boundaries; do not
eagerly import every feature during bootstrap if the project loads them on demand.

## Resolve cross-feature needs

When feature A appears to need feature B, identify exactly what A requires before
choosing an integration:

| Required dependency | Preferred integration |
| --- | --- |
| A value or snapshot | Application obtains it from B, maps it, and passes it to A |
| An action or query | Application supplies a narrow callback or capability implementation |
| Two views on one screen | Application renders both and owns their coordination |
| A generic algorithm or primitive | Extract an independently meaningful shared foundation |
| A cohesive workflow with many reciprocal rules | Reconsider whether A and B are one feature |
| An existing project-wide contract | Use that contract if its owner and semantics are appropriate |

Keep bridges narrow. Prefer `canSave`, `viewerId`, or `lookupSummary` over passing
an entire store, service container, session object, or sibling feature implementation.
The receiving feature defines the minimum it needs. The application implements the
bridge using other features' surfaces and maps models at the seam.

A dependency interface can stay local to the receiving feature when only its
application adapter implements it. Shared placement is useful when independent
consumers own the same contract. Interface extraction is not a requirement for a
single callback or simple value.

### Example: saved items needs catalog information

Saved items owns saved identifiers and its own interaction rules. Catalog owns item
metadata. The application reads catalog summaries and supplies them as display data,
or supplies a `lookupSummary` callback to saved items. Saved items must not import
catalog's query, types, or state, and catalog must not import saved items' store to
display a saved marker. The application can supply `isSaved` and `onSave` to the
catalog view if the feature's intended input contract supports them.

If a screen needs live updates, define how the bridge refreshes values, reports
loading and failure, and cleans up subscriptions. Passing a one-time snapshot does
not automatically satisfy a reactive data requirement.

## Permissions: separate facts from policy

The original example has a shared permissions module importing multiple features.
It is a known unfinished refactoring seam, not a rule to copy.

Keep a capability's policy with that feature. Have application orchestration obtain
external facts, then pass the minimum policy input:

```text
application workflow:
  limits = accountCapabilities.readLimits(viewerId)
  count = savedItems.readCount(viewerId)
  decision = savedItems.canAdd({ limit: limits.savedItems, count })
  mount savedItems.view({ decision, onAdd: applicationAddWorkflow })

saved-items policy:
  canAdd({ limit, count }) -> count < limit
```

For a real add operation, recheck relevant facts at the authoritative operation
boundary using the same policy semantics. A UI decision is a presentation aid;
it cannot authorize server mutations. If a client can only call a backend API,
the backend performs the authoritative authorization in its existing architecture.
This skill does not prescribe rewriting the backend.

Supply a capability callback when the check must happen later with fresh data.
Keep transaction and consistency behavior intact. Moving a check into a pure
function must not accidentally turn a fresh check into a stale snapshot or remove
an atomic limit check.

## Shared extraction is not a bypass

A module qualifies for shared extraction when its responsibility, vocabulary, and
dependencies are independent of a particular feature and there is concrete reuse
or an established foundation role. Moving `loadSavedItems` into `shared/services`
solely so catalog can import it changes the label, not the ownership.

Small similar functions can remain separate when their business meanings differ.
When semantics are identical and reuse is real, extract the minimal generic part,
preserve feature wrappers, and verify each existing consumer. Do not parameterize
a shared primitive with a growing list of feature names or branch on its caller.

## Events, registration, and dependency injection

Use events only when the project's existing lifecycle or asynchronous model calls
for them. Application composition connects publishers and subscribers. A shared
event primitive can be generic; it should not import feature handlers or eagerly
register all features.

Event payloads, error paths, ordering requirements, unsubscription, and ownership
must be explicit. An untyped global bus can hide coupling more effectively than
an import graph reveals it. Do not add one simply to bypass a prohibited import.

Apply the same rule to registries and dependency injection: generic mechanisms
may live in shared; concrete feature registrations belong in application assembly.
A shared registry that imports feature implementations violates the boundary.
Global service lookup also creates runtime coupling; prefer explicit dependencies
when it makes the relationship understandable.

## Detect and repair cycles

Inspect imports, re-exports, dynamic imports, registration side effects, and the
runtime assembly for changed modules. Common cycles include:

```text
feature -> shared adapter -> feature
feature internal -> feature public entry -> feature internal
application route -> feature -> application route
shared registry -> feature -> shared registry
```

Repair at the responsibility seam: move orchestration to application, extract a
small neutral contract, pass an input, or split an entrypoint. Do not merely replace
a static import with a dynamic import or type-only import and declare the cycle
resolved. Distinguish a runtime cycle from a source-level ownership dependency;
both can matter even when only one causes a build failure.

## Entry points and runtime safety

Bootstrap files, worker launchers, externally invoked handlers, and job runners are
entrypoints. Feature and shared code should not import them for helpers. Move reusable
logic into its owner and let the entrypoint call it. Respect each entrypoint's runtime:
a worker is not automatically allowed to import UI just because it is an entrypoint.

Inspect transitive exports when a boundary changes. A shared interface must not pull
in a server implementation; a client feature entry must not re-export privileged
code. Use the project's existing platform protections and runtime-safe serialization.
Do not trust a folder name to exclude modules from a bundle.
