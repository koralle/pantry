import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useActionState } from 'react'
import * as v from 'valibot'

import { addBookmark } from '../../../../features/bookmarks/bookmark.function'

export const Route = createFileRoute('/_protected/bookmarks/new/')({
  component: RouteComponent
})

function RouteComponent() {
  const navigate = useNavigate()

  async function submitAction({ url, title }: { url: string; title: string }) {
    const { id } = await addBookmark({ data: { url, title } })

    await navigate({
      to: '/bookmarks/$id',
      params: { id },
      state: { newBookmarkCreated: true }
    })
  }

  return (
    <div>
      <h1>ブックマーク新規作成</h1>

      <RegisterNewBookmarkForm submitAction={submitAction} />

      <Link
        to='/'
        search={{ tagMode: 'and', sort: 'newest' }}>
        一覧へ戻る
      </Link>
    </div>
  )
}

interface RegisterNewBookmarkFormProps {
  submitAction: ({ url, title }: { url: string; title: string }) => Promise<void>
}

function RegisterNewBookmarkForm({ submitAction }: RegisterNewBookmarkFormProps) {
  const registerNewBookmarkFormSchema = v.object({
    url: v.pipe(v.string(), v.url()),
    title: v.string()
  })

  const registerNewBookmarkForm = useForm({
    initialInput: {
      url: '',
      title: ''
    },
    schema: registerNewBookmarkFormSchema
  })

  const [_, throwError, isPending] = useActionState(async () => {
    const currentRawUrl = getInput(registerNewBookmarkForm, { path: ['url'] }) ?? ''
    const currentRawTitle = getInput(registerNewBookmarkForm, { path: ['title'] }) ?? ''

    await submitAction({ url: currentRawUrl, title: currentRawTitle })
  }, null)

  return (
    <form action={throwError}>
      <fieldset>
        <legend>ブックマーク新規登録</legend>

        <Field
          of={registerNewBookmarkForm}
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
          of={registerNewBookmarkForm}
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
      </fieldset>

      <button
        type='submit'
        disabled={isPending}>
        {isPending ? '登録中...' : '登録'}
      </button>
    </form>
  )
}
