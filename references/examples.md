# Framework-neutral examples

Contents: small feature; expanded feature; cross-feature composition; permissions;
global-looking UI; shared extraction; platform adapters; runtime-safe surfaces.

All code below is pseudocode. File extensions, imports, rendering, lifecycle APIs,
and registration adapt to the host project. The examples prescribe ownership and
dependency direction, not a framework or executable starter project.

## A. Extend a small feature

Request: add an editable label to saved items.

```text
features/saved-items/
  public.*
  SavedItemsPanel.*
  saved-items-data.*
  saved-items-validation.*
  saved-items-validation.test.*
app/routes/saved-items.*
```

The existing owner remains `saved-items`. Label editing is not a new `forms` feature.
Validation belongs next to saved-item behavior. The panel handles feature-local
editing UI. The application route mounts the panel and supplies navigation context.
Generic input and error presentation can reuse shared primitives.

```text
validateLabel(input):
  normalized = trim(input)
  if normalized is empty: return invalid("A label is required")
  return valid(normalized)

renameSavedItem(id, input, dataAccess):
  label = validateLabel(input)
  if label is invalid: return label
  return dataAccess.rename(id, label.value)
```

Do not add `components/forms/` unless the actual contents benefit from that grouping.
Do not move the validation into global utilities because another screen also uses
the saved-items editor. Both integrations import the saved-items surface from
application code.

## B. Expand a feature when its contents justify it

Request: reporting has several charts, filters, and export operations.

```text
features/reporting/
  public.*
  components/
    ReportPanel.*
    charts/
      DailyTotalsChart.*
      RegionalTotalsChart.*
    filters/
      ReportPeriodFilter.*
  model/
    report-period.*
    reporting-state.*
  data/
    load-report.*
    export-report.*
    report-record-mapping.*
  validation/
    report-filter-validation.*
```

All files understand reporting semantics. Shared chart primitives may provide
axes, layout, and formatting, but reporting-specific aggregation, legends, query
parameters, and export mapping remain here. A chart primitive must not import
`load-report` to be convenient.

Expose the report entry view and any query the application genuinely needs. Avoid
exporting every chart, validator, and transport mapping.

## C. Compose catalog and saved items

Incorrect dependency:

```text
features/catalog/components/ItemCard.*
  imports features/saved-items/saved-items-state.*
```

Correct ownership:

```text
app/workflows/catalog-with-saved-items.*
  imports catalog public capabilities
  imports saved-items public capabilities

createCatalogScreen():
  saved = savedItems.readIdentifiers()
  items = catalog.readItems()

  return catalog.createView({
    items,
    savedIdentifiers: saved,
    onSave: itemId -> savedItems.saveIdentifier(itemId)
  })
```

Catalog accepts identifiers and emits user intent. It does not know the sibling
feature's storage, state library, or persistence schema. Saved items receives the
identifier value and applies its own rules. The application owns refresh after a
successful save and any application-wide notification.

If the catalog view requires live saved markers, the application uses the existing
subscription or reactive mechanism and disposes it with the screen. If a save fails,
the result reaches the owning UI instead of being swallowed by the bridge.

When saved items displays catalog summaries, map them to its own display contract:

```text
application mapping:
  catalog result { id, title, currentPrice, internalMetadata }
    -> saved-items input { itemId: id, label: title }
```

Do not import catalog's entire item model into saved items for two fields. A truly
shared identifier contract can already exist in foundations, but no new global
model folder is required for this mapping.

## D. Move a permission to its owner

Incorrect: `shared/permissions.*` imports account, saved items, and reporting to
calculate all feature permissions. Features then import that shared file.

Prefer:

```text
features/saved-items/model/can-add-item.*
  canAddItem({ itemCount, maximumItems }) -> itemCount < maximumItems

app/workflows/add-saved-item.*
  obtains current account limits
  obtains current saved-item count
  calls saved-items policy and command
```

The feature owns the meaning of the limit; the application coordinates external
facts. A generic button receives disabled state rather than fetching an account
subscription. The authoritative mutation still enforces the limit with appropriate
freshness and concurrency guarantees. The UI's earlier calculation does not replace
that check.

## E. Distinguish shared presentation from application UI

A header appearing on every screen is not automatically a foundation.

```text
shared/components/HeaderFrame.*
  accepts brand, userLabel, notificationCount, onOpenAccount

app/layouts/ApplicationHeader.*
  imports HeaderFrame
  imports account public query
  imports notifications public query
  obtains values and wires actions
```

The frame can be shared if its presentation contract is independently useful. The
concrete header is application composition. If no separate consumer or abstraction
benefit exists, keep the whole header in the application rather than creating a
shared frame solely to increase the number of layers.

## F. Extract identical semantics, preserve different policies

Two features formatting numbers with the same locale semantics can use
`shared/formatting/format-number.*`. Two features both having `calculateTotal` are
not necessarily candidates for shared extraction: one may include tax and the other
may sum a report interval. Naming similarity does not establish semantic reuse.

When extraction is justified:

```text
shared/formatting/format-number.*      locale-aware presentation only
features/reporting/model/format-total.*
  imports shared formatter
  decides reporting precision
features/catalog/model/format-price.*
  imports shared formatter
  decides price precision
```

Keep feature decisions in the feature wrappers. The shared formatter must not
branch on `featureName` or fetch feature settings.

## G. Separate portable behavior from platform adapters

Request: saved items must persist on both a device and a browser.

```text
shared/platform/key-value-store-contract.*
shared/platform/browser-key-value-store.*
shared/platform/device-key-value-store.*
features/saved-items/data/saved-items-storage.*
app/bootstrap.*
```

The application chooses the runtime implementation. Shared adapters know how to
store generic values; saved items owns keys, serialization, versioning, and the
meaning of stored records. Platform files use the host project's resolution rules.
Do not import a device library into a browser surface or require a browser global
in the shared contract.

If storage policy is simple, use the established storage capability directly rather
than inventing a second interface. The boundary is about dependency ownership,
not requiring dependency injection syntax.

## H. Keep surfaces safe for their runtime

An application with privileged server execution might use:

```text
features/reporting/
  public-client.*         UI and portable contracts
  public-server.*         privileged reporting operations
  components/
  model/
  server/
```

A client integration imports only `public-client`. A server integration imports
`public-server`. Internal shared contracts must not depend on server code. Do not
add this split to a client-only app whose reporting data is supplied by a remote
API; it needs feature-specific network calls instead.

If a framework provides a special server-call mechanism, use its established
serialization and runtime protections. The architecture does not permit ordinary
client imports of privileged implementations.
