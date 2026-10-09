# Implement a feature

Contents: inspect; define ownership; plan files; implement; integrate; verify;
deliver. Scale the process to the change. A small extension does not require a new
architecture document or extra layers.

## 1. Inspect the working project

Read project instructions and inspect:

- Source roots, package boundaries, naming, route or screen conventions.
- A comparable feature and its integration point.
- Existing shared UI, transport, configuration, and platform adapters.
- The current state and data lifecycles, including registration and cleanup.
- Client, device, server, and worker boundaries relevant to the request.
- Existing tests and available behavioral, type, and build commands.

Use actual imports and consumers to understand ownership. A root `services` directory
may contain both shared transport and feature-specific calls; do not treat its entire
contents as reusable. Check the working tree and preserve unrelated user changes.

If the request leaves a product behavior unresolved, ask the smallest necessary
question while continuing independent work. Resolve routine folder and naming
choices from the project; do not ask the user to design the whole architecture.

## 2. Define the capability and its seam

Describe the capability in one sentence, then identify:

| Decision | Record briefly |
| --- | --- |
| Owner | Existing feature to extend or new feature and why |
| Responsibilities | UI, rules, state, validation, data access in scope |
| Inputs | Values and capabilities supplied from outside |
| Outputs | Results, user intent, commands, or callbacks |
| Foundations | Existing reusable modules needed |
| Integration | Application route, screen, registration, or workflow |
| Runtime | Where each implementation can execute |

This can be a short progress note. Create a persistent design note only when the
project requires one or the decision is substantial enough to benefit future work.

Name a feature after its capability. Extend the existing owner when implementing
another form, query, or view of the same capability. Introduce a separate owner
when its semantics and change patterns are sufficiently independent.

## 3. Choose the smallest useful file plan

Start with the actual files the implementation needs. For example:

```text
features/saved-items/
  public.*                  application-facing capabilities
  SavedItemsPanel.*         feature UI
  saved-items-state.*       interaction state, if needed
  saved-items-data.*        feature-specific reads and writes
  saved-items-validation.*  label rules, if needed
app/routes/saved-items.*    route adapter and composition
```

If data access is already provided by an appropriate existing feature module, extend
it. Do not add a repository abstraction, schema library, global store, public barrel,
or dependency injection container merely to match this tree.

Keep tests and associated assets near their owner according to existing conventions.
Before adding anything to shared, identify its independent responsibility and its
actual consumers. Before adding an import, check it against the boundary matrix.

## 4. Implement the feature-owned behavior

Keep domain rules and transformations independent of route code. Keep feature state
and validation in the feature even if they currently have only one UI consumer.
Use shared primitives without embedding feature behavior in those primitives.

For data operations, keep endpoint paths, payload mapping, query identifiers,
cache behavior, and optimistic transitions with the feature. Reuse the established
generic transport. Preserve request cancellation, failure propagation, stale-result
handling, and cleanup where the existing lifecycle requires them.

Expose only the capabilities the application needs. A small feature may expose a
single UI entry and a command; an operation-only feature may expose no UI at all.
Match the existing language and extension rather than translating the project into
a preferred framework or programming model.

## 5. Integrate through the application

Register the route, screen, module, or feature lifecycle where the runtime requires.
Keep the integration file responsible for navigation inputs, dependency assembly,
layout, and cross-feature orchestration.

When external facts are required, obtain them through the other feature's public
capability in application composition and pass a minimal value or callback. Adapt
types at the seam. Do not import a sibling just because its API is public.

Ensure the bridge supports the needed lifetime: initial data, reactive changes,
refresh after mutations, error propagation, and subscription disposal. Do not pass
entire stores when a value and an action suffice.

Maintain lazy loading and platform selection where the project uses them. A new
public entrypoint must not pull a server implementation into the client or force
unrelated features to initialize eagerly.

## 6. Verify behavior and ownership

Read [review](review.md) and apply the relevant checks to the changed dependency
subgraph. Verify both imports into the feature and imports from its new surface.

Use meaningful existing checks: tests for changed rules, data operations, and
integration; type checks where applicable; builds when imports, packaging, routing,
or runtime reachability changed. Do not write tests that only assert folder names
or mirror a trivial implementation.

Run the configured checks appropriate to the change without adding enforcement
tooling. If a check cannot run, report the command and the limitation. Existing
unrelated failures do not prove the new structure is valid or invalid; distinguish
them from failures introduced by the change.

## 7. Deliver the concrete result

Finish the requested feature, not merely a folder proposal. Explain:

- Its owning feature and the reason for that boundary.
- The application integration and any value or callback bridge.
- Shared code reused or extracted, with its independent responsibility.
- Behavioral, type, build, and import inspection results.
- Any relevant legacy exception left outside scope.

Do not promise perfect isolation from all changes. Features still share foundations,
backend contracts, and application integration. Describe the actual dependencies
and the scope of validation.
