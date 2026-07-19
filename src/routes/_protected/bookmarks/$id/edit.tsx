import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useActionState, useState } from 'react'
import * as v from 'valibot'

import type { BookmarkSelectType } from '../../../../db/schema/bookmark'
import type { TagSelectType } from '../../../../db/schema/tag'
import { getBookmark, updateBookmark } from '../../../../features/bookmarks/bookmark.function'
import { TagSelector } from '../../../../features/bookmarks/components/tag-selector'
import { fetchTags } from '../../../../features/tags/tag.function'

export const Route = createFileRoute('/_protected/bookmarks/$id/edit')({
  loader: async ({ params }) => {
    const bookmark = await getBookmark({ data: { id: params.id } })
    const tags = await fetchTags({ data: { limit: 1000, offset: 0 } })
    return { bookmark, tags }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { bookmark, tags } = Route.useLoaderData()
  const navigate = useNavigate()
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(bookmark.tagIds)

  async function submitAction({
    url,
    title,
    note
  }: {
    url: string
    title: string
    note: string | null
  }) {
    await updateBookmark({ data: { id: bookmark.id, url, title, note, tags: selectedTagIds } })

    await navigate({
      to: '/bookmarks/$id',
      params: { id: bookmark.id },
      state: { bookmarkUpdated: true }
    })
  }

  return (
    <div>
      <h1>ブックマーク編集</h1>

      <EditBookmarkForm
        bookmark={bookmark}
        allTags={tags}
        selectedTagIds={selectedTagIds}
        onTagChange={setSelectedTagIds}
        submitAction={submitAction}
      />

      <Link
        to='/bookmarks/$id'
        params={{ id: bookmark.id }}>
        詳細へ戻る
      </Link>
    </div>
  )
}

interface EditBookmarkFormProps {
  bookmark: BookmarkSelectType
  allTags: TagSelectType[]
  selectedTagIds: number[]
  onTagChange: (ids: number[]) => void
  submitAction: (values: { url: string; title: string; note: string | null }) => Promise<void>
}

function EditBookmarkForm({
  bookmark,
  allTags,
  selectedTagIds,
  onTagChange,
  submitAction
}: EditBookmarkFormProps) {
  const editBookmarkFormSchema = v.object({
    url: v.pipe(v.string(), v.url()),
    title: v.string(),
    note: v.nullable(v.string())
  })

  const editBookmarkForm = useForm({
    initialInput: {
      url: bookmark.url,
      title: bookmark.title,
      note: bookmark.note ?? ''
    },
    schema: editBookmarkFormSchema
  })

  const [_, throwError, isPending] = useActionState(async () => {
    const currentRawUrl = getInput(editBookmarkForm, { path: ['url'] }) ?? ''
    const currentRawTitle = getInput(editBookmarkForm, { path: ['title'] }) ?? ''
    const currentRawNote = getInput(editBookmarkForm, { path: ['note'] }) ?? ''
    const note = currentRawNote === '' ? null : currentRawNote

    await submitAction({ url: currentRawUrl, title: currentRawTitle, note })
  }, null)

  return (
    <form action={throwError}>
      <fieldset>
        <legend>ブックマーク編集</legend>

        <Field
          of={editBookmarkForm}
          path={['url']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              URL
              <Input
                id={field.props.name}
                value={field.input}
                type='url'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
                required
              />
            </label>
          )}
        </Field>

        <Field
          of={editBookmarkForm}
          path={['title']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              タイトル
              <Input
                id={field.props.name}
                value={field.input}
                type='text'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
                required
              />
            </label>
          )}
        </Field>

        <Field
          of={editBookmarkForm}
          path={['note']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              メモ
              <Input
                id={field.props.name}
                value={field.input ?? ''}
                type='text'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
              />
            </label>
          )}
        </Field>
      </fieldset>

      <TagSelector
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        onChange={onTagChange}
      />

      <button
        type='submit'
        disabled={isPending}>
        {isPending ? '更新中...' : '更新'}
      </button>
    </form>
  )
}
