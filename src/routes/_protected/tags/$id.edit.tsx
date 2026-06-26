import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { use, useActionState } from 'react'
import * as v from 'valibot'

import { getTag, updateTag } from '../../../features/tags/tag.function'

const tagIdParamSchema = v.pipe(v.string(), v.transform(Number), v.integer('Invalid tag id'))

export const Route = createFileRoute('/_protected/tags/$id/edit')({
  loader: async ({ params }) => {
    const id = v.parse(tagIdParamSchema, params.id)
    const tagPromise = getTag({ data: { id } })

    return {
      tagPromise
    }
  },
  component: RouteComponent
})

function RouteComponent() {
  const { tagPromise } = Route.useLoaderData()
  const navigate = useNavigate()

  async function submitAction({ id, name }: { id: number; name: string }) {
    const { id: updatedId } = await updateTag({ data: { id, name } })

    await navigate({
      to: '/tags/$id',
      params: { id: String(updatedId) },
      state: { tagUpdated: true }
    })
  }

  return (
    <div>
      <h1>タグ編集</h1>

      <EditTagForm
        tagPromise={tagPromise}
        submitAction={submitAction}
      />

      <Link
        to='/tags'
        search={{ limit: 50, offset: 0 }}>
        一覧へ戻る
      </Link>
    </div>
  )
}

interface EditTagFormProps {
  readonly tagPromise: Promise<{ id: number; name: string }>
  readonly submitAction: (input: { id: number; name: string }) => Promise<void>
}

function EditTagForm({ tagPromise, submitAction }: EditTagFormProps) {
  const tag = use(tagPromise)

  const editTagFormSchema = v.object({
    name: v.string()
  })

  const editTagForm = useForm({
    initialInput: {
      name: tag.name
    },
    schema: editTagFormSchema
  })

  const [_, throwError, isPending] = useActionState(async () => {
    const currentRawName = getInput(editTagForm, { path: ['name'] }) ?? ''

    await submitAction({ id: tag.id, name: currentRawName })
  }, null)

  return (
    <form action={throwError}>
      <fieldset>
        <legend>タグ編集</legend>

        <Field
          of={editTagForm}
          path={['name']}>
          {(field) => (
            <label htmlFor={field.props.name}>
              タグ名
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
        {isPending ? '更新中...' : '更新'}
      </button>
    </form>
  )
}
