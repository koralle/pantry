# Turso RPC MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a private, usable bookmark manager on Cloudflare Workers using TanStack Start Server Functions, Turso, Better Auth sign-in, bookmark search/tagging, and Playwright MCP acceptance testing.

**Architecture:** Browser code invokes TanStack Start Server Functions only. Each function obtains the Better Auth session and delegates user-scoped database work to focused bookmark/tag services backed by Turso through Drizzle. The deployed Worker authenticates only pre-provisioned users; a local CLI provisions those users through Better Auth's server API.

**Tech Stack:** TanStack Start, React 19, Better Auth, Drizzle ORM, `@libsql/client`, Turso Cloud, Cloudflare Workers, Valibot, Vitest, Playwright MCP.

---

## Delivery Rules

- Create one worktree per task beneath `~/.herdr/worktrees/pantry/` and one branch/PR per task.
- Before opening each PR, assign a fresh agent that did not implement the task to review its diff. Resolve blocking findings in the task worktree, then repeat review if the fix changes behavior.
- Do not commit `.env*`, `.dev.vars*`, Turso credentials, Better Auth secrets, or provisioner passwords.
- All dependent task branches must be rebased onto their prerequisite's merged commit before their PR is opened against `main`.
- Use conventional commits. PRs must name their prerequisite when temporarily stacked.

## File Structure

- `src/db/index.server.ts`: Worker-only Turso Drizzle clients.
- `auth.ts`: Node-only Turso/Better Auth instance used by maintenance scripts.
- `src/features/auth/auth-config.ts`: Worker Better Auth configuration.
- `scripts/create-user.ts`: idempotent, local-only initial account provisioning.
- `src/features/bookmarks/title-fetcher.server.ts`: bounded, redirect-aware page-title retrieval.
- `src/features/bookmarks/bookmark.service.ts`: user-scoped query and transaction logic.
- `src/features/bookmarks/bookmark.function.ts`: validated Server Function entry points.
- `src/features/bookmarks/components/`: focused list, form, tag input, and delete UI.
- `src/routes/_protected/`: route loaders and composition for the bookmark workflow.

### Task 1: Preserve the Approved Documentation

**Worktree:** `~/.herdr/worktrees/pantry/docs-turso-rpc-mvp`

**Branch / PR:** `docs/turso-rpc-mvp`

**Files:**

- Create: `docs/superpowers/specs/2026-07-19-turso-rpc-mvp-design.md`
- Modify: `AGENTS.md`
- Modify: `docs/architecture.md`
- Modify: `docs/testing.md`
- Modify: `docs/superpowers/specs/2026-06-16-seed-script-design.md`
- Modify: `docs/superpowers/plans/2026-06-16-seed-script-plan.md`

- [ ] **Step 1: Move the already-approved documentation diff into this worktree without changing its semantics.**

  The active architecture must state all of the following:

  ```md
  - Server Function境界: ブラウザのデータ操作はTanStack Start Server Functionに限定する。
  - DB: Turso Cloud。Drizzle ORMと`@libsql/client`で接続する。
  - Worker環境変数: `TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`
  - サインアップ画面を提供せず、Better Authの自己登録エンドポイントも無効にする。
  ```

- [ ] **Step 2: Keep dated seed documents as history, with a first-page supersession link to the new design.**

  ```md
  > Superseded by [Turso RPC MVP Design](2026-07-19-turso-rpc-mvp-design.md). This document records the previous development setup.
  ```

- [ ] **Step 3: Verify the documentation has no accidental patch text or unfinished placeholders.**

  Run: `git diff --check && ! rg '(^|[^A-Z])(TODO|TBD)|\*\*\* Update' AGENTS.md docs`

  Expected: exit code `0` and no search results.

- [ ] **Step 4: Commit and request an independent documentation review.**

  ```bash
  git add AGENTS.md docs
  git commit -m "docs: define Turso RPC MVP"
  ```

### Task 2: Remove TypeSpec and API-Contract Tooling

**Worktree:** `~/.herdr/worktrees/pantry/remove-typespec`

**Branch / PR:** `chore/remove-typespec`

**Depends on:** Task 1 for the approved documentation, but can be implemented in parallel.

**Files:**

- Delete: `api-spec/main.tsp`
- Delete: `api-spec/tspconfig.yaml`
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `pnpm-lock.yaml`
- Modify: `.gitignore`

- [ ] **Step 1: Remove the failing legacy contract expectation from package metadata.**

  Delete the five `spec:*` scripts and the five TypeSpec dev dependencies from `package.json`; delete the `typespec` catalog from `pnpm-workspace.yaml`.

  ```json
  {
    "scripts": {
      "build": "vite build",
      "test": "vitest run",
      "typecheck": "tsgo"
    }
  }
  ```

- [ ] **Step 2: Remove the contract source and generated-output ignores.**

  Delete `api-spec/` and remove this obsolete `.gitignore` block:

  ```gitignore
  # TypeSpec output
  api-spec/tsp-output/
  api-spec/dist/
  ```

- [ ] **Step 3: Regenerate the lockfile without TypeSpec packages.**

  Run: `pnpm install --lockfile-only`

  Expected: `pnpm-lock.yaml` has no importer or catalog dependency on `@typespec/*`.

- [ ] **Step 4: Verify removal and the existing build.**

  Run: `! rg 'api-spec|@typespec|spec:' package.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore && pnpm run build`

  Expected: the search prints nothing and the build exits `0`.

- [ ] **Step 5: Commit and request independent review.**

  ```bash
  git add package.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore api-spec
  git commit -m "chore: remove TypeSpec tooling"
  ```

### Task 3: Configure Turso Credentials for Worker and Scripts

**Worktree:** `~/.herdr/worktrees/pantry/turso-runtime-config`

**Branch / PR:** `feat/turso-runtime-config`

**Depends on:** Task 2 must be merged before rebasing and opening this PR, because both tasks edit package metadata.

**Files:**

- Modify: `env.ts`
- Modify: `drizzle.config.ts`
- Modify: `auth.ts`
- Modify: `src/db/index.server.ts`
- Modify: `package.json`
- Modify: `worker-configuration.d.ts` (generated)
- Modify: `AGENTS.md`

- [ ] **Step 1: Define the Node-side environment contract.**

  Replace `DATABASE_URL` with the four explicit values:

  ```ts
  server: {
    BETTER_AUTH_SECRET: v.string(),
    BETTER_AUTH_URL: v.pipe(v.string(), v.url()),
    TURSO_AUTH_TOKEN: v.string(),
    TURSO_DATABASE_URL: v.pipe(v.string(), v.url())
  }
  ```

- [ ] **Step 2: Configure Turso connections with their auth token everywhere.**

  Use the same Drizzle connection fields in `auth.ts` and `src/db/index.server.ts`:

  ```ts
  connection: {
    authToken: env.TURSO_AUTH_TOKEN,
    url: env.TURSO_DATABASE_URL
  }
  ```

  In `drizzle.config.ts`, pass the same `url` and `authToken` as Turso credentials. Retain the existing `dialect: 'turso'` and forward-only migrations.

- [ ] **Step 3: Add a production migration command without placing credentials in source control.**

  Add this package script while keeping the existing dotenv-backed development command:

  ```json
  "migrate:prod": "drizzle-kit migrate"
  ```

  Update `AGENTS.md` to describe that `migrate:prod` consumes shell-provided Turso credentials.

- [ ] **Step 4: Regenerate Worker environment types from uncommitted local variable definitions.**

  Run: `pnpm run cf-typegen`

  Expected: `worker-configuration.d.ts` declares `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`, with no project `DATABASE_URL` binding.

- [ ] **Step 5: Verify type and production build compatibility.**

  Run: `pnpm run typecheck && pnpm run build`

  Expected: both commands exit `0`.

- [ ] **Step 6: Commit and request independent review.**

  ```bash
  git add env.ts drizzle.config.ts auth.ts src/db/index.server.ts package.json worker-configuration.d.ts AGENTS.md
  git commit -m "feat: configure Turso runtime credentials"
  ```

### Task 4: Restrict Authentication and Provision the Initial User

**Worktree:** `~/.herdr/worktrees/pantry/private-auth-provisioning`

**Branch / PR:** `feat/private-auth-provisioning`

**Depends on:** Task 3.

**Files:**

- Modify: `auth.ts`
- Modify: `src/features/auth/auth-config.ts`
- Modify: `scripts/create-user.ts`
- Modify: `scripts/seed.ts`
- Modify: `package.json`
- Delete: `src/routes/sign-up.tsx`
- Modify: `src/routeTree.gen.ts` (generated)
- Create: `scripts/create-user-input.ts`
- Create: `scripts/create-user-input.test.ts`
- Create: `src/features/auth/auth-options.ts`
- Create: `src/features/auth/auth-options.test.ts`

- [ ] **Step 1: Write a failing provisioner-input test.**

  Extract and test a parser that rejects missing values and returns the three required inputs:

  ```ts
  expect(
    parseCreateUserInput({
      PANTRY_USER_EMAIL: 'me@example.com',
      PANTRY_USER_NAME: 'Me',
      PANTRY_USER_PASSWORD: 'correct-horse-battery-staple'
    })
  ).toStrictEqual({
    email: 'me@example.com',
    name: 'Me',
    password: 'correct-horse-battery-staple'
  })
  ```

- [ ] **Step 2: Run the new test to confirm the missing parser fails.**

  Run: `pnpm run test -- scripts/create-user-input.test.ts`

  Expected: FAIL because `parseCreateUserInput` is not exported yet.

- [ ] **Step 3: Disable every public email/password registration path in both Better Auth instances.**

  Create a pure `createAuthOptions` helper, cover it with a test, and spread its return value into both auth instances:

  ```ts
  betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    disabledPaths: ['/sign-up/email'],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      maxPasswordLength: 128,
      minPasswordLength: 12
    },
    plugins: [admin()]
  })
  ```

  Test `disabledPaths` contains `/sign-up/email` and `emailAndPassword.disableSignUp` is `true`. Preserve `admin()` only for local `auth.api.createUser`; do not add its client plugin or any admin UI.

- [ ] **Step 4: Implement an idempotent local provisioner and make seed compatible.**

  Parse `PANTRY_USER_EMAIL`, `PANTRY_USER_NAME`, and `PANTRY_USER_PASSWORD` from `process.env`; look up by email; return success without creating a duplicate; otherwise call:

  ```ts
  await auth.api.createUser({
    body: { email, name, password, role: 'user' }
  })
  ```

  Replace `auth.api.signUpEmail` in `scripts/seed.ts` with the same server API. Add `create:user` to `package.json`:

  ```json
  "create:user": "pnpm dotenvx run -f .env.development -- pnpm tsx scripts/create-user.ts"
  ```

- [ ] **Step 5: Delete the UI signup route and regenerate the route tree.**

  Delete `src/routes/sign-up.tsx`, run the router generator through `pnpm run build`, and verify no `/sign-up` route remains in `src/routeTree.gen.ts`.

- [ ] **Step 6: Verify unit tests and static checks.**

  Run: `pnpm run test -- scripts/create-user-input.test.ts src/features/auth/auth-options.test.ts && pnpm run typecheck && pnpm run build`

  Expected: all commands exit `0`. The real `/api/auth/sign-up/email` rejection is exercised through Playwright MCP in Task 8.

- [ ] **Step 7: Commit and request independent review.**

  ```bash
  git add auth.ts src/features/auth scripts package.json src/routes/sign-up.tsx src/routeTree.gen.ts
  git commit -m "feat: restrict signup and add user provisioning"
  ```

### Task 5: Implement Safe Page-title Retrieval

**Worktree:** `~/.herdr/worktrees/pantry/page-title-fetcher`

**Branch / PR:** `feat/page-title-fetcher`

**Depends on:** None. This task can run in parallel with Tasks 2-4.

**Files:**

- Create: `src/features/bookmarks/title-fetcher.server.ts`
- Create: `src/features/bookmarks/title-fetcher.server.test.ts`
- Modify: `src/features/bookmarks/bookmark.function.ts`

- [ ] **Step 1: Write failing tests for valid title extraction, rejected private hosts, redirect limits, and network failure.**

  ```ts
  expect(await fetchPageTitle('https://example.com', fetchMock)).toBe('Example title')
  await expect(fetchPageTitle('http://127.0.0.1')).rejects.toThrow('URL is not allowed')
  expect(await fetchPageTitle('https://offline.example', failingFetch)).toBeNull()
  ```

- [ ] **Step 2: Run the test to verify it fails.**

  Run: `pnpm run test -- src/features/bookmarks/title-fetcher.server.test.ts`

  Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement a bounded, manual-redirect fetcher.**

  The implementation must:

  ```ts
  const MAX_REDIRECTS = 3
  const MAX_RESPONSE_BYTES = 1_000_000
  const TIMEOUT_MS = 3_000
  ```

  Parse each URL with `new URL`, only allow `http:` and `https:`, reject `localhost`, `.localhost`, IPv4 loopback/private/link-local/metadata addresses, and repeat validation for every redirect target. Call fetch with `redirect: 'manual'`, stop after three redirects, reject response `content-length` values above the limit, read no more than the limit from the stream, and return a trimmed HTML `<title>` or `null`. Network, timeout, malformed HTML, and non-HTML responses return `null`; only invalid requested addresses throw validation errors.

- [ ] **Step 4: Expose a validated Server Function for the registration form.**

  ```ts
  export const fetchBookmarkTitle = createServerFn({ method: 'POST' })
    .validator(v.object({ url: v.pipe(v.string(), v.url()) }))
    .handler(({ data }) => fetchPageTitle(data.url))
  ```

- [ ] **Step 5: Run focused and full verification.**

  Run: `pnpm run test -- src/features/bookmarks/title-fetcher.server.test.ts && pnpm run typecheck && pnpm run build`

  Expected: all commands exit `0`.

- [ ] **Step 6: Commit and request independent review.**

  ```bash
  git add src/features/bookmarks/title-fetcher.server.ts src/features/bookmarks/title-fetcher.server.test.ts src/features/bookmarks/bookmark.function.ts
  git commit -m "feat: fetch bookmark page titles safely"
  ```

### Task 6: Complete User-scoped Bookmark and Tag Operations

**Worktree:** `~/.herdr/worktrees/pantry/bookmark-domain`

**Branch / PR:** `feat/bookmark-domain`

**Depends on:** Task 3. Rebase Task 5 into this branch before opening the PR so the title Server Function is preserved.

**Files:**

- Create: `src/features/bookmarks/bookmark.service.ts`
- Create: `src/features/bookmarks/bookmark.service.test.ts`
- Modify: `src/features/bookmarks/bookmark.schema.ts`
- Modify: `src/features/bookmarks/bookmark.function.ts`
- Modify: `src/features/tags/tag.function.ts`
- Modify: `src/db/schema/bookmark.ts`
- Modify: `src/db/schema/tag.ts`
- Modify: `src/db/schema/bookmark-tag.ts`
- Create: `drizzle/<timestamp>_bookmark_query_indexes/migration.sql`

- [ ] **Step 1: Write failing service tests against a disposable libSQL database.**

  Cover tag normalization, tag reuse, tag replacement, query filtering, soft deletion, and user isolation:

  ```ts
  expect(normalizeTagNames([' React ', 'react', 'TypeScript'])).toStrictEqual([
    'react',
    'typescript'
  ])
  expect(
    (await listBookmarks(db, ownerId, { q: 'memo', tags: [], tagMode: 'and', offset: 0 })).items
  ).toHaveLength(1)
  await expect(getBookmark(db, otherUserId, bookmarkId)).rejects.toThrow('Bookmark not found')
  ```

- [ ] **Step 2: Run the service test to verify it fails.**

  Run: `pnpm run test -- src/features/bookmarks/bookmark.service.test.ts`

  Expected: FAIL because the service module does not exist.

- [ ] **Step 3: Define validated inputs and result shape.**

  ```ts
  export const bookmarkInputSchema = v.object({
    note: v.optional(v.nullable(v.string())),
    tags: v.pipe(v.array(tagNameSchema), v.maxLength(20)),
    title: v.pipe(v.string(), v.minLength(1)),
    url: v.pipe(v.string(), v.url())
  })

  export type BookmarkWithTags = BookmarkSelectType & {
    tags: readonly { id: number; name: string }[]
  }
  ```

  Validate list input with `q`, tag names, `tagMode`, `sort`, `limit: 50`, and `offset >= 0`.

- [ ] **Step 4: Implement transactions and all Server Function entry points.**

  Implement `createBookmark`, `getBookmark`, `listBookmarks`, `updateBookmark`, and `deleteBookmark` in the service. Every query must include `userId`; list/get must require `deletedAt IS NULL`; update replaces `bookmark_tags` inside the transaction; delete only sets `deletedAt` and `updatedAt`. Delegate to the service from Server Functions after `ensureSession()`.

  For list filtering, use title/URL/note `LIKE` clauses and a grouped tag subquery: OR uses `IN`, AND uses `HAVING count(distinct tag_id) = selectedTags.length`. Sort with `(createdAt DESC, id DESC)` or `(updatedAt DESC, id DESC)` and request `limit + 1` rows to return `{ items, hasMore }`.

- [ ] **Step 5: Add only the indexes required by the new list query.**

  Add a forward-only migration with indexes on `(user_id, deleted_at, created_at)` and `(user_id, deleted_at, updated_at)`. Do not rewrite existing migrations.

- [ ] **Step 6: Run focused and full tests.**

  Run: `pnpm run test -- src/features/bookmarks/bookmark.service.test.ts src/features/bookmarks/bookmark.function.test.ts src/features/tags/tag-name.schema.test.ts && pnpm run typecheck && pnpm run build`

  Expected: all commands exit `0`.

- [ ] **Step 7: Commit and request independent review.**

  ```bash
  git add src/features/bookmarks src/features/tags src/db/schema drizzle
  git commit -m "feat: complete bookmark and tag operations"
  ```

### Task 7: Build the Accessible Bookmark Workflow UI

**Worktree:** `~/.herdr/worktrees/pantry/bookmark-workflow-ui`

**Branch / PR:** `feat/bookmark-workflow-ui`

**Depends on:** Tasks 4-6.

**Files:**

- Create: `src/features/bookmarks/components/bookmark-form.tsx`
- Create: `src/features/bookmarks/components/tag-input.tsx`
- Create: `src/features/bookmarks/components/bookmark-filters.tsx`
- Create: `src/features/bookmarks/components/delete-bookmark-button.tsx`
- Modify: `src/features/bookmarks/components/bookmark-table.tsx`
- Modify: `src/routes/_protected/index.tsx`
- Modify: `src/routes/_protected/bookmarks/new/index.tsx`
- Modify: `src/routes/_protected/bookmarks/$id/index.tsx`
- Modify: `src/routes/_protected/bookmarks/$id/edit.tsx`
- Modify: `src/routes/_protected/-lib/bookmark-search-schema.ts`
- Modify: `src/routes/_protected/-lib/bookmark-search-schema.test.ts`
- Modify: `src/routes/_protected.tsx`
- Modify: `src/app.css`

- [ ] **Step 1: Expand search-schema tests before wiring controls.**

  ```ts
  expect(v.parse(bookmarkSearchSchema, {})).toStrictEqual({
    limit: 50,
    offset: 0,
    sort: 'newest',
    tagMode: 'and'
  })
  expect(
    v.parse(bookmarkSearchSchema, {
      q: 'react',
      tags: ['frontend'],
      tagMode: 'or',
      sort: 'updated',
      offset: 50
    }).offset
  ).toBe(50)
  ```

- [ ] **Step 2: Run the schema test to verify the new pagination expectation fails.**

  Run: `pnpm run test -- src/routes/_protected/-lib/bookmark-search-schema.test.ts`

  Expected: FAIL until `limit` and `offset` are part of the validated bookmark search.

- [ ] **Step 3: Implement the list and filter controls with URL state.**

  Render a labeled search input, multi-tag input, AND/OR radio group, and sort select. Every filter change navigates with `offset: 0`; the table links every title to `/bookmarks/$id`; the Load More button navigates with `offset + 50` only when `hasMore` is true.

  ```tsx
  <fieldset>
    <legend>タグの条件</legend>
    <label>
      <input
        type='radio'
        name='tagMode'
        value='and'
      />
      すべて含む
    </label>
    <label>
      <input
        type='radio'
        name='tagMode'
        value='or'
      />
      いずれか含む
    </label>
  </fieldset>
  ```

- [ ] **Step 4: Use one shared form for create and edit.**

  The form must expose URL, a `タイトルを取得` button, required title, memo textarea, tag input, inline error alert, and submit state. The title request updates only the title field; a `null` title reports failure without clearing manual input. Tags show selected chips with buttons named `タグ <name> を削除` and suggestions can be selected or entered as a new tag.

- [ ] **Step 5: Implement detail and destructive-action UX.**

  Detail loads the bookmark through `getBookmark`, shows a descriptive external link, tags, memo, and Japanese timestamps. The delete control opens a native `<dialog>` or Base UI dialog, traps focus while open, exposes `削除を確認` and `キャンセル`, calls `deleteBookmark`, and redirects to the filtered list with a success alert.

- [ ] **Step 6: Make protected navigation and responsive layout usable.**

  Add links for bookmarks, tags, settings, and sign-out with an `aria-label` on the primary navigation. Extend `src/app.css` with a single-column mobile-first layout, horizontal overflow for tables, visible `:focus-visible` outline, and responsive form/action rows. Preserve the existing kiso.css import.

- [ ] **Step 7: Run static tests and build.**

  Run: `pnpm run test && pnpm run typecheck && pnpm run build`

  Expected: all commands exit `0`.

- [ ] **Step 8: Commit and request independent review.**

  ```bash
  git add src/features/bookmarks src/routes/_protected src/app.css
  git commit -m "feat: complete bookmark management workflow"
  ```

### Task 8: Execute Local Browser Acceptance and Accessibility Checks

**Worktree:** `~/.herdr/worktrees/pantry/release-verification`

**Branch / PR:** `test: document release verification`

**Depends on:** Tasks 1-7 merged to `main`. This operational task has no application-code PR until its test record is committed.

**Files:**

- Create: `docs/release-verification/2026-07-19-turso-rpc-mvp.md`

- [ ] **Step 1: Prepare a disposable development account and data.**

  Run with uncommitted local credentials:

  ```bash
  pnpm run migrate:dev
  PANTRY_USER_EMAIL='me@example.com' PANTRY_USER_NAME='Me' PANTRY_USER_PASSWORD='a-long-unique-password' pnpm run create:user
  ```

  Expected: migrations apply and the first provisioning run creates exactly one user; a second run reports the user already exists.

- [ ] **Step 2: Run static and unit verification.**

  Run: `pnpm run format:check && pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build`

  Expected: every command exits `0`.

- [ ] **Step 3: Use Playwright MCP against local development.**

  Start `pnpm run dev`, then verify:

  ```text
  1. Unauthenticated / redirects to /sign-in.
  2. `POST /api/auth/sign-up/email` returns a non-2xx response for a random email/password payload.
  3. Keyboard sign-in reaches the bookmark list.
  4. Create a bookmark with a new tag and confirm its detail fields.
  5. Search by title, URL, and memo; compare AND and OR tag results.
  6. Edit title, memo, and tags; confirm updated ordering.
  7. Delete through the confirmation dialog and confirm the detail URL is unavailable.
  8. Force title retrieval failure and save a manually entered title.
  ```

- [ ] **Step 4: Run Playwright MCP accessibility and responsive checks.**

  At desktop and `390x844` viewport widths, inspect the accessibility snapshot and keyboard navigation. Record that each page has one H1, form controls have labels, selected-tag and delete controls have accessible names, alerts use `role='alert'`, focus enters and returns from the deletion dialog, and all primary actions are reachable with Tab/Enter.

- [ ] **Step 5: Hand off Turso/Cloudflare production operations to the user.**

  Do not configure production Turso credentials, set Cloudflare secrets, apply production migrations, deploy the Worker, or verify the deployed URL. The user owns those operations and repeats the local primary browser path after deployment.

- [ ] **Step 6: Record only non-secret results and commit.**

  Document command outcomes, browser flows, viewport sizes, accessibility checks, and deployed URL without credentials.

  ```bash
  git add docs/release-verification/2026-07-19-turso-rpc-mvp.md
  git commit -m "test: record Turso RPC MVP verification"
  ```
