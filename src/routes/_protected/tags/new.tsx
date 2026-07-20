import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useActionState, useState } from 'react'
import * as v from 'valibot'

import { TagEditFields } from '../../../features/tags/components/tag-edit-fields'
import { addTag, updateTag } from '../../../features/tags/tag.function'

export const Route = createFileRoute('/_protected/tags/new')({
  component: RouteComponent
})

function RouteComponent() {
  const navigate = useNavigate()

  async function submitAction(input: {
    name: string
    pinned: boolean
    color: string | null
    sortOrder: number
  }) {
    const { id } = await addTag({ data: { name: input.name } })

    const needsMeta = input.pinned || input.color != null || input.sortOrder !== 0

    if (needsMeta) {
      await updateTag({
        data: {
          id,
          pinned: input.pinned,
          color: input.color,
          sortOrder: input.sortOrder
        }
      })
    }

    await navigate({
      to: '/tags/$id',
      params: { id: String(id) },
      state: { newTagCreated: true }
    })
  }

  return (
    <div className='pantry-workbench'>
      <nav className='pantry-workbench__nav'>
        <Link
          to='/tags'
          search={{ limit: 50, offset: 0 }}
          className='pantry-text-link'>
          一覧へ戻る
        </Link>
      </nav>

      <h1 className='pantry-workbench__title'>タグ新規作成</h1>
      <p className='pantry-workbench__lead'>箱の名前を付け、必要ならピンと色も決めます</p>

      <RegisterNewTagForm submitAction={submitAction} />
    </div>
  )
}

interface RegisterNewTagFormProps {
  submitAction: (input: {
    name: string
    pinned: boolean
    color: string | null
    sortOrder: number
  }) => Promise<void>
}

function RegisterNewTagForm({ submitAction }: RegisterNewTagFormProps) {
  const [pinned, setPinned] = useState(false)
  const [color, setColor] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState(0)
  const [formError, setFormError] = useState<string | null>(null)

  const registerNewTagFormSchema = v.object({
    name: v.string()
  })

  const registerNewTagForm = useForm({
    initialInput: {
      name: ''
    },
    schema: registerNewTagFormSchema
  })

  const [, throwError, isPending] = useActionState(async () => {
    setFormError(null)
    const currentRawName = getInput(registerNewTagForm, { path: ['name'] }) ?? ''

    try {
      await submitAction({
        name: currentRawName,
        pinned,
        color,
        sortOrder
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'TagNameAlreadyExistsError') {
        setFormError('そのタグ名は既に存在します')
      } else {
        setFormError(error instanceof Error ? error.message : 'タグの作成に失敗しました')
      }
    }
  }, null)

  return (
    <form
      className='pantry-workbench-form'
      action={throwError}>
      {formError != null ? (
        <div
          className='pantry-form-summary'
          role='alert'
          aria-live='polite'>
          <p>{formError}</p>
        </div>
      ) : null}

      <fieldset
        className='pantry-workbench-form__fields'
        disabled={isPending}>
        <legend className='pantry-sr-only'>タグ新規登録</legend>

        <Field
          of={registerNewTagForm}
          path={['name']}>
          {(field) => (
            <div className='pantry-field'>
              <label htmlFor={field.props.name}>タグ名</label>
              <Input
                id={field.props.name}
                value={field.input}
                type='text'
                onValueChange={(newValue) => {
                  field.onChange(newValue)
                }}
                required
              />
            </div>
          )}
        </Field>

        <TagEditFields
          pinned={pinned}
          color={color}
          sortOrder={sortOrder}
          onPinnedChange={setPinned}
          onColorChange={setColor}
          onSortOrderChange={setSortOrder}
          disabled={isPending}
        />
      </fieldset>

      <button
        type='submit'
        className='pantry-button pantry-button--accent'
        disabled={isPending}>
        {isPending ? '登録中...' : '登録'}
      </button>
    </form>
  )
}
