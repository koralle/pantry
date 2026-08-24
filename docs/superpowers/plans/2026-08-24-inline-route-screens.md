# Inline Route Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each page route the direct owner of its page composition and remove all feature-level `*-screen` wrappers.

**Architecture:** Copy each screen component's page-level imports, styles, hooks, loader data usage, and JSX into its route component. Preserve reusable feature components and existing behavior. Move the three source-boundary tests to read their route files, then delete the obsolete screen files and test entries.

**Tech Stack:** TanStack Start, TanStack Router, React, TanStack Query, oRPC, Vitest, TypeScript.

---

### Task 1: Inline page implementations into routes

**Files:**

- Modify: `src/routes/_protected/bookmarks/new/index.tsx`
- Modify: `src/routes/_protected/bookmarks/$id/index.tsx`
- Modify: `src/routes/_protected/tags/index.tsx`
- Modify: `src/routes/_protected/tags/new.tsx`
- Modify: `src/routes/_protected/tags/$id/index.tsx`
- Modify: `src/routes/_protected/tags/$id.edit.tsx`
- Modify: `src/routes/_protected/settings/index.tsx`
- Modify: `src/routes/sign-in/index.tsx`

- [ ] Copy each corresponding screen component's imports and implementation into the existing `RouteComponent`, resolving relative imports for the route depth.
- [ ] Keep route-specific `Route.useSearch`, `Route.useParams`, loader data, and route loaders as the single source of page inputs.
- [ ] Keep existing reusable feature components as children and retain all current mutation, error, loading, navigation, and success-flash behavior.
- [ ] Remove the local `SignInScreen` function by placing its router mutation and JSX directly in `RouteComponent`.

### Task 2: Move source-boundary tests and remove wrappers

**Files:**

- Create: `src/routes/_protected/bookmarks/new/index.test.ts`
- Create: `src/routes/_protected/tags/new.test.ts`
- Create: `src/routes/_protected/tags/$id.edit.test.ts`
- Delete: `src/features/bookmarks/components/new-bookmark-screen.test.ts`
- Delete: `src/features/tags/components/new-tag-screen.test.ts`
- Delete: `src/features/tags/components/edit-tag-screen.test.ts`
- Modify: `vitest.config.ts`
- Delete: `src/features/bookmarks/components/new-bookmark-screen.tsx`
- Delete: `src/features/tags/components/new-tag-screen.tsx`
- Delete: `src/features/tags/components/edit-tag-screen.tsx`
- Delete: `src/features/tags/components/tag-management-screen.tsx`
- Delete: `src/features/tags/components/tag-detail-screen.tsx`
- Delete: `src/features/bookmarks/components/bookmark-detail-screen.tsx`
- Delete: `src/features/settings/components/settings-screen.tsx`

- [ ] Move the three tests beside their matching routes, update imports/source reads to route-relative paths, and keep their assertions about oRPC and typed error contracts.
- [ ] Rename the test descriptions from `Screen` to route/page terminology without changing tested behavior.
- [ ] Replace the three feature test entries in `vitest.config.ts` with the three route test paths.
- [ ] Delete all seven wrappers and verify no source import or filename reference remains.

### Task 3: Update comments and verify

**Files:**

- Modify: `src/routes/_protected/bookmarks/$id/index.tsx`
- Modify: `src/routes/_protected/bookmarks/$id/edit.tsx`
- Modify: `docs/testing.md` only if its route-story wording is stale after the move.

- [ ] Replace comments that describe a deleted feature `Screen` boundary with route ownership wording.
- [ ] Run `pnpm run format:check` and `pnpm run lint`.
- [ ] Run `pnpm run typecheck` and `pnpm run test`.
- [ ] Run `pnpm run build`.
- [ ] Grep for all seven deleted filenames and `Screen` imports, then inspect `git diff` and `git status` for unrelated changes.

### Task 4: Commit the implementation

- [ ] Commit only the route changes, test updates, deletions, and necessary documentation changes in the Herdr worktree.
- [ ] Record the commit hash and verification output for the completion audit.
