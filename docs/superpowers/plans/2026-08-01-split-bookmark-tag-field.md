# BookmarkTagField File Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `BookmarkTagField` into a focused directory while preserving the existing `BookmarkTagField.Loading/Error/Blank/Ready` API and behavior.

**Architecture:** Keep `index.tsx` as the public compound-component entry point. Move shared types, Panda styles, frame markup, create-tag action logic, query/create UI, server-error notice, and state views into focused sibling modules. Move the component Storybook file beside the entry point.

**Tech Stack:** React 19, TypeScript, Base UI, Valibot, Storybook CSF Next, Panda CSS.

---

### Task 1: Establish the refactor boundary

**Files:**

- Read: `src/features/bookmarks/components/bookmark-tag-field.tsx`
- Read: `src/features/bookmarks/components/bookmark-tag-field.stories.tsx`
- Read: `src/features/bookmarks/components/bookmark-editor.tsx`

- [ ] Confirm the public exports remain `BookmarkTagField.Loading`, `BookmarkTagField.Error`, `BookmarkTagField.Blank`, and `BookmarkTagField.Ready`.
- [ ] Run `pnpm run typecheck` and `pnpm run build-storybook` before moving files so the refactor has a baseline.

### Task 2: Extract shared tag-field modules

**Files:**

- Create: `src/features/bookmarks/components/bookmark-tag-field/types.ts`
- Create: `src/features/bookmarks/components/bookmark-tag-field/styles.ts`
- Create: `src/features/bookmarks/components/bookmark-tag-field/frame.tsx`
- Create: `src/features/bookmarks/components/bookmark-tag-field/server-error-notice.tsx`
- Create: `src/features/bookmarks/components/bookmark-tag-field/use-create-tag-action.ts`
- Create: `src/features/bookmarks/components/bookmark-tag-field/query-and-create.tsx`

- [ ] Move `CreateTag`, `CreateTagError`, `CreateTagResult`, `SelectableTag`, `TagId`, and `SelectionProps` type declarations or re-exports into `types.ts`.
- [ ] Move all tag-field Panda CSS recipes into `styles.ts` without changing token names or values.
- [ ] Move `Frame` into `frame.tsx`; keep the semantic `fieldset`, `legend`, `aria-label='タグ'`, and child composition unchanged.
- [ ] Move `ServerErrorNotice` and its Why comment into `server-error-notice.tsx`.
- [ ] Move `createErrorMessage`, `parseCreateName`, `runCreateTag`, and `useCreateTagAction` into `use-create-tag-action.ts`; preserve Valibot parsing and local create-error clearing.
- [ ] Move `QueryAndCreate` into `query-and-create.tsx`; preserve `onBeforeCreate`, input clearing, pending state, and `role='alert'` for create errors.

### Task 3: Extract state views and preserve the public API

**Files:**

- Create: `src/features/bookmarks/components/bookmark-tag-field/views.tsx`
- Create: `src/features/bookmarks/components/bookmark-tag-field/index.tsx`
- Delete: `src/features/bookmarks/components/bookmark-tag-field.tsx`

- [ ] Move `Loading`, `ErrorState`, `Blank`, and `Ready` into `views.tsx` with their current props and behavior.
- [ ] Preserve the Why comments explaining server-error ownership and tag-specific clearing.
- [ ] Export the compound API from `index.tsx` exactly as follows:

```ts
export const BookmarkTagField = {
  Loading,
  Error: ErrorState,
  Blank,
  Ready
}
```

- [ ] Re-export the public tag-related types from `index.tsx` so existing imports continue to work.

### Task 4: Move Storybook into the directory

**Files:**

- Create: `src/features/bookmarks/components/bookmark-tag-field/index.stories.tsx`
- Delete: `src/features/bookmarks/components/bookmark-tag-field.stories.tsx`

- [ ] Update Storybook imports from `./bookmark-tag-field` to `./index`.
- [ ] Update the preview import path for the additional directory depth.
- [ ] Preserve all existing stories, including server-error display and tag-selection clearing stories.

### Task 5: Verify the split

**Files:**

- Verify: `src/features/bookmarks/components/bookmark-editor.tsx`
- Verify: `src/features/bookmarks/components/bookmark-tag-field/index.stories.tsx`

- [ ] Confirm `BookmarkEditor` still imports `./bookmark-tag-field` and resolves to the new `index.tsx`.
- [ ] Run `pnpm run typecheck`.
- [ ] Run `pnpm run test`.
- [ ] Run `pnpm run format:check`.
- [ ] Run `pnpm run build-storybook`.
- [ ] Run `pnpm run build`.
- [ ] Run `git diff --check` and confirm only the intended tag-field files changed.
