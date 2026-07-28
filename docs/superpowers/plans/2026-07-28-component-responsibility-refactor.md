# Component Responsibility Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize Pantry's production code so each file has one primary reason to change while preserving all current UI, URLs, data contracts, messages, and runtime behavior.

**Architecture:** Routes become connection layers that own route declaration, validation, loader startup, and screen wiring. Domain UI and use cases live in shallow feature folders, shared UI lives under `src/shared/components`, and dependencies flow from `route -> feature -> shared/infrastructure`; direct imports replace broad barrels. TanStack Server Functions are split one use case per module, while cohesive state variants and tightly coupled form fields remain together.

**Tech Stack:** TypeScript, React 19, TanStack Start/Router/Query, Cloudflare Workers, Better Auth, Drizzle ORM, Turso, Base UI, Formisch, Valibot, Panda CSS, Vitest.

---

## Constraints And Invariants

- This is a structural refactor. Do not change rendered copy, visual behavior, route paths, search parameter semantics, Server Function inputs/outputs, query ordering, error identity/messages, navigation state, or request ordering.
- Do not add compatibility barrels. Consumers import the concrete owner module directly.
- Do not add tests or browser smoke tests. Move existing tests with their implementations and update imports only.
- Do not commit unless the user explicitly requests commits.
- Keep promises started by route loaders lazy. Do not await a promise merely because its producer or consumer moved.
- Preserve `router.invalidate()` and ErrorBoundary reset behavior.
- Preserve navigation state keys: `newBookmarkCreated`, `bookmarkUpdated`, `bookmarkDeleted`, `newTagCreated`, and `tagUpdated`.
- Preserve list search defaults: `limit: 50`, `offset: 0`, `view`, `tagMode: 'and'`, and `sort: 'newest'`.
- Keep server-only modules out of client-facing barrels and component imports.

## Target File Map

### Shared UI And Styles

| Target                                    | Responsibility                                     |
| ----------------------------------------- | -------------------------------------------------- |
| `src/shared/components/ui-state.tsx`      | Cohesive loading, empty, and error feedback family |
| `src/shared/components/pantry-motion.tsx` | Pantry motion wrapper and its variants             |
| `src/styles/button.ts`                    | Button recipe only                                 |
| `src/styles/surface.ts`                   | Surface style only                                 |
| `src/styles/flash.ts`                     | Flash-message style only                           |
| `src/styles/sr-only.ts`                   | Visually-hidden style only                         |

Delete after migration:

- `src/components/error-fallback.tsx`
- `src/components/ui-state.tsx`
- `src/components/pantry-motion.tsx`
- `src/styles/ui.ts`
- `src/styles/primitives.ts`

### Navigation

| Target                                                    | Responsibility                                |
| --------------------------------------------------------- | --------------------------------------------- |
| `src/features/navigation/lib/bookmark-search.ts`          | Bookmark search schema, type, and defaults    |
| `src/features/navigation/lib/bookmark-search-builders.ts` | Search transitions and route-link projections |

### Auth, DB, And Settings

| Target                                                  | Responsibility                                                |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `src/db/get-db.server.ts`                               | DB construction and per-isolate cached provider               |
| `src/features/auth/lib/auth-client.ts`                  | Better Auth browser client                                    |
| `src/features/auth/functions/get-auth.server.ts`        | Better Auth server instance provider                          |
| `src/features/auth/functions/request-session.server.ts` | Plain server-side optional/required request session access    |
| `src/features/auth/functions/get-session.ts`            | Public optional-session Server Function                       |
| `src/features/auth/functions/ensure-session.ts`         | Public required-session Server Function                       |
| `src/features/auth/hooks/use-sign-out.ts`               | Sign-out, query-cache clearing, navigation, and pending state |
| `src/features/auth/components/sign-in-screen.tsx`       | Sign-in screen flow and post-auth navigation                  |
| `src/features/auth/components/sign-in-form.tsx`         | Email/password form                                           |
| `src/features/auth/components/sign-up-screen.tsx`       | Disabled-sign-up screen                                       |
| `src/features/auth/lib/sign-in-schema.ts`               | Sign-in input schemas and type                                |
| `src/features/auth/lib/sign-in-error.ts`                | Sign-in error model                                           |
| `src/features/settings/components/settings-screen.tsx`  | Settings presentation and sign-out affordance                 |

Delete after migration:

- `src/features/auth/auth-client.ts`
- `src/features/auth/auth-config.ts`
- `src/features/auth/auth.function.ts`

### Bookmark Feature

| Target                                                           | Responsibility                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| `src/features/bookmarks/functions/fetch-bookmarks.ts`            | List bookmarks use case                                           |
| `src/features/bookmarks/functions/add-bookmark.ts`               | Add bookmark use case and validator                               |
| `src/features/bookmarks/functions/get-bookmark.ts`               | Get bookmark use case and validator                               |
| `src/features/bookmarks/functions/update-bookmark.ts`            | Update bookmark use case and validator                            |
| `src/features/bookmarks/functions/delete-bookmark.ts`            | Delete bookmark use case and validator                            |
| `src/features/bookmarks/functions/fetch-bookmark-title.ts`       | Public title-fetch Server Function                                |
| `src/features/bookmarks/functions/fetch-page-title.server.ts`    | Server-only page fetching, SSRF checks, limits, and title parsing |
| `src/features/bookmarks/lib/attach-bookmark-tags.ts`             | Bookmark/tag projection and its types                             |
| `src/features/bookmarks/lib/normalize-bookmark-list-query.ts`    | Bookmark-list query normalization                                 |
| `src/features/bookmarks/lib/list-layout-preference.ts`           | Persisted table/card preference                                   |
| `src/features/bookmarks/lib/shorten-url.ts`                      | URL display shortening                                            |
| `src/features/bookmarks/lib/format-date-time.ts`                 | Bookmark detail date formatting                                   |
| `src/features/bookmarks/loaders/load-bookmark-detail.ts`         | Detail loader aggregation and not-found mapping                   |
| `src/features/bookmarks/loaders/load-bookmark-editor.ts`         | Edit loader aggregation and not-found mapping                     |
| `src/features/bookmarks/components/bookmark-list.tsx`            | List boundary and child composition                               |
| `src/features/bookmarks/components/bookmark-list-toolbar.tsx`    | Query, tag, sort, and layout controls                             |
| `src/features/bookmarks/components/bookmark-card-list.tsx`       | Card list presentation                                            |
| `src/features/bookmarks/components/bookmark-list-results.tsx`    | Result, empty, table/card, and load-more presentation             |
| `src/features/bookmarks/components/bookmark-table.tsx`           | Table presentation; retained                                      |
| `src/features/bookmarks/components/bookmark-workbench-form.tsx`  | Shared bookmark form                                              |
| `src/features/bookmarks/components/new-bookmark-screen.tsx`      | New bookmark screen and create navigation                         |
| `src/features/bookmarks/components/edit-bookmark-screen.tsx`     | Edit bookmark screen and update navigation                        |
| `src/features/bookmarks/components/bookmark-detail-screen.tsx`   | Detail boundary, flash, not-found, and composition                |
| `src/features/bookmarks/components/bookmark-detail-content.tsx`  | Successful detail presentation                                    |
| `src/features/bookmarks/components/bookmark-delete-dialog.tsx`   | Delete confirmation, mutation, and navigation                     |
| `src/features/bookmarks/components/bookmark-detail-skeleton.tsx` | Detail loading representation                                     |
| `src/features/bookmarks/hooks/use-list-layout.ts`                | Layout state and persistence                                      |
| `src/features/bookmarks/hooks/use-bookmark-list-pagination.ts`   | Incremental list loading state                                    |
| `src/features/bookmarks/hooks/use-bookmark-title-fetch.ts`       | Remote title-fetch state                                          |

Delete after migration:

- `src/features/bookmarks/bookmark.function.ts`
- `src/features/bookmarks/bookmark.schema.ts`
- `src/routes/_protected/bookmarks/-components/bookmark-workbench-form.tsx`

### Tag Feature

| Target                                                   | Responsibility                                   |
| -------------------------------------------------------- | ------------------------------------------------ |
| `src/features/tags/functions/fetch-tags.ts`              | Paginated tag-list use case                      |
| `src/features/tags/functions/fetch-shelf-tags.ts`        | Shelf tags with bookmark counts                  |
| `src/features/tags/functions/add-tag.ts`                 | Add tag use case and validator                   |
| `src/features/tags/functions/get-tag.ts`                 | Get tag use case and validator                   |
| `src/features/tags/functions/touch-tag-last-used.ts`     | Last-used mutation use case                      |
| `src/features/tags/functions/update-tag.ts`              | Update tag use case and validator                |
| `src/features/tags/lib/tag-name-schema.ts`               | Tag-name schema and normalized type              |
| `src/features/tags/lib/tag-name-already-exists-error.ts` | Duplicate-name error class                       |
| `src/features/tags/lib/tag-shelf.ts`                     | Shelf tag view model and ordering policies       |
| `src/features/tags/lib/tag-color-palette.ts`             | Tag-edit color choices                           |
| `src/features/tags/hooks/use-touch-tag-last-used.ts`     | Selected-list-tag last-used side effect          |
| `src/features/tags/components/tag-selector.tsx`          | Select existing tags or create a tag             |
| `src/features/tags/components/tag-table.tsx`             | Tag table and its loading state                  |
| `src/features/tags/components/tag-management-screen.tsx` | Tag management screen composition                |
| `src/features/tags/components/tag-form.tsx`              | Shared create/edit tag form state and validation |
| `src/features/tags/components/tag-edit-fields.tsx`       | Pin/color/order field composition                |
| `src/features/tags/components/tag-pin-field.tsx`         | Pin field                                        |
| `src/features/tags/components/tag-color-field.tsx`       | Color field                                      |
| `src/features/tags/components/tag-sort-order-field.tsx`  | Sort-order field                                 |
| `src/features/tags/components/new-tag-screen.tsx`        | New tag mutation and navigation                  |
| `src/features/tags/components/edit-tag-screen.tsx`       | Edit tag boundary, mutation, and navigation      |
| `src/features/tags/components/tag-detail-screen.tsx`     | Detail boundary and presentation                 |

Keep the state variants in these files rather than splitting them further:

- `src/features/tags/components/entrance-boxes.tsx`
- `src/features/tags/components/shelf-nav.tsx`
- `src/features/tags/components/tag-table.tsx`

Delete after migration:

- `src/features/tags/tag.function.ts`
- `src/features/tags/tag-table.tsx`
- `src/entities/tag.ts`

### App Shell

| Target                                                      | Responsibility                          |
| ----------------------------------------------------------- | --------------------------------------- |
| `src/features/app-shell/components/root-document.tsx`       | HTML document and development tools     |
| `src/features/app-shell/components/protected-shell.tsx`     | Protected layout composition            |
| `src/features/app-shell/components/app-header.tsx`          | Header navigation and actions           |
| `src/features/app-shell/components/shelf-sidebar.tsx`       | Desktop shelf rail                      |
| `src/features/app-shell/components/mobile-shelf-dialog.tsx` | Mobile shelf chooser                    |
| `src/features/app-shell/components/shelf-nav-panel.tsx`     | Shelf navigation Suspense/ErrorBoundary |

## Task 1: Capture Baseline And Establish Verification Gates

**Files:**

- Read: `src/**/*.{ts,tsx}`
- Read: `package.json`

- [ ] **Step 1: Verify the current worktree without modifying it**

Run:

```bash
git status --short
pnpm run typecheck
pnpm run test
```

Expected: existing user changes are recorded but not modified; `typecheck` and `test` exit successfully. If either command already fails, record the exact baseline failure and do not attribute it to later tasks.

- [ ] **Step 2: Record obsolete-import search baselines**

Run:

```bash
rg -n "styles/ui|styles/primitives|bookmark\.function|tag\.function|auth\.function|db/index\.server|components/(ui-state|pantry-motion|error-fallback)" src
```

Expected: matches identify the consumers that must be migrated. The final task requires zero matches.

## Task 2: Establish Leaf Style And Shared UI Ownership

**Files:**

- Create: `src/styles/surface.ts`
- Create: `src/styles/flash.ts`
- Create: `src/styles/sr-only.ts`
- Modify: `src/styles/button.ts`
- Modify: `src/shared/components/styled-button/index.tsx`
- Move: `src/components/ui-state.tsx` -> `src/shared/components/ui-state.tsx`
- Move: `src/components/pantry-motion.tsx` -> `src/shared/components/pantry-motion.tsx`
- Modify: all 17 current `src/styles/ui.ts` consumers
- Delete: `src/styles/ui.ts`
- Delete: `src/styles/primitives.ts`
- Delete: `src/components/error-fallback.tsx`

- [ ] **Step 1: Move each unrelated primitive style to its owner file**

Move the existing definitions without changing their Panda CSS objects:

```ts
// src/styles/surface.ts
import { css } from 'styled-system/css'

export const surface = css({
  borderWidth: 'thin',
  borderColor: 'border.default',
  borderRadius: 'box',
  background: 'bg.surface'
})

// src/styles/flash.ts
import { css } from 'styled-system/css'

export const flash = css({
  borderWidth: 'thin',
  borderStyle: 'solid',
  borderColor: 'border.accent',
  borderRadius: 'box',
  background: 'accent.subtle',
  color: 'fg.default',
  paddingBlock: '3',
  paddingInline: '4'
})

// src/styles/sr-only.ts
import { visuallyHidden } from 'styled-system/patterns'

export const srOnly = visuallyHidden()
```

- [ ] **Step 2: Make the style layer own the button recipe**

Move `src/shared/components/styled-button/index.tsx:30-94` into `src/styles/button.ts`, including its `cva` import. Keep every base style, variant, and default value byte-for-byte equivalent. Update `StyledButton` to import `button` from `../../../styles/button`, remove its `cva` import, export only its component API, and update the file header so it no longer claims to own/export the recipe.

- [ ] **Step 3: Move shared feedback and motion components**

Move `src/components/ui-state.tsx:1-58` and `src/components/pantry-motion.tsx:1-21` to:

```text
src/shared/components/ui-state.tsx
src/shared/components/pantry-motion.tsx
```

Keep `UiLoading`, `UiEmpty`, and `UiError` together. Update all consumers to the new paths.

- [ ] **Step 4: Replace broad style imports with direct imports**

Use this ownership map:

```text
button -> styles/button
tagChip -> styles/tag-chip
field/formControl/formSummary symbols -> styles/form
skeleton/spinner/state symbols -> styles/feedback
workbench symbols -> styles/workbench
dialog symbols -> styles/dialog
surface -> styles/surface
flash -> styles/flash
srOnly -> styles/sr-only
cx -> styled-system/css
```

Do not introduce a replacement barrel.

- [ ] **Step 5: Delete obsolete shared/style files and verify the checkpoint**

Delete `src/styles/ui.ts`, `src/styles/primitives.ts`, and the unreferenced `src/components/error-fallback.tsx`. Remove `src/components/` once empty.

Run:

```bash
! rg -n "styles/ui|styles/primitives|components/(ui-state|pantry-motion|error-fallback)" src
pnpm run typecheck
pnpm run test
```

Expected: `rg` returns no matches; both verification commands pass.

## Task 3: Centralize Navigation Contracts And Move Pure Feature Libraries

**Files:**

- Create: `src/features/navigation/lib/bookmark-search.ts`
- Create: `src/features/navigation/lib/bookmark-search-builders.ts`
- Modify: `src/routes/_protected/index.tsx`
- Modify: `src/routes/_protected/-lib/bookmark-list-loader-deps.ts`
- Modify: bookmark new/edit/detail routes
- Modify: `src/features/bookmarks/components/bookmark-list.tsx`
- Modify: `src/features/tags/components/shelf-nav.tsx`
- Modify: `src/features/tags/components/entrance-boxes.tsx`
- Modify: tag detail route
- Delete: `src/routes/_protected/-lib/bookmark-search-schema.ts`
- Delete: `src/routes/_protected/bookmarks/-lib/list-back-search.ts`
- Move: bookmark/tag pure helper files and their existing tests into `lib/`
- Move: `src/lib/format-date.ts` -> `src/features/bookmarks/lib/format-date-time.ts`
- Delete: `src/entities/tag.ts`

- [ ] **Step 1: Move the bookmark search contract unchanged**

`bookmark-search.ts` owns and exports:

```ts
import * as v from 'valibot'

import { offsetPaginationQuerySchema } from '../../../schemas/pagination'

export const bookmarkSearchSchema = v.object({
  ...offsetPaginationQuerySchema.entries,
  view: v.optional(v.picklist(['entrance', 'list']), 'entrance'),
  q: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  tagMode: v.optional(v.picklist(['and', 'or']), 'and'),
  sort: v.optional(v.picklist(['newest', 'updated']), 'newest')
})

export type BookmarkSearchSchema = v.InferOutput<typeof bookmarkSearchSchema>

export const defaultBookmarkSearch: BookmarkSearchSchema = {
  limit: 50,
  offset: 0,
  view: 'entrance',
  tagMode: 'and',
  sort: 'newest'
}
```

Update route validation and loader-dependency typing to import this module directly.

- [ ] **Step 2: Consolidate search builders**

`bookmark-search-builders.ts` owns these behavior-preserving functions:

```ts
export type BookmarkSearchPatch = {
  readonly q?: string | undefined
  readonly tags?: string[] | undefined
  readonly tagMode?: BookmarkSearchSchema['tagMode']
  readonly sort?: BookmarkSearchSchema['sort']
  readonly clearQ?: boolean
  readonly clearTags?: boolean
}

export function buildListSearch(
  current: BookmarkSearchSchema,
  patch: BookmarkSearchPatch
): BookmarkSearchSchema
export function buildListBackSearch(tags?: readonly string[]): BookmarkSearchSchema
export function detailSearchFromList(search: BookmarkSearchSchema): { tags?: string[] }
export function allShelfSearch(): BookmarkSearchSchema
export function tagShelfSearch(tagName: string): BookmarkSearchSchema
```

Move `resolveSearchPatch` and `buildListSearch` from `bookmark-list.tsx:234-278`, `buildListBackSearch` from `list-back-search.ts:4-15`, `detailSearchFromList` from `bookmark-list.tsx:181-186`, and the two shelf builders from `shelf-nav.tsx:9-15,68-74`. Preserve optional-property filtering. `shelf-nav.tsx` must stop exporting search builders.

- [ ] **Step 3: Move bookmark pure helpers and colocate existing tests**

Use these exact moves:

```text
attach-bookmark-tags.ts -> lib/attach-bookmark-tags.ts
attach-bookmark-tags.test.ts -> lib/attach-bookmark-tags.test.ts
bookmark-list-query.ts -> lib/normalize-bookmark-list-query.ts
bookmark-list-query.test.ts -> lib/normalize-bookmark-list-query.test.ts
list-layout-preference.ts -> lib/list-layout-preference.ts
list-layout-preference.test.ts -> lib/list-layout-preference.test.ts
shorten-url.ts -> lib/shorten-url.ts
src/lib/format-date.ts -> features/bookmarks/lib/format-date-time.ts
```

Retain exported type names unless the old name explicitly describes the old file rather than the contract. Update imports directly.

- [ ] **Step 4: Move tag pure helpers and colocate existing tests**

Use these exact moves:

```text
tag-name.schema.ts -> lib/tag-name-schema.ts
tag-name.schema.test.ts -> lib/tag-name-schema.test.ts
tag-errors.ts -> lib/tag-name-already-exists-error.ts
tag.function.test.ts -> lib/tag-name-already-exists-error.test.ts
tag-shelf.ts -> lib/tag-shelf.ts
tag-shelf.test.ts -> lib/tag-shelf.test.ts
tag-color-palette.ts -> lib/tag-color-palette.ts
```

Preserve the current `TagNameAlreadyExistsError` name/message and both shelf sorting policies.

- [ ] **Step 5: Remove the unused entity schema and verify the checkpoint**

Delete `src/entities/tag.ts`; it has no production or test consumers.

Run:

```bash
! rg -n "routes/_protected/-lib/bookmark-search-schema|list-back-search|features/(bookmarks|tags)/(attach-bookmark-tags|bookmark-list-query|list-layout-preference|shorten-url|tag-name\.schema|tag-errors|tag-shelf|tag-color-palette)|src/lib/format-date|entities/tag" src
pnpm run typecheck
pnpm run test
```

Expected: no obsolete imports; both verification commands pass.

## Task 4: Separate DB And Authentication Boundaries

**Files:**

- Move: `src/db/index.server.ts` -> `src/db/get-db.server.ts`
- Move: `src/features/auth/auth-client.ts` -> `src/features/auth/lib/auth-client.ts`
- Move: `src/features/auth/auth-config.ts` -> `src/features/auth/functions/get-auth.server.ts`
- Create: `src/features/auth/functions/request-session.server.ts`
- Create: `src/features/auth/functions/get-session.ts`
- Create: `src/features/auth/functions/ensure-session.ts`
- Modify: all auth, bookmark, tag, route, and script consumers
- Delete: `src/features/auth/auth.function.ts`

- [ ] **Step 1: Rename the DB provider without changing its cache**

Move the complete implementation to `src/db/get-db.server.ts`. Keep `createDb`, schema assembly, the DB type, and cached instance private; retain `getDB` as the only public runtime value.

- [ ] **Step 2: Move Better Auth client/server providers**

Move the browser client to `auth/lib/auth-client.ts` and the server provider to `auth/functions/get-auth.server.ts`. Preserve `cachedAuth` as module-level immutable infrastructure caching, not request-scoped state.

- [ ] **Step 3: Create the plain request-session boundary**

Extract the repeated Better Auth call into server-only functions with these contracts:

```ts
export async function getRequestSession() {
  const headers = getRequestHeaders()
  return getAuth().api.getSession({ headers })
}

export async function requireRequestSession() {
  const session = await getRequestSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
```

The exact unauthorized error must remain unchanged.

- [ ] **Step 4: Wrap the plain helpers in public Server Functions**

```ts
// get-session.ts
export const getSession = createServerFn({ method: 'GET' }).handler(async () => getRequestSession())

// ensure-session.ts
export const ensureSession = createServerFn({ method: 'GET' }).handler(async () =>
  requireRequestSession()
)
```

Routes import these public wrappers. Bookmark and tag Server Function handlers import `requireRequestSession` directly.

- [ ] **Step 5: Delete the aggregate auth module and verify the checkpoint**

Run:

```bash
! rg -n "db/index\.server|features/auth/(auth-client|auth-config|auth\.function)" src scripts
pnpm run typecheck
pnpm run test
```

Expected: no obsolete imports; both verification commands pass.

## Task 5: Split Tag Server Functions By Use Case

**Files:**

- Create: `src/features/tags/functions/fetch-tags.ts`
- Create: `src/features/tags/functions/fetch-shelf-tags.ts`
- Create: `src/features/tags/functions/add-tag.ts`
- Create: `src/features/tags/functions/get-tag.ts`
- Create: `src/features/tags/functions/touch-tag-last-used.ts`
- Create: `src/features/tags/functions/update-tag.ts`
- Modify: all tag Server Function consumers
- Delete: `src/features/tags/tag.function.ts`

- [ ] **Step 1: Extract each existing Server Function unchanged**

Each target module owns one `createServerFn`, its validator, its DB query/mutation, and imports `requireRequestSession`. Keep these public names:

```ts
fetchTags
fetchShelfTags
addTag
getTag
touchTagLastUsed
updateTag
```

Keep the ID validator private in each module that needs it rather than introducing a validator barrel.

- [ ] **Step 2: Preserve use-case-specific error behavior**

`addTag` continues to throw `TagNameAlreadyExistsError`. `updateTag` continues to throw `Error('Tag name already exists')`. Do not unify them during this refactor.

- [ ] **Step 3: Update every consumer to a direct use-case import**

Update protected shell, tag routes, bookmark forms/detail, bookmark list, entrance boxes, inline add, and tag selector. Do not create `functions/index.ts`.

- [ ] **Step 4: Delete the aggregate and verify the checkpoint**

Run:

```bash
! rg -n "tag\.function" src
pnpm run typecheck
pnpm run test
```

Expected: no aggregate imports; both verification commands pass.

## Task 6: Split Bookmark Server Functions By Use Case

**Files:**

- Create: `src/features/bookmarks/functions/fetch-bookmarks.ts`
- Create: `src/features/bookmarks/functions/add-bookmark.ts`
- Create: `src/features/bookmarks/functions/get-bookmark.ts`
- Create: `src/features/bookmarks/functions/update-bookmark.ts`
- Create: `src/features/bookmarks/functions/delete-bookmark.ts`
- Create: `src/features/bookmarks/functions/fetch-bookmark-title.ts`
- Move: `src/features/bookmarks/title-fetcher.server.ts` -> `src/features/bookmarks/functions/fetch-page-title.server.ts`
- Move: `src/features/bookmarks/title-fetcher.server.test.ts` -> `src/features/bookmarks/functions/fetch-page-title.server.test.ts`
- Split/move: `src/features/bookmarks/bookmark.function.test.ts`
- Modify: all bookmark Server Function consumers
- Delete: `src/features/bookmarks/bookmark.function.ts`
- Delete: `src/features/bookmarks/bookmark.schema.ts`

- [ ] **Step 1: Extract each existing Server Function unchanged**

Each target owns one use case and imports only its required Drizzle operators, schemas, DB provider, auth helper, and subordinate library modules. Keep these public names:

```ts
fetchBookmarks
addBookmark
getBookmark
updateBookmark
deleteBookmark
fetchBookmarkTitle
```

- [ ] **Step 2: Give add/update validators to their use cases**

Move `addBookmarkInputSchema` into `add-bookmark.ts` and `updateBookmarkInputSchema` into `update-bookmark.ts`. Keep them exported because existing tests validate the schemas directly.

Split `bookmark.function.test.ts` into:

```text
functions/add-bookmark.test.ts
functions/update-bookmark.test.ts
```

Move the existing describe blocks without adding assertions or changing test data.

- [ ] **Step 3: Move the server-only title fetcher**

Move its complete implementation and test to `functions/fetch-page-title.server.ts` and `functions/fetch-page-title.server.test.ts`. Keep URL checks, IP checks, redirect count, timeout, response-size limit, and title parsing together as private parts of one public `fetchPageTitle` operation.

- [ ] **Step 4: Update every consumer to direct imports**

Update list/detail/editor routes and components. `fetch-bookmarks.ts` imports `normalizeBookmarkListQuery` and `attachTagsToBookmarks` from `lib/`; `fetch-bookmark-title.ts` imports only the server-only title helper.

- [ ] **Step 5: Delete aggregate/schema files and verify the checkpoint**

Run:

```bash
! rg -n "bookmark\.function|bookmark\.schema|title-fetcher\.server" src
pnpm run typecheck
pnpm run test
```

Expected: no obsolete imports; both verification commands pass.

## Task 7: Remove Route And Persistence Coupling From Feature UI

**Files:**

- Modify: `src/routes/_protected/index.tsx`
- Modify: `src/features/bookmarks/components/bookmark-list.tsx`
- Modify: `src/features/tags/components/entrance-boxes.tsx`
- Move: `src/features/bookmarks/components/tag-selector.tsx` -> `src/features/tags/components/tag-selector.tsx`
- Move: `src/features/tags/tag-table.tsx` -> `src/features/tags/components/tag-table.tsx`
- Move: `src/routes/_protected/bookmarks/-components/bookmark-workbench-form.tsx` -> `src/features/bookmarks/components/bookmark-workbench-form.tsx`
- Modify: tag/bookmark consumers that import `TagSelectType`

- [ ] **Step 1: Make BookmarkList prop-driven**

Remove `getRouteApi` calls. Use an explicit contract equivalent to:

```ts
type BookmarkListProps = {
  readonly search: BookmarkSearchSchema
  readonly bookmarksPromise: Promise<BookmarkListItem[]> | undefined
  readonly shelfTagsPromise: Promise<ShelfTag[]>
}
```

The route connector reads both route loader results and passes them. It preserves the current undefined loading state and lazy promise identity.

- [ ] **Step 2: Make EntranceBoxes prop-driven**

Remove `getRouteApi('/_protected')`. Accept `shelfTagsPromise: Promise<ShelfTag[]>` and retain `useRouter()` only for ErrorBoundary invalidation.

- [ ] **Step 3: Normalize component ownership**

Move `TagSelector` to tags, `TagTable` under tags/components, and `BookmarkWorkbenchForm` into bookmarks/components. Update imports directly; do not create feature barrels.

- [ ] **Step 4: Replace Drizzle row types at UI boundaries**

Remove `TagSelectType` imports from client-facing UI. Use Server Function return types at screen boundaries and narrow structural props inside reusable components:

```ts
type SelectableTag = {
  readonly id: number
  readonly name: string
}
```

Tag edit/detail screens may infer the result from `getTag` through an `import type` edge; `TagSelector` must not require the complete persistence row. Never add a runtime component import of a server-only helper merely to obtain a type.

- [ ] **Step 5: Verify route APIs and DB schema no longer leak into feature UI**

Run:

```bash
! rg -n "getRouteApi|routes/_protected/-lib|db/schema" src/features --glob '*.tsx'
pnpm run typecheck
pnpm run test
```

Expected: no route-local imports or route API calls in feature components; any remaining `db/schema` match must be server-side and explicitly justified; verification passes.

## Task 8: Split Bookmark List State And Presentation

**Files:**

- Modify: `src/features/bookmarks/components/bookmark-list.tsx`
- Create: `src/features/bookmarks/components/bookmark-list-toolbar.tsx`
- Create: `src/features/bookmarks/components/bookmark-card-list.tsx`
- Create: `src/features/bookmarks/components/bookmark-list-results.tsx`
- Create: `src/features/bookmarks/hooks/use-list-layout.ts`
- Create: `src/features/bookmarks/hooks/use-bookmark-list-pagination.ts`
- Create: `src/features/tags/hooks/use-touch-tag-last-used.ts`

- [ ] **Step 1: Extract layout preference state**

Move the current `useListLayout` implementation unchanged into `use-list-layout.ts`. It imports read/write functions from bookmark `lib/list-layout-preference.ts` and returns the same readonly tuple.

- [ ] **Step 2: Extract selected-tag last-used behavior**

Move `useTouchTagLastUsedOnce` into tags/hooks. Preserve the NUL-delimited tag key, cancellation guard, first selected tag behavior, and fire-and-forget Server Function call.

- [ ] **Step 3: Extract pagination state**

Move item accumulation, `hasMore`, pending/error state, reset-on-initial-change, and `fetchBookmarks` into `use-bookmark-list-pagination.ts`. Its result must expose the current items, load-more state, and `loadMore` action without changing offset or page-limit calculations.

- [ ] **Step 4: Extract toolbar and card presentation**

Move all search form/tag/sort/layout JSX and styles to `bookmark-list-toolbar.tsx`. Move card-only JSX and styles to `bookmark-card-list.tsx`. Toolbar search transitions import `buildListSearch` from navigation/lib.

- [ ] **Step 5: Extract results presentation**

`bookmark-list-results.tsx` owns empty-state selection, table/card selection, crossfade, and load-more/error presentation. It uses the pagination hook and imports `BookmarkTable`/`BookmarkCardList` directly.

- [ ] **Step 6: Reduce BookmarkList to boundary composition**

Keep list-level ErrorBoundary, Suspense, loading/error variants, toolbar composition, list key, and outer labelled section in `bookmark-list.tsx`. Do not split tiny list loading/error state variants.

- [ ] **Step 7: Verify the checkpoint**

Run:

```bash
pnpm run typecheck
pnpm run test
```

Expected: both pass; `bookmark-list.tsx` no longer owns toolbar, card rendering, pagination state, layout persistence, or tag-touch behavior.

## Task 9: Extract Auth Screens, Settings, Root Document, And App Shell

**Files:**

- Move: `src/routes/sign-in/-components/sign-in-with-email-and-password-form.tsx` -> `src/features/auth/components/sign-in-form.tsx`
- Move: `src/routes/sign-in/-lib/schema.ts` -> `src/features/auth/lib/sign-in-schema.ts`
- Move: `src/routes/sign-in/-lib/error.ts` -> `src/features/auth/lib/sign-in-error.ts`
- Create: `src/features/auth/components/sign-in-screen.tsx`
- Create: `src/features/auth/components/sign-up-screen.tsx`
- Create: `src/features/auth/hooks/use-sign-out.ts`
- Create: `src/features/settings/components/settings-screen.tsx`
- Create: `src/features/app-shell/components/root-document.tsx`
- Create: `src/features/app-shell/components/protected-shell.tsx`
- Create: `src/features/app-shell/components/app-header.tsx`
- Create: `src/features/app-shell/components/shelf-sidebar.tsx`
- Create: `src/features/app-shell/components/mobile-shelf-dialog.tsx`
- Create: `src/features/app-shell/components/shelf-nav-panel.tsx`
- Modify: `src/routes/__root.tsx`
- Modify: `src/routes/sign-in/index.tsx`
- Modify: `src/routes/sign-up.tsx`
- Modify: `src/routes/_protected.tsx`
- Modify: `src/routes/_protected/settings/index.tsx`

- [ ] **Step 1: Extract auth route UI into the auth feature**

`sign-in/index.tsx` retains search validation, reads `redirect`, and renders `SignInScreen`. `SignInScreen` owns `authClient.signIn.email`, error conversion, and post-auth navigation. Move the existing form/schema/error source unchanged before updating names/imports.

`sign-up.tsx` retains only its route declaration and renders `SignUpScreen` with the current disabled-registration message.

- [ ] **Step 2: Extract and reuse sign-out workflow**

`use-sign-out.ts` preserves this exact sequence:

```text
start transition
await authClient.signOut
clear QueryClient in the existing onSuccess callback
navigate to /sign-in
expose pending state
```

Use the hook in both app header and settings screen. Do not reorder cache clearing and navigation.

- [ ] **Step 3: Extract SettingsScreen**

The route retains `ensureSession` loader startup and passes `user` to `SettingsScreen`. Move all settings styles and JSX to the screen; use the navigation default from navigation/lib and the shared sign-out hook.

- [ ] **Step 4: Extract RootDocument**

Move document markup, head scripts, body, and devtools configuration from `__root.tsx` into `app-shell/components/root-document.tsx`. Keep root route context and route declaration in `__root.tsx`.

- [ ] **Step 5: Extract the five protected-shell responsibilities**

Use these boundaries:

```text
ProtectedShell: grid/content/main composition and children
AppHeader: mobile brand, shelf trigger slot, new/settings/sign-out actions
ShelfSidebar: desktop brand, shelf nav slot, tag/settings links
MobileShelfDialog: open state, trigger, popup, close behavior
ShelfNavPanel: ErrorBoundary, Suspense, ShelfNavAsync, invalidate-on-reset
```

`_protected.tsx` retains session guard, redirect, `fetchShelfTags` loader startup, parent/index search projection, and `<Outlet />` connection. Pass `Outlet` as children; app-shell components must not import route modules or `Outlet`.

- [ ] **Step 6: Verify route thinness and checkpoint**

Run:

```bash
pnpm run typecheck
pnpm run test
```

Expected: both pass; auth/settings/root/protected route files contain route concerns and screen wiring rather than full screen implementations.

## Task 10: Extract Bookmark New, Edit, And Detail Screens

**Files:**

- Create: `src/features/bookmarks/hooks/use-bookmark-title-fetch.ts`
- Modify: `src/features/bookmarks/components/bookmark-workbench-form.tsx`
- Create: `src/features/bookmarks/loaders/load-bookmark-detail.ts`
- Create: `src/features/bookmarks/loaders/load-bookmark-editor.ts`
- Create: `src/features/bookmarks/components/new-bookmark-screen.tsx`
- Create: `src/features/bookmarks/components/edit-bookmark-screen.tsx`
- Create: `src/features/bookmarks/components/bookmark-detail-screen.tsx`
- Create: `src/features/bookmarks/components/bookmark-detail-content.tsx`
- Create: `src/features/bookmarks/components/bookmark-delete-dialog.tsx`
- Create: `src/features/bookmarks/components/bookmark-detail-skeleton.tsx`
- Modify: `src/routes/_protected/bookmarks/new/index.tsx`
- Modify: `src/routes/_protected/bookmarks/$id/edit.tsx`
- Modify: `src/routes/_protected/bookmarks/$id/index.tsx`

- [ ] **Step 1: Extract remote title-fetch state**

Move title-fetch pending/error handling and the `fetchBookmarkTitle` call into `use-bookmark-title-fetch.ts`. The form still owns Formisch state, schema, summary, URL/title/note fields, normalization, and submit handling. Preserve the current manual-title fallback messages.

- [ ] **Step 2: Create loader aggregation modules**

`load-bookmark-detail.ts` starts `getBookmark` and `fetchTags`, maps tag IDs to names, converts only `Error('Bookmark not found')` to `{ kind: 'not-found' }`, and rethrows all other errors.

`load-bookmark-editor.ts` loads bookmark and tags and performs the same not-found mapping used by the current edit route.

- [ ] **Step 3: Extract new and edit screens**

`NewBookmarkScreen` owns selected tag initialization, page workbench UI, `addBookmark`, and post-create navigation.

`EditBookmarkScreen` owns not-found presentation, selected tag state, workbench UI, `updateBookmark`, and post-update navigation.

Routes retain search validation, loader startup, reading route data/search, and passing navigation inputs.

- [ ] **Step 4: Split bookmark detail into five responsibilities**

Use these contracts:

```text
BookmarkDetailScreen: promise boundary, flash states, not-found state, retry
BookmarkDetailContent: URL/note/tags/dates/edit action
BookmarkDeleteDialog: open/error/pending state, delete call, list navigation
BookmarkDetailSkeleton: existing skeleton markup/styles
loadBookmarkDetail: data aggregation
```

Keep small detail error fallback private to `BookmarkDetailScreen`.

- [ ] **Step 5: Preserve detail/list navigation exactly**

Keep tag search propagation, list-back search, detail-to-edit search, delete destination, and all route-state flash flags unchanged.

- [ ] **Step 6: Verify the checkpoint**

Run:

```bash
pnpm run typecheck
pnpm run test
```

Expected: both pass; bookmark route files are connection layers.

## Task 11: Split Tag Fields, Share TagForm, And Extract Tag Screens

**Files:**

- Create: `src/features/tags/components/tag-pin-field.tsx`
- Create: `src/features/tags/components/tag-color-field.tsx`
- Create: `src/features/tags/components/tag-sort-order-field.tsx`
- Modify: `src/features/tags/components/tag-edit-fields.tsx`
- Create: `src/features/tags/components/tag-form.tsx`
- Create: `src/features/tags/components/tag-management-screen.tsx`
- Create: `src/features/tags/components/new-tag-screen.tsx`
- Create: `src/features/tags/components/edit-tag-screen.tsx`
- Create: `src/features/tags/components/tag-detail-screen.tsx`
- Modify: `src/routes/_protected/tags/index.tsx`
- Modify: `src/routes/_protected/tags/new.tsx`
- Modify: `src/routes/_protected/tags/$id.edit.tsx`
- Modify: `src/routes/_protected/tags/$id/index.tsx`

- [ ] **Step 1: Split the independent tag-edit controls**

Move pin toggle, color palette, and sort-order input/stepper JSX and their styles into their named field files. `TagEditFields` becomes a stateless composer with the current controlled props:

```ts
type TagEditFieldsProps = {
  readonly pinned: boolean
  readonly color: string | null
  readonly sortOrder: number
  readonly onPinnedChange: (pinned: boolean) => void
  readonly onColorChange: (color: string | null) => void
  readonly onSortOrderChange: (sortOrder: number) => void
  readonly disabled?: boolean
}
```

Keep all labels, IDs, aria attributes, button types, number coercion, and palette values unchanged.

- [ ] **Step 2: Build a shared controlled TagForm**

`TagForm` owns tag form state, name validation, pin/color/order state, pending/error summary, `TagEditFields`, and submit button. Configure create/edit through explicit values rather than boolean rendering branches:

```ts
type TagFormValues = {
  readonly name: string
  readonly pinned: boolean
  readonly color: string | null
  readonly sortOrder: number
}

type TagFormProps = {
  readonly initialValues: TagFormValues
  readonly legend: string
  readonly submitLabel: string
  readonly pendingLabel: string
  readonly onSubmit: (values: TagFormValues) => Promise<void>
  readonly mapError: (error: unknown) => string
}
```

Preserve the distinct create/edit error messages through `mapError`.

- [ ] **Step 3: Extract tag management screen**

Move management header, inline add, table ErrorBoundary/Suspense, and table skeleton ownership into `tag-management-screen.tsx`. Keep `TagTable` and its skeleton together in `tag-table.tsx` as states of one table responsibility.

- [ ] **Step 4: Extract new/edit/detail screens**

`NewTagScreen` owns add mutation and post-create navigation. `EditTagScreen` owns promise boundary, update mutation, invalidation, and post-update navigation. `TagDetailScreen` owns flash messages, promise boundary, detail presentation, and links.

Routes retain route declarations, param/search validation, loader startup, and screen wiring.

- [ ] **Step 5: Verify the checkpoint**

Run:

```bash
pnpm run typecheck
pnpm run test
```

Expected: both pass; tag routes are connection layers and tag form controls have independent change boundaries.

## Task 12: Final Cleanup And Full Verification

**Files:**

- Modify: any import changed by Tasks 2-11
- Delete: empty route-local `-components`/`-lib` directories
- Verify: all production and test modules

- [ ] **Step 1: Confirm obsolete paths are gone**

Run:

```bash
! rg -n "styles/ui|styles/primitives|bookmark\.function|tag\.function|auth\.function|db/index\.server|components/(ui-state|pantry-motion|error-fallback)|routes/sign-in/-(components|lib)|routes/_protected/bookmarks/-components/bookmark-workbench-form|entities/tag" src scripts
```

Expected: zero matches.

- [ ] **Step 2: Check dependency direction manually**

Run:

```bash
! rg -n "from ['\"][^'\"]*routes/" src/features src/shared
! rg -n "from ['\"][^'\"]*features/" src/db src/shared
! rg -n "db/schema" src/features --glob '*.tsx'
```

Expected: features/shared do not import route modules; DB/shared do not import features; client UI does not depend on Drizzle row schemas.

- [ ] **Step 3: Run the complete project verification gate**

Run:

```bash
pnpm run typecheck
pnpm run test
pnpm run build
pnpm run lint
pnpm run format:check
pnpm run knip
```

Expected: every command exits successfully with no new warnings or unused exports/files.

- [ ] **Step 4: Inspect the final diff for behavior-only drift**

Run:

```bash
git status --short
git diff --stat
git diff
```

Expected: changes consist of moves, focused extraction, import rewiring, and explicitly approved dead-code deletion. Reject any accidental copy, route contract, query, validation, error-message, or navigation-state change.

## Files That Intentionally Remain Cohesive

Do not split these solely because they contain multiple exports or private helpers:

- `src/shared/components/ui-state.tsx`: loading/empty/error are one feedback family.
- `src/shared/components/styled-button/index.tsx`: styled base, props, and wrapper are one component API after recipe extraction.
- `src/shared/components/styled-link/index.tsx`: raw anchor, TanStack adapter, styles, and typed export are one link API.
- `src/features/bookmarks/components/bookmark-table.tsx`: one table presentation responsibility.
- `src/features/bookmarks/components/bookmark-workbench-form.tsx`: Formisch fields and validation share one form state; only title-fetch side effects move out.
- `src/features/tags/components/entrance-boxes.tsx`: loading/error/resolved/empty are states of one entrance UI.
- `src/features/tags/components/shelf-nav.tsx`: sync and async adapters are states of one navigation UI after search builders move out.
- `src/features/tags/components/tag-table.tsx`: table and skeleton share one table structure.
- `src/features/tags/components/inline-add-tag.tsx`: validation, mutation, and error state form one quick-add transaction.
- `src/features/bookmarks/functions/fetch-page-title.server.ts`: SSRF checks, limits, redirects, parsing, and timeout are private parts of one fetch operation.
- `src/features/bookmarks/lib/attach-bookmark-tags.ts`: projection types and function form one contract.
- `src/features/bookmarks/lib/list-layout-preference.ts`: type, read, and write form one persisted preference.
- `src/features/tags/lib/tag-shelf.ts`: view model and two ordering policies form one shelf contract.
- `src/db/schema/auth-schema.ts`: Better Auth adapter tables remain one persistence schema.
- `src/db/schema/bookmark.ts`, `tag.ts`, and `bookmark-tag.ts`: each file remains one persistence entity/relationship.
- `src/styles/form.ts`, `feedback.ts`, `workbench.ts`, and `dialog.ts`: each remains a cohesive style suite.
- `src/schemas/pagination.ts`: parser, schema, and inferred type form one pagination contract.

## Separate Ticket Candidates

These existing issues were discovered during the audit but are explicitly outside this behavior-preserving refactor:

1. Wrap bookmark add/update and tag-link replacement in transactions as required by `docs/architecture.md`.
2. Verify every submitted tag ID belongs to the authenticated user before bookmark add/update.
3. Scope `getBookmark` tag joins to the authenticated user.
4. Exclude soft-deleted bookmarks from the initial update lookup.
5. Standardize duplicate-tag-name error identity and user-facing conversion between add/update flows.
6. Harden title-fetch SSRF protection against DNS rebinding/private DNS results and complete IPv6 private/link-local ranges.
