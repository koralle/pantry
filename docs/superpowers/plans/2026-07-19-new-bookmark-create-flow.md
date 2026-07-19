# New Bookmark Create Flow Entry Points — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add entry points from the bookmark list to the new-bookmark creation screen (`/bookmarks/new`): a persistent header link, an in-list link, and confirm/neaten the "back to list" link on the creation screen. No changes to the creation form itself.

**Architecture:** Pure client-side navigation using the existing TanStack Router `Link` component. No Server Functions, DB schema, or validation changes. Three small edits across three existing files, then a Playwright walkthrough to verify the three navigation paths.

**Tech Stack:** TanStack Router (`Link`, `createFileRoute`), React, Base UI (`@base-ui/react`) where used, Vitest (existing tests unaffected), Playwright MCP (manual walkthrough verification).

---

## File Structure

- `src/routes/_protected.tsx` — Layout with `<header><nav>`. Add a "＋新規ブックマーク" `Link` in the nav, alongside existing タグ/設定 links.
- `src/routes/_protected/index.tsx` — List page (`/`). Add a "新規作成" `Link` near the heading, above the `BookmarkTable`.
- `src/routes/_protected/bookmarks/new/index.tsx` — Creation page. Verify the existing "一覧へ戻る" `Link`; tidy placement/labels only, no behavior change.

No new files. No test files (no logic to unit-test; verification is via Playwright walkthrough).

---

## Task 1: Add header link to new-bookmark creation

**Files:**
- Modify: `src/routes/_protected.tsx:48-68` (the `<header><nav>` block)

- [ ] **Step 1: Add the `Link` in the nav**

In `src/routes/_protected.tsx`, the `Layout` component's `<nav>` currently renders links to `/`, `/tags`, `/settings`. Add a new `Link` to `/bookmarks/new` after the existing nav links (before the Sign Out button). The file already imports `Link` from `@tanstack/react-router`, so no new import is needed.

Replace the nav block:

```tsx
        <nav>
          <Link
            to='/'
            search={{ tagMode: 'and', sort: 'newest' }}>
            Pantry
          </Link>
          <Link
            to='/tags'
            search={{ limit: 50, offset: 0 }}>
            タグ
          </Link>
          <Link to='/settings'>設定</Link>
          <Link to='/bookmarks/new'>＋新規ブックマーク</Link>
        </nav>
```

- [ ] **Step 2: Verify the app builds / typechecks**

Run: `pnpm run build`
Expected: build succeeds with no type errors referencing `_protected.tsx`.

(If `build` is slow, `pnpm exec tsc --noEmit` against the project config is an acceptable substitute; confirm no new errors.)

- [ ] **Step 3: Commit**

```bash
git add src/routes/_protected.tsx
git commit -m "feat: add header link to new bookmark creation screen"
```

---

## Task 2: Add in-list link to new-bookmark creation

**Files:**
- Modify: `src/routes/_protected/index.tsx:40-53` (the `RouteComponent` return)

- [ ] **Step 1: Add the `Link` near the heading**

In `src/routes/_protected/index.tsx`, `RouteComponent` returns a heading followed by the `BookmarkTable`. The file already imports `Link` from `@tanstack/react-router`. Add a "新規作成" `Link` between the `<h1>` and the `<ErrorBoundary>`.

Replace the `RouteComponent` return block:

```tsx
  return (
    <>
      <h1>{user.name}のブックマーク一覧</h1>

      <Link to='/bookmarks/new'>新規作成</Link>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<p>Loading...</p>}>
          <BookmarkTable bookmarkPromise={bookmarksPromise} />
        </Suspense>
      </ErrorBoundary>
    </>
  )
```

- [ ] **Step 2: Verify the app builds / typechecks**

Run: `pnpm run build`
Expected: build succeeds with no type errors referencing `index.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/_protected/index.tsx
git commit -m "feat: add in-list link to new bookmark creation screen"
```

---

## Task 3: Verify and tidy the creation screen's back-to-list link

**Files:**
- Modify (verify only, tidy if needed): `src/routes/_protected/bookmarks/new/index.tsx:26-39` (the `RouteComponent` return)

- [ ] **Step 1: Read the existing back link**

Open `src/routes/_protected/bookmarks/new/index.tsx`. Confirm the `RouteComponent` already contains:

```tsx
      <Link
        to='/'
        search={{ tagMode: 'and', sort: 'newest' }}>
        一覧へ戻る
      </Link>
```

- [ ] **Step 2: Tidy placement/labels if needed (no behavior change)**

The link already navigates to `/` with the default search. No change is required unless the label or placement is unclear. If tidying, keep the `to='/'` and `search={{ tagMode: 'and', sort: 'newest' }}` exactly as-is — only adjust surrounding structure (e.g. wrap in a `<nav>` or add an `aria-label`) for clarity. Do NOT change the destination or search params.

If no change is made, skip to Step 4. If a change is made, run:

`pnpm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit (only if a change was made in Step 2)**

```bash
git add src/routes/_protected/bookmarks/new/index.tsx
git commit -m "chore: tidy back-to-list link on new bookmark screen"
```

(If no change was made, do not commit — leave the working tree clean.)

- [ ] **Step 4: Confirm no working-tree changes remain from this task**

Run: `git status --short`
Expected: no unintended modifications to `src/routes/_protected/bookmarks/new/index.tsx` (or only the tidy commit if one was made).

---

## Task 4: Playwright walkthrough verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run (in a separate terminal): `pnpm run dev`
Wait until it prints a local URL (e.g. `http://localhost:5173` or the workerd local address).

- [ ] **Step 2: Sign in**

Using Playwright MCP, navigate to the dev server root, sign in with the dev credentials, and confirm you land on `/` (the list page).

- [ ] **Step 3: Verify path 1 — header link**

Click the header "＋新規ブックマーク" link. Confirm the URL becomes `/bookmarks/new` and the "ブックマーク新規作成" heading is visible.

- [ ] **Step 4: Verify path 2 — in-list link**

Navigate back to `/`. Click the in-list "新規作成" link (near the heading). Confirm the URL becomes `/bookmarks/new`.

- [ ] **Step 5: Verify path 3 — back-to-list link**

On `/bookmarks/new`, click "一覧へ戻る". Confirm the URL becomes `/` and the list table is visible.

- [ ] **Step 6: Accessibility spot-check**

Confirm each of the three links has a clear, readable label and is reachable/activatable via keyboard (Tab to focus, Enter to navigate).

- [ ] **Step 7: Stop the dev server**

Stop the `pnpm run dev` process started in Step 1.

---

## Self-Review Notes

- **Spec coverage:** Spec sections a (header link) → Task 1; b (in-list link) → Task 2; c (back link verify/tidy) → Task 3; testing/verification (3 paths) → Task 4. All covered.
- **Placeholder scan:** No TBD/TODO/"similar to" patterns. All code blocks are complete.
- **Type consistency:** `Link` import already present in all three files; `to` paths match existing route tree (`/bookmarks/new`, `/`, `/tags`, `/settings`). Search param shape for `/` matches the existing "一覧へ戻る" link and the header "Pantry" link. Consistent.
- **Out of scope (confirmed excluded):** title auto-fetch, tag selection/creation, note input, form restructuring — not in this plan.
