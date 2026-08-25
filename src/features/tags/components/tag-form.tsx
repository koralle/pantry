import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithValibot } from '@conform-to/valibot'
import { CircleAlert } from 'lucide-react'
import { startTransition, useActionState, useState } from 'react'
import * as v from 'valibot'

import { StyledButton } from '../../../shared/components/styled-button'
import { StyledInput } from '../../../shared/components/styled-input'
import { StyledLabel } from '../../../shared/components/styled-label'
import { field, fieldError, formSummary } from '../../../styles/form'
import { srOnly } from '../../../styles/sr-only'
import { workbenchFields, workbenchForm } from '../../../styles/workbench'
import { TagEditFields } from './tag-edit-fields'

const tagNameSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty('タグ名を入力してください'))
})

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
  const [pinned, setPinned] = useState(initialValues.pinned)
  const [color, setColor] = useState<string | null>(initialValues.color)
  const [sortOrder, setSortOrder] = useState(initialValues.sortOrder)
  const [formError, setFormError] = useState<string | null>(null)
  const [, submit, isPending] = useActionState(async (_previous: unknown, formData: FormData) => {
    setFormError(null)
    const submission = parseWithValibot(formData, {
      disableAutoCoercion: true,
      schema: tagNameSchema
    })
    if (submission.status !== 'success') {
      return
    }

    try {
      await onSubmit({ name: submission.value.name, pinned, color, sortOrder })
    } catch (error) {
      const message = mapError(error)
      if (message !== null) {
        setFormError(message)
      }
    }
  }, null)
  const [form, fields] = useForm({
    defaultValue: {
      name: initialValues.name
    },
    onSubmit(event, { formData, submission }) {
      event.preventDefault()
      if (submission?.status !== 'success') {
        return
      }
      startTransition(() => {
        submit(formData)
      })
    },
    onValidate({ formData }) {
      return parseWithValibot(formData, { disableAutoCoercion: true, schema: tagNameSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit'
  })

  return (
    <form
      className={workbenchForm}
      {...getFormProps(form)}
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

        <div className={field}>
          <StyledLabel htmlFor={fields.name.id}>タグ名</StyledLabel>
          <StyledInput
            {...getInputProps(fields.name, { type: 'text' })}
            required
          />
          {fields.name.errors ? <p className={fieldError}>{fields.name.errors[0]}</p> : null}
        </div>

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
