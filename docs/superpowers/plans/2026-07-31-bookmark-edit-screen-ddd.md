# Bookmark Edit Screen DDD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate the bookmark edit screen into Domain / Application / Server Function / UI layers with branded values, Result contracts, deferred tag loading, and Storybook Route Stories.

**Architecture:** RouteComponent remains the Screen. Loaders and mutations go through `functions/*` → `application/*` → Domain brands. `BookmarkEditor` receives injected ports (`executeUpdate`, `loadSelectableTags`, `createTag`) so Storybook can fake them. Tags load as a deferred Promise; the form body stays usable on tag load failure.

**Tech Stack:** TanStack Start Server Functions, Drizzle/Turso, Valibot brands, React 19, Storybook play functions, Vitest.

## Global Constraints

- No Repository abstraction.
- Shared Result is only `ok` / `err` in `src/shared/domain/result.ts`.
- Brands only from `v.safeParse` output — never `as Brand`.
- UI does not import Server Functions / Router / DB (except Route Screen).
- Japanese design-rationale comments at the four locations named in the spec.
- Do not commit unless the user asks.

## File Structure

**Create**

- `src/shared/domain/result.ts` (+ test)
- `src/features/auth/domain/auth-values.ts` (+ test)
- `src/features/bookmarks/domain/bookmark-values.ts` (+ test)
- `src/features/bookmarks/domain/bookmark.ts` (+ test) — aggregate helpers (tagId uniqueness)
- `src/features/tags/domain/tag-values.ts` (+ test; migrate from `lib/tag-name-schema`)
- `src/features/bookmarks/application/load-bookmark-for-edit.ts` (+ test)
- `src/features/bookmarks/application/load-selectable-tags.ts` (+ test)
- `src/features/bookmarks/application/execute-update-bookmark.ts` (+ test)
- `src/features/tags/application/create-tag.ts` (+ test) — or bookmarks-facing create wrapper
- `src/features/bookmarks/functions/load-bookmark-for-edit.ts`
- `src/features/bookmarks/functions/load-selectable-tags.ts`
- `src/features/bookmarks/functions/update-bookmark.ts` (rewrite)
- `src/features/tags/functions/create-tag.ts` (thin Result wrapper; may wrap existing add-tag)
- `src/features/bookmarks/components/bookmark-editor.tsx` (+ stories)
- `src/features/bookmarks/components/bookmark-form.tsx` (+ stories)
- `src/features/bookmarks/components/bookmark-tag-field.tsx` (+ stories)
- `src/db/app-db.ts` — `AppDb` type export from `getDB`

**Modify**

- `src/routes/_protected/bookmarks/$id/edit.tsx` — Screen wiring, deferred tags
- `src/routes/_protected/bookmarks/$id/edit.stories.tsx` — full Route Story set
- `docs/testing.md` — Storybook play as UI browser-test source of truth
- Retire / thin: `loaders/load-bookmark-editor.ts`, `edit-bookmark-workbench.tsx` usage on edit route

## Tasks

### Task 1: Result + branded domain values

- [ ] RED/GREEN: `result.ts` ok/err
- [ ] RED/GREEN: BookmarkId (uuid v7), BookmarkUrl (http/https), BookmarkTitle (non-empty after trim, keep edges), BookmarkNote (blank→null), TagId (positive int), TagName (trim+lower+nonempty+≤32), UserId
- [ ] RED/GREEN: Bookmark aggregate rejects duplicate tagIds

### Task 2: Application use cases

- [ ] RED/GREEN: `loadBookmarkForEdit` → Ok(BookmarkEditorData) | Err(bookmark-not-found)
- [ ] RED/GREEN: `loadSelectableTags` → Result of SelectableTag[]
- [ ] RED/GREEN: `executeUpdateBookmark` transaction order, error codes, unique-constraint→duplicate-url
- [ ] RED/GREEN: createTag Result contract for injected port

### Task 3: Server Functions

- [ ] Wire session + AppDb + brand parse → application
- [ ] Known business errors as Result; unexpected as HTTP 500-safe

### Task 4: UI composition

- [ ] `BookmarkForm` — local input + safeParse → branded values / BookmarkFormError
- [ ] `BookmarkTagField` — loading / blank / error / success + retry/create callbacks
- [ ] `BookmarkEditor` — selected tags, ports, map UpdateBookmarkError → form errors
- [ ] Route Screen — await bookmark, start tags promise without await, inject ports, not-found Blank

### Task 5: Storybook + docs + verify

- [ ] Route Stories listed in spec (at least Default, NotFound, tag loading/empty/error/retry, update errors, create tag)
- [ ] Component Stories for Editor/Form/TagField
- [ ] Append Storybook play policy to `docs/testing.md`
- [ ] `pnpm run test` (scoped) + `pnpm run typecheck`
