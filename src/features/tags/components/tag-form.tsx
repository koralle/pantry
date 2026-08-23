import { Field, getInput, useForm } from '@formisch/react'
import { CircleAlert } from 'lucide-react'
import { useActionState, useState } from 'react'
import * as v from 'valibot'

import { StyledButton } from '../../../shared/components/styled-button'
import { StyledInput } from '../../../shared/components/styled-input'
import { StyledLabel } from '../../../shared/components/styled-label'
import { field, formSummary } from '../../../styles/form'
import { srOnly } from '../../../styles/sr-only'
import { workbenchFields, workbenchForm } from '../../../styles/workbench'
import { TagEditFields } from './tag-edit-fields'

type TagFormValues = {
  readonly name: string
  readonly pinned: boolean
  readonly color: string | null
  readonly sortOrder: number
}

type TagFormProps = {
  readonly initialValues: TagFormValues
  readonly legend: string
  readonly submitLabel: string
  readonly pendingLabel: string
  readonly onSubmit: (values: TagFormValues) => Promise<void>
  /**
   * Null のときはフォームエラーを出さない。
   * セッション期限切れはリダイレクト側の仕事で、ここが汎用失敗文を重ねないため。
   */
  readonly mapError: (error: unknown) => string | null
}

export function TagForm({
  initialValues,
  legend,
  submitLabel,
  pendingLabel,
  onSubmit,
  mapError
}: TagFormProps) {
  const [pinned, setPinned] = useState(initialValues.pinned),
   [color, setColor] = useState<string | null>(initialValues.color),
   [sortOrder, setSortOrder] = useState(initialValues.sortOrder),
   [formError, setFormError] = useState<string | null>(null),

   form = useForm({
    initialInput: {
      name: initialValues.name
    },
    schema: v.object({
      name: v.string()
    })
  }),

   [, submit, isPending] = useActionState(async () => {
    setFormError(null)
    const name = getInput(form, { path: ['name'] }) ?? ''

    try {
      await onSubmit({ name, pinned, color, sortOrder })
    } catch (error) {
      const message = mapError(error)
      if (message !== null) {
        setFormError(message)
      }
    }
  }, null)

  return (
    <form
      className={workbenchForm}
      action={submit}>
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
        <legend className={srOnly}>{legend}</legend>

        <Field
          of={form}
          path={['name']}>
          {(fieldProps) => (
            <div className={field}>
              <StyledLabel htmlFor={fieldProps.props.name}>タグ名</StyledLabel>
              <StyledInput
                id={fieldProps.props.name}
                value={fieldProps.input}
                type='text'
                onChange={(event) => {
                  fieldProps.onChange(event.target.value)
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
        isDisabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </StyledButton>
    </form>
  )
}
