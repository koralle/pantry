# BookmarkForm Formisch Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `BookmarkForm` from local React state and manual Valibot parsing to the project's existing Formisch React pattern without changing its public behavior.

**Architecture:** `BookmarkForm` will create a Formisch store from a shared object schema composed from the existing branded bookmark schemas. Formisch will own raw field input, validation, field errors, submit validation, and submitting state. Title fetching remains a separate asynchronous interaction that reads and writes the Formisch store; server/editor errors remain UI-facing props and are synchronized into Formisch field errors where appropriate.

**Tech Stack:** React, `@formisch/react`, Formisch `Form`/`Field`, Valibot, Base UI `Input`, Storybook play tests, Vitest, TypeScript.

---

### Task 1: Define the Formisch bookmark form schema

**Files:**

- Create: `src/features/bookmarks/components/bookmark-form-schema.ts`
- Test: `src/features/bookmarks/components/bookmark-form-schema.test.ts`

- [ ] **Step 1: Write the failing schema contract test**

Add tests that prove the schema accepts the existing initial input shape and returns the existing branded output shape, including empty-note normalization:

```ts
import { describe, expect, test } from 'vitest'

import { bookmarkFormSchema } from './bookmark-form-schema'

describe('bookmarkFormSchema', () => {
  test('parses URL and title into branded values', () => {
    const result = v.safeParse(bookmarkFormSchema, {
      url: 'https://example.com/article',
      title: 'Example Article',
      note: 'memo'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output.url).toBe('https://example.com/article')
      expect(result.output.title).toBe('Example Article')
      expect(result.output.note).toBe('memo')
    }
  })

  test('normalizes an empty note to null', () => {
    const result = v.safeParse(bookmarkFormSchema, {
      url: 'https://example.com/article',
      title: 'Example Article',
      note: ''
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output.note).toBeNull()
    }
  })
})
```

Import `* as v from 'valibot'` in the test. The test must fail until the schema file exists.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `pnpm vitest run src/features/bookmarks/components/bookmark-form-schema.test.ts`

Expected: FAIL because `./bookmark-form-schema` does not exist.

- [ ] **Step 3: Implement the schema and output type**

Create the schema using the existing domain schemas so Formisch's output remains branded:

```ts
import * as v from 'valibot'

import {
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../domain/bookmark-values'

export const bookmarkFormSchema = v.object({
  url: bookmarkUrlSchema,
  title: bookmarkTitleSchema,
  note: bookmarkNoteSchema
})

export type BookmarkFormInput = v.InferInput<typeof bookmarkFormSchema>
export type BookmarkFormOutput = v.InferOutput<typeof bookmarkFormSchema>
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm vitest run src/features/bookmarks/components/bookmark-form-schema.test.ts`

Expected: PASS.

### Task 2: Add behavior tests for the Formisch-backed BookmarkForm

**Files:**

- Modify: `src/features/bookmarks/components/bookmark-form.stories.tsx`

- [ ] **Step 1: Add a submit test that specifies Formisch output behavior**

Add a Storybook play test that clicks submit with valid initial values and asserts `onSubmit` receives URL, title, and `note` with an empty note normalized to `null`. Keep the existing `SubmitsBrandedValues` story and change its initial note to `''` or add a focused `NormalizesEmptyNote` story so this behavior is explicit.

- [ ] **Step 2: Add a field interaction test for Formisch error clearing**

Add a play test that submits invalid URL/title, verifies the field messages, then changes URL and title and verifies the corresponding field messages disappear. This locks in the existing `clearFieldError` behavior after migration.

- [ ] **Step 3: Add a title-fetch integration test**

Add a play test using an `onFetchTitle` spy that clicks `タイトルを取得`, verifies it receives the current URL, and verifies the title input becomes the fetched title.

- [ ] **Step 4: Run the updated Storybook test suite before implementation**

Run: `pnpm test -- src/features/bookmarks/components/bookmark-form.stories.tsx`

Expected: the new tests fail or cannot be executed until the migration is implemented; existing stories should remain the baseline for behavior.

### Task 3: Migrate BookmarkForm state and field rendering to Formisch

**Files:**

- Modify: `src/features/bookmarks/components/bookmark-form.tsx`
- Modify: `src/features/bookmarks/components/bookmark-form.stories.tsx`

- [ ] **Step 1: Replace manual field state and parser imports**

Import `Field`, `Form`, `getInput`, `setErrors`, `setInput`, and `useForm` from `@formisch/react`. Import `useEffect`, `useId`, and `useState` from React. Remove `FormEvent`, `parseSubmitValues`, `err`, `ok`, `Result`, and the three input `useState` calls.

- [ ] **Step 2: Initialize the Formisch store from initial values**

Create the store once inside `BookmarkForm`:

```ts
const form = useForm({
  initialInput: {
    url: initialValues.url,
    title: initialValues.title,
    note: initialValues.note
  },
  schema: bookmarkFormSchema
})
```

Use `form.isSubmitting` together with `isFetchingTitle` to calculate the disabled state. Keep the existing external `submission` prop temporarily only if the parent contract still requires it; remove it if the compiler and parent behavior confirm Formisch covers the same pending period.

- [ ] **Step 3: Replace the native form submit handler with Formisch Form**

Render `<Form of={form} onSubmit={onSubmit}>` with the existing class, `aria-describedby`, and children. Formisch will prevent default submission, validate the schema, focus the first invalid field, and pass `BookmarkFormOutput` to `onSubmit`.

Preserve the existing summary rendering for `errors.summary`, `titleFetchError`, and tag errors. Add the Formisch form-level errors to the summary without duplicating the same message.

- [ ] **Step 4: Render URL, title, and note through Field**

For each field, use the established project pattern:

```tsx
<Field
  of={form}
  path={['title']}>
  {(fieldProps) => (
    <Input
      id={fieldProps.props.name}
      name={fieldProps.props.name}
      value={fieldProps.input ?? ''}
      onValueChange={fieldProps.onChange}
    />
  )}
</Field>
```

Use `fieldProps.errors?.[0]` for field-level error display, preserve `aria-invalid`, and preserve the existing `aria-describedby` IDs. Keep the title-fetch button in the URL field row because it consumes the URL and updates the title.

- [ ] **Step 5: Remove manual validation and local field-error merging**

Delete `issueMessage`, `parseSubmitValues`, `mergeFieldErrors`, `LocalFieldErrors`, `localFields`, `localSummary`, `clearFieldError`, and `handleSubmit`. Formisch owns schema errors. Keep only interaction-specific title-fetch state and the external error synchronization described in Task 4.

- [ ] **Step 6: Run focused component tests and typecheck**

Run: `pnpm test -- src/features/bookmarks/components/bookmark-form.stories.tsx`

Run: `pnpm run typecheck`

Expected: the focused stories pass and TypeScript accepts the Formisch output as `BookmarkFormSubmitValues`.

### Task 4: Preserve title fetching and synchronize external errors

**Files:**

- Modify: `src/features/bookmarks/components/bookmark-form.tsx`
- Modify: `src/features/bookmarks/components/bookmark-editor.tsx` only if the `submission` prop is removed
- Modify: `src/features/bookmarks/components/bookmark-form.stories.tsx`

- [ ] **Step 1: Move title fetching to Formisch input access**

Implement the fetch handler using the current URL from Formisch and write the result back to the title field:

```ts
const url = getInput(form, { path: ['url'] }) ?? ''
const fetched = await onFetchTitle(url)
if (fetched !== null) {
  setInput(form, { path: ['title'], input: fetched })
  setErrors(form, { path: ['title'], errors: null })
}
```

Keep the current empty URL message, null result message, exception fallback, and loading state. Do not put title-fetch failure into the schema because it is not input validation.

- [ ] **Step 2: Synchronize editor-provided field errors**

When `errors.fields.url`, `errors.fields.title`, or `errors.fields.note` changes, call `setErrors` for the corresponding Formisch path. Clear a field's external error when its input changes. Keep `errors.summary` and `errors.fields.tags` in the form summary because tags are injected children and are not part of this schema.

- [ ] **Step 3: Preserve pending and duplicate-submit behavior**

Ensure the fieldset and submit button are disabled when either `form.isSubmitting` or `isFetchingTitle` is true. Ensure title fetching remains unavailable while submission is pending and submission remains unavailable while fetching.

- [ ] **Step 4: Run title-fetch and error stories**

Run: `pnpm test -- src/features/bookmarks/components/bookmark-form.stories.tsx`

Expected: title replacement, title-fetch failure messaging, field validation, server error display, and pending state all pass.

### Task 5: Full verification and cleanup

**Files:**

- Modify: `src/features/bookmarks/components/bookmark-form.tsx` only for cleanup discovered by verification
- Modify: `src/features/bookmarks/components/bookmark-form-schema.ts` only for schema/type cleanup discovered by verification

- [ ] **Step 1: Run the complete test suite**

Run: `pnpm run test`

Expected: PASS.

- [ ] **Step 2: Run typecheck and lint**

Run: `pnpm run typecheck`

Run: `pnpm run lint`

Expected: no TypeScript or lint errors.

- [ ] **Step 3: Run formatting verification**

Run: `pnpm run format:check`

Expected: PASS. If formatting is required, run `pnpm run format` only on the changed files, then rerun `pnpm run format:check`.

- [ ] **Step 4: Review the final diff**

Run: `git diff -- src/features/bookmarks/components/bookmark-form.tsx src/features/bookmarks/components/bookmark-form-schema.ts src/features/bookmarks/components/bookmark-form-schema.test.ts src/features/bookmarks/components/bookmark-form.stories.tsx src/features/bookmarks/components/bookmark-editor.tsx`

Confirm that no unrelated files, generated database files, or editor configuration changes are included.
