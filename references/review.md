# Review and completion checks

Contents: scope; ownership; dependency inspection; integration; runtime; validation;
findings. Use this for architectural reviews and for the changed portion of a feature.

## Establish the review scope

Read the relevant source, not only its tree. Identify whether the request covers a
feature, a change set, or the whole frontend. For a focused review, follow relevant
transitive dependencies without turning the task into an unrelated full audit.

Compare actual behavior to the model in [architecture](architecture.md) and
[boundaries](boundaries.md). Existing project instructions take precedence; call
out material deviations rather than silently imposing a conflicting convention.

## Ownership questions

- Does each feature correspond to a coherent capability?
- Are its rules, UI, state, validation, and data operations findable with that owner?
- Are domain-specific files still hiding in global components, types, services, or
  utilities directories?
- Are routes and bootstrap modules composing behavior or implementing feature rules?
- Are shared modules independent of feature vocabulary and implementations?
- Have role folders been created because they help navigation, or only to match a
  template?
- Does reuse across screens preserve feature ownership?

The presence or absence of a literal `shared/` folder is not a finding on its own.
A missing public barrel is not automatically a defect. Evaluate the actual surface
and its consumers.

## Inspect actual dependency edges

For changed or suspicious files:

1. Read imports, exports, re-exports, and initialization behavior.
2. Classify source and target by owner and runtime.
3. Follow aliases, aggregation files, and shared adapters to their real implementation.
4. Check static, dynamic, and type-only dependencies for ownership violations.
5. Check concrete registry, event, store, and dependency assembly for hidden coupling.
6. Look for cycles and imports of executable entrypoints.

Text search helps find candidates, but it does not prove the whole graph is clean.
State the inspection scope. No new lint or dependency-enforcement tooling is needed.

## Integration and contracts

- Does the application supply cross-feature inputs and callbacks?
- Do bridges expose the minimum values and capabilities required?
- Do feature surfaces leak private state, transport records, or implementation helpers?
- Is a supposed shared contract genuinely neutral, or just a moved feature model?
- Do loading, failure, cancellation, refresh, and cleanup still work across the seam?
- Do permission decisions retain fresh facts and authoritative enforcement?
- Are generic UI primitives coupled to feature stores or queries?

Avoid proposing a bus, service locator, or an interface for every function. Recommend
the smallest structural change that repairs a concrete ownership problem.

## Runtime and operational boundaries

- Can client or device imports transitively reach secrets or privileged code?
- Are worker and platform surfaces compatible with their runtimes?
- Are server and client exports mixed in a single entrypoint?
- Have changes preserved lazy loading and initialization order?
- Do required registration, routing, generated files, assets, and package exports
  still resolve?

Architectural independence reduces local coupling. It does not guarantee that
changing a shared foundation, backend contract, or feature public API has no
application-wide effect.

## Verification evidence

Use the project's relevant existing behavioral tests, type checks, and builds.
When behavior changes, tests should exercise meaningful rules or integration,
including failure cases where relevant. For file moves, resolution and runtime
entry checks can be more useful than new tests asserting directory names.

Record what ran and what passed or failed. If no runtime checks were possible,
say the result is an architectural inspection and name the unresolved verification.
Do not imply that a clean tree proves behavioral correctness.

## Report useful findings

For each issue, provide a concrete file or import edge, the consequence, and the
smallest repair. Prioritize actual runtime leaks, cycles, and policy failures over
cosmetic naming preferences. Separate existing exceptions from newly introduced
problems when reviewing a change.

Example finding:

```text
shared/components/AccountHeader.* imports features/account/account-data.*.
The shared UI now depends on a feature and pulls its data lifecycle into every
consumer. Move the fetching header to application layout composition, and retain
a shared presentation frame only if it has an independent reuse case.
```

For a review-only request, finish with findings and their scope. For an implementation,
repair the in-scope issues, then summarize ownership, integration, evidence, and
remaining limitations. Do not claim perfect organization or complete isolation.
