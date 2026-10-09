# Ownership and file placement

Contents: layers; feature sizing; directory shape; placement decisions; types and
state; UI and assets; infrastructure; runtime and platform adaptations.

## Three responsibilities

### Application: compose and start the product

The application owns bootstrap, route or screen registration, navigation wiring,
application layouts, dependency assembly, and workflows combining multiple features.
It chooses which feature capabilities to connect and supplies their inputs.

A route may read navigation parameters, resolve session context, call a feature's
public query, select a loading or empty branch, and mount its UI. It should not
implement feature validation, data transformations, domain permissions, persistence,
or editing state. Move those behaviors into their owner even if the current route
is their only consumer. Route-specific composition can remain near the route.

Thin means little business behavior, not an arbitrary line limit. A readable layout
combining several independent features may be longer than a feature's own UI file.

### Features: own a capability from UI to data access

A feature owns the behavior and vocabulary of a product capability. Its files may
include presentation, local state, commands, queries, permissions, types, validation,
transport mapping, assets, and tests. Feature ownership is architectural: these files
need not all be in one runtime bundle.

The feature implements its behavior using shared foundations. Its public surface
describes what application consumers can use without knowing internal details.
Consumers outside the feature belong to the application layer, not sibling features.

### Shared foundations: provide reusable building blocks

Shared code includes generic UI primitives, formatting, transport clients, platform
interfaces, configuration readers, and small stable contracts with real consumers.
It must make sense without knowing which feature is using it.

Shared does not mean every feature must use a module. It means the module has an
independent, reusable responsibility and no upstream imports. Application-specific
composition is not a shared foundation merely because it is used on many screens.

Framework-generated files, build configuration, and static public assets can remain
outside these source layers where required. Classify their role rather than forcing
every repository file into a frontend layer.

## Decide what a feature is

Use the product's vocabulary: `catalog`, `saved-items`, `account-settings`, or
`reporting`. Prefer an existing capability when the new behavior changes the same
rules, state, and user goal. Identify boundaries from responsibilities and change
patterns, not the number of folders.

Ask:

- What user or product outcome does this code implement?
- Which rules, data operations, and UI tend to change together?
- Can the capability expose a useful interface without reaching into a sibling?
- Would deleting the capability remove a coherent set of files and integrations?
- Are two proposed features actually one tightly coupled workflow?

One feature may appear on many routes. One route may compose many features. A
database entity may support several features; a feature may use several entities.
None of these relationships requires mirroring the router or persistence schema.

Keep small internal sub-capabilities under the owning feature. Nested folders are
internal organization, not automatically new independent boundaries. If independent
ownership is genuinely useful, promote them to sibling features and compose above
them. Do not call a parent folder a boundary while allowing arbitrary imports among
all its descendants and promising that those descendants are isolated.

## Directory shapes

Use this expanded shape as a vocabulary, not a scaffold:

```text
src/
  app/
    bootstrap.*
    routes/
    layouts/
    workflows/
  features/
    saved-items/
      public.*
      components/
      model/
      validation/
      data/
      assets/
  shared/
    components/
    formatting/
    transport/
    platform/
    config/
```

`.*` means the repository's actual language and file extension. Tests, styles,
templates, stories, and fixtures sit beside their owner or in its existing local
test convention. A modest feature can instead be:

```text
features/saved-items/
  public.*
  SavedItemsPanel.*
  saved-items-state.*
  saved-items-data.*
  saved-items-data.test.*
```

Established roots such as `components/`, `lib/`, `data/`, or `services/` can collectively
be the shared foundation; introducing `shared/` is optional. Do not duplicate
`utils/` and `lib/` with indistinguishable responsibilities.

Within a large feature, group by responsibility only as needed. For example,
`components/forms/` or `components/charts/` is useful when those groups contain
several related files. Do not replicate every root folder inside every feature.
Use the project's naming and casing consistently; names should identify purpose
rather than accumulate vague `common`, `base`, `misc`, or `helpers` buckets.

## Placement decision table

| Code | Owner | Reason |
| --- | --- | --- |
| Screen registration and navigation adapters | Application | Integrates capabilities with the runtime |
| Layout combining search, saved items, and identity | Application | Knows which features participate |
| Saved-item list, add/remove controls, and empty state | Saved-items feature | Implements one capability |
| Validation of a saved-item label | Saved-items feature | Expresses that capability's rule |
| Mapping saved-item transport records into feature models | Saved-items feature | Understands the feature's data |
| Generic network request executor | Shared transport | Understands transport, not product behavior |
| Saved-items endpoint path and retry policy specific to that operation | Saved-items feature | Specific data-access behavior |
| Generic accessible dialog or input primitive | Shared UI | Reusable presentation contract |
| Header retrieving account and notification data | Application composition | Coordinates feature-owned behavior |
| Header receiving only display values and navigation actions | Shared UI, if reusable | Independent presentation contract |
| Generic date or number formatter | Shared formatting | No feature vocabulary or imports |
| Saved-items eligibility rule | Saved-items feature | Business ownership remains local |
| Device storage wrapper | Shared platform | Generic platform capability |
| Saved-items storage keys and record migration | Saved-items feature | Specific persistence semantics |
| Test fixture containing saved-item records | Saved-items feature | Feature vocabulary |
| Generic fake clock used by multiple capabilities | Shared test support | Independent test capability |
| Executable scheduled job or external handler | Entrypoint / application adapter | Invoked externally, not imported by reusable modules |

For ambiguous files, inspect their imports and vocabulary. If a supposedly generic
module fetches feature data, chooses business policy, or coordinates named features,
it is not a shared foundation. Rename or relocate it, or split generic presentation
from application orchestration.

## Models, schemas, constants, and types

Keep feature models, validation schemas, query identifiers, commands, and constants
with that feature. A global `types/` folder must not become a catalogue of every
feature's types. Type-only imports still couple owners.

If the application bridges two different representations, map them in application
composition. Share a contract only when its semantics belong to a stable common
concept and there are actual independent consumers. Do not move an entire feature
model to shared solely to make a forbidden import possible.

Separate transport records from feature models when the representations differ.
Generated transport contracts can live with the transport infrastructure or their
generator's mandated location. Keep transformations expressing feature behavior in
the feature. Do not edit generated files or introduce generators just for structure.

## State and lifecycle

State belongs to the capability whose rules define it. Being globally registered
does not make a feature's state shared. The application may register feature state,
provide its lifecycle, and connect it to navigation or persistence; reducers,
selectors, actions, and state transitions remain feature-owned.

Keep ephemeral state at its smallest useful scope. Promote it within the feature
when multiple feature views need a consistent lifetime. Avoid two copies of the
same server data in unrelated stores. Cross-feature state coordination belongs in
application workflows using explicit inputs and outputs.

Do not require a new state library, container, observable system, or dependency
injection mechanism. Use the project's existing conventions to express ownership.

## UI, styles, assets, and translations

Keep UI and its styles, templates, presentation adapters, accessibility behavior,
and tests with its owner. Domain-specific UI used in several places remains in its
feature; the application imports it for each integration.

A shared visual primitive receives values and emits intent. It should not retrieve
feature records, use feature stores, or import feature-specific permissions. A
component that embeds such behavior belongs to the feature or application.

Feature illustrations and translation messages follow the feature's ownership.
Global themes, design tokens, fonts, and truly common messages follow shared or
application-wide styling conventions. If asset serving or translation tooling
requires a central directory, retain it and use clear namespaces; do not invent a
new asset pipeline to achieve physical colocation.

## Data access and platform infrastructure

Keep generic transport, storage, logging, and clock capabilities in shared modules.
Keep endpoint-specific calls, cache keys, optimistic updates, parsing, and feature
error translation in the feature. Shared transport must not invalidate named
feature caches or re-export feature repositories.

Feature business rules can be pure functions when that clarifies dependencies.
Do not impose a domain/service/repository layering scheme on every feature. Separate
files or interfaces when an actual testing, runtime, or integration need warrants it.

## Runtime and platform adaptations

Respect existing client, device, server, and worker boundaries. A server-rendered
frontend may colocate feature-owned server adapters in a distinct runtime folder;
a client-only frontend may have only network calls and no server implementation.
Do not introduce database access or backend folders into a client project.

Keep privileged data access, secrets, and platform-exclusive dependencies behind
runtime-specific entrypoints. Shared contracts and validation can cross runtimes
when their imports are safe. An otherwise permitted architectural dependency can
still be forbidden by runtime constraints.

For multiple platforms, share rules and contracts that have the same semantics.
Keep native or browser-specific UI and adapters in the project's supported platform
files or packages. Application wiring selects adapters. Do not duplicate business
policy per platform or require browser globals in portable code.

In a monorepo, these responsibilities can span packages. Package exports, source
imports, and workspace dependencies must preserve the same direction. A `shared`
package that imports a feature package still violates the model. Respect existing
package ownership and build constraints; creating a package per feature is optional.
