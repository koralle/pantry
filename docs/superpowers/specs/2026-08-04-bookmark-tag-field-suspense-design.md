# BookmarkTagField Suspense Design

## 1. Purpose

Replace the manual tag-loading state machine in `BookmarkEditor` with a React-native async boundary built from `Suspense`, `ErrorBoundary`, and `use()`.

The bookmark form must render without waiting for selectable tags. Only the tag field may show a loading or error state.

## 2. Goals

- Make `BookmarkTagField` a real public React component.
- Use `Suspense` for the selectable-tag Promise.
- Use `ErrorBoundary` for rejected or failed tag loading.
- Keep the existing `Result` type at the application and Server Function boundaries.
- Retry by replacing the resource Promise, not by rebuilding a parent-owned loading state machine.
- Keep bookmark form errors and tag-field errors separate.
- Keep the existing tag creation, selection, and server-error behavior.

## 3. Non-goals

- Do not introduce `useActionState` for selectable-tag loading.
- Do not redesign tag creation or bookmark save actions.
- Do not change the route loader's partial-rendering behavior.
- Do not change the visual design of the field.
- Do not introduce TanStack Query for this screen.

## 4. Component Structure

`BookmarkTagField` becomes the public component and owns the async boundary:

```text
BookmarkTagField
|- ErrorBoundary
|  `- Suspense
|     `- BookmarkTagFieldAsync
|        `- Blank or Ready
```

### `BookmarkTagField`

- Receives the initial tag Promise and the tag-loading function.
- Stores only the current retry resource and replaces it on retry.
- Uses a newly received `initialTags` Promise as the resource when its identity changes.
- Ensures a retry started from an older `initialTags` Promise cannot replace newer initial data.
- Renders the `ErrorBoundary` and `Suspense` boundaries.
- Renders the existing `Loading` view as the Suspense fallback.
- Renders the existing `Error` view as the ErrorBoundary fallback.
- Preserves `serverError` in both loading and error views.

### `BookmarkTagFieldAsync`

- Reads the Promise with `use()`.
- Converts a failed `Result` into a tag-loading error thrown during render.
- Renders `Blank` when no selectable tags exist.
- Renders `Ready` when selectable tags exist.
- Owns the in-memory candidate-list update after a tag is created.
- Not part of the public component API.

### Presentational views

`Loading`, `Error`, `Blank`, and `Ready` remain display-focused components. They do not manage the tag-loading lifecycle.

## 5. Public API

`BookmarkEditor` will render one component instead of selecting a view from a `tagsState` union:

```tsx
<BookmarkTagField
  initialTags={initialTags}
  onLoadSelectableTags={onLoadSelectableTags}
  selectedTagIds={selectedTagIds}
  onSelectedTagIdsChange={setSelectedTagIds}
  onCreateTag={onCreateTag}
  serverError={editorError?.tags ?? null}
  onClearServerError={clearTagsError}
/>
```

The public props are the existing selection, creation, and server-error props plus:

- `initialTags: Promise<SelectableTagsResult>`
- `onLoadSelectableTags: LoadSelectableTags`

The `BookmarkTagField.Loading`, `BookmarkTagField.Error`, `BookmarkTagField.Blank`, and `BookmarkTagField.Ready` namespace object is removed. The public API is the `BookmarkTagField` component itself.

## 6. Data and Error Flow

1. The route loader starts `loadSelectableTags()` without awaiting it.
2. The route passes the Promise to `BookmarkEditor`.
3. `BookmarkEditor` passes the Promise and reload function to `BookmarkTagField`.
4. `BookmarkTagFieldAsync` calls `use(tagsPromise)`.
5. A pending Promise suspends only the tag subtree.
6. A successful `Result.Ok` becomes `Blank` or `Ready`.
7. A `Result.Err` is converted to a tag-loading error and thrown.
8. A rejected load is normalized to the same tag-loading failure path.
9. `ErrorBoundary` displays the fixed message `タグ候補の取得に失敗しました` and a retry button.

Raw exception messages are not displayed to users.

The existing application-level `Result` contract remains unchanged. The conversion from `Result.Err` to a thrown UI error happens only at the `BookmarkTagFieldAsync` presentation boundary.

## 7. Retry Behavior

The retry button is a normal event-driven resource replacement, not a `useActionState` action.

- Call `onLoadSelectableTags()` to create a new Promise.
- Normalize synchronous throws and Promise rejections into the existing load-error contract.
- Replace the current Promise in `BookmarkTagField`.
- Reset the ErrorBoundary.
- Show the tag-only Suspense fallback while the new Promise is pending.
- Render the resolved tag field or ErrorBoundary fallback based on the new result.

Retry does not reset the bookmark form, selected tag IDs, created-tag state outside the field, or unrelated server errors.

`useActionState` is intentionally not used because selectable-tag loading is a read resource consumed by `use()`. Using `useActionState` would add a second loading/result state model and would not itself provide Suspense behavior. It remains a candidate for future mutation flows such as tag creation or bookmark saving.

## 8. Tag Creation Behavior

`BookmarkTagFieldAsync` owns the resolved candidate list used by the field.

- On successful creation, add the tag if it is not already present.
- Add the tag ID through `onSelectedTagIdsChange` if it is not selected.
- Clear the query input.
- When the initial result was empty, transition from `Blank` to `Ready` with the new tag selected.

The editor continues to own the selected tag IDs because they are part of the bookmark update command. The field owns only the displayed candidate list.

## 9. BookmarkEditor Simplification

Remove the tag-loading orchestration from `BookmarkEditor`:

- `TagsViewState`
- `tagsState`
- `resolveTagsState`
- `loadTagsState`
- `latestTagsRequest`
- tag-loading `useEffect`
- tag-loading `useTransition`
- `handleTagCreated`

Keep the editor's selection state, update handling, server-error ownership, and form submission behavior unchanged.

## 10. Verification

Storybook `play` functions remain the UI verification source of truth.

Cover these scenarios:

- Initial tag loading leaves the main form usable and suspends only the tag field.
- Successful loading renders `Ready`.
- An empty result renders `Blank`.
- A `Result.Err` renders the ErrorBoundary fallback.
- A rejected Promise renders the same fallback without exposing a raw error.
- Retry replaces the Promise and resolves back to `Ready`.
- Retry failure returns to the ErrorBoundary fallback.
- Creating a tag in `Blank` adds and selects the new candidate.
- Creating a tag in `Ready` adds and selects the new candidate.
- Tag server errors are shown in the tag area and cleared by tag operations.
- URL/title changes do not clear tag server errors.

Application tests for `recoverSelectableTagsPromise` remain valid. Add focused tests only if the resource-normalization helper is extracted into application code.

Run the repository verification commands after implementation:

```text
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
```

## 11. Change Scope

Expected implementation files:

- `src/features/bookmarks/components/bookmark-editor/bookmark-tag-field/index.tsx`
- `src/features/bookmarks/components/bookmark-editor/bookmark-tag-field/async.tsx`
- `src/features/bookmarks/components/bookmark-editor/bookmark-tag-field/views.tsx`
- `src/features/bookmarks/components/bookmark-editor/bookmark-tag-field/types.ts`
- `src/features/bookmarks/components/bookmark-editor/bookmark-tag-field/index.stories.tsx`
- `src/features/bookmarks/components/bookmark-editor/index.tsx`
- `src/features/bookmarks/components/bookmark-editor/index.stories.tsx`

The route and application loading contract should remain unchanged unless implementation reveals a concrete Promise-rejection handling issue.
