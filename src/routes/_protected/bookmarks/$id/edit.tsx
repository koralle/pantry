import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useActionState } from 'react'
import * as v from 'valibot'

import type { BookmarkSelectType } from '../../../../db/schema/bookmark'
import { getBookmark, updateBookmark } from '../../../../features/bookmarks/bookmark.function'

export const Route = createFileRoute('/_protected/bookmarks/$id/edit')({
  loader: async ({ params }) => {
    const bookmark = await getBookmark({ data: { id: params.id } })
    return { bookmark }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { bookmark } = Route.useLoaderData()
  const navigate = useNavigate()

  async function submitAction({
    url,
    title,
    note
  }: {
    url: string
    title: string
    note: string | null
  }) {
    await updateBookmark({ data: { id: bookmark.id, url, title, note } })

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
  submitAction: (values: { url: string; title: string; note: string | null }) => Promise<void>
}

function EditBookmarkForm({ bookmark, submitAction }: EditBookmarkFormProps) {
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

      <button
        type='submit'
        disabled={isPending}>
        {isPending ? '更新中...' : '更新'}
      </button>
    </form>
  )
}
