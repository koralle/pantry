import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useActionState } from 'react'
import * as v from 'valibot'

import { addTag } from '../../../features/tags/tag.function'

export const Route = createFileRoute('/_protected/tags/new')({
  component: RouteComponent
})

function RouteComponent() {
  const navigate = useNavigate()

  async function submitAction({ name }: { name: string }) {
    const { id } = await addTag({ data: { name } })

    await navigate({
      to: '/tags/$id',
      params: { id: String(id) },
      state: { newTagCreated: true }
    })
  }

  return (
    <div>
      <h1>タグ新規作成</h1>

      <RegisterNewTagForm submitAction={submitAction} />

      <Link
        to='/tags'
        search={{ limit: 50, offset: 0 }}>
        一覧へ戻る
      </Link>
    </div>
  )
}

interface RegisterNewTagFormProps {
  submitAction: ({ name }: { name: string }) => Promise<void>
}

function RegisterNewTagForm({ submitAction }: RegisterNewTagFormProps) {
  const registerNewTagFormSchema = v.object({
    name: v.string()
  })

  const registerNewTagForm = useForm({
    initialInput: {
      name: ''
    },
    schema: registerNewTagFormSchema
  })

  const [_, throwError, isPending] = useActionState(async () => {
    const currentRawName = getInput(registerNewTagForm, { path: ['name'] }) ?? ''

    await submitAction({ name: currentRawName })
  }, null)

  return (
    <form action={throwError}>
      <fieldset>
        <legend>タグ新規登録</legend>

        <Field
          of={registerNewTagForm}
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
        {isPending ? '登録中...' : '登録'}
      </button>
    </form>
  )
}
