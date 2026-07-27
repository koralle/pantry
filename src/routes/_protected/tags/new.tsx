import { Input } from '@base-ui/react'
import { Field, getInput, useForm } from '@formisch/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CircleAlert } from 'lucide-react'
import { useActionState, useState } from 'react'
import * as v from 'valibot'

import { TagEditFields } from '../../../features/tags/components/tag-edit-fields'
import { addTag } from '../../../features/tags/tag.function'
import { StyledButton } from '../../../shared/components/styled-button'
import { StyledLink } from '../../../shared/components/styled-link'
import {
  field,
  fieldInput,
  fieldLabel,
  formSummary,
  srOnly,
  workbench,
  workbenchFields,
  workbenchForm,
  workbenchLead,
  workbenchNav,
  workbenchTitle
} from '../../../styles/ui'

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
    const { id } = await addTag({
      data: {
        name: input.name,
        pinned: input.pinned,
        color: input.color,
        sortOrder: input.sortOrder
      }
    })

    await navigate({
      to: '/tags/$id',
      params: { id: String(id) },
      state: { newTagCreated: true }
    })
  }

  return (
    <div className={workbench}>
      <nav className={workbenchNav}>
        <StyledLink
          to='/tags'
          search={{ limit: 50, offset: 0 }}
          visual='accent'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </StyledLink>
      </nav>

      <h1 className={workbenchTitle}>タグ新規作成</h1>
      <p className={workbenchLead}>箱の名前を付け、必要ならピンと色も決めます</p>

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
      className={workbenchForm}
      action={throwError}>
      {formError != null ? (
        <div
          className={formSummary}
          role='alert'
          aria-live='polite'>
          <p>
            <CircleAlert
              size={16}
              aria-hidden
            />{' '}
            {formError}
          </p>
        </div>
      ) : null}

      <fieldset
        className={workbenchFields}
        disabled={isPending}>
        <legend className={srOnly}>タグ新規登録</legend>

        <Field
          of={registerNewTagForm}
          path={['name']}>
          {(fieldProps) => (
            <div className={field}>
              <label
                className={fieldLabel}
                htmlFor={fieldProps.props.name}>
                タグ名
              </label>
              <Input
                className={fieldInput}
                id={fieldProps.props.name}
                value={fieldProps.input}
                type='text'
                onValueChange={(newValue) => {
                  fieldProps.onChange(newValue)
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

      <StyledButton
        type='submit'
        visual='accent'
        disabled={isPending}>
        {isPending ? '登録中...' : '登録'}
      </StyledButton>
    </form>
  )
}
