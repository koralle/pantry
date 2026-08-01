import { Form, getErrors, setErrors, useForm } from '@formisch/react'
import { useEffect, useId } from 'react'

import { StyledButton } from '../../../../shared/components/styled-button'
import { srOnly } from '../../../../styles/sr-only'
import { workbenchFields, workbenchForm } from '../../../../styles/workbench'
import { BookmarkFormFields } from './fields'
import type { BookmarkFormFieldIds } from './fields'
import { bookmarkFormSchema } from './schema'
import { BookmarkFormSummary } from './summary'
import type { BookmarkFormProps, FormFieldKey } from './types'
import { useBookmarkTitleFetch } from './use-bookmark-title-fetch'

export { bookmarkFormSchema }
export type {
  BookmarkFormError,
  BookmarkFormInitialValues,
  BookmarkFormProps,
  BookmarkFormSubmitValues
} from './types'
export type { BookmarkFormInput, BookmarkFormOutput } from './schema'

export function BookmarkForm({
  initialValues,
  errors = null,
  submitLabel = '更新',
  pendingLabel = '更新中…',
  legend = 'ブックマーク編集',
  onSubmit,
  onFetchTitle,
  children
}: BookmarkFormProps) {
  const baseId = useId()
  const ids: BookmarkFormFieldIds & { readonly summary: string } = {
    url: `${baseId}-url`,
    title: `${baseId}-title`,
    note: `${baseId}-note`,
    summary: `${baseId}-summary`
  }

  const form = useForm({
    initialInput: {
      url: initialValues.url,
      title: initialValues.title,
      note: initialValues.note
    },
    schema: bookmarkFormSchema
  })

  const { titleFetchError, isFetchingTitle, handleFetchTitle } = useBookmarkTitleFetch({
    form,
    onFetchTitle
  })

  useEffect(() => {
    for (const key of ['url', 'title', 'note'] as const) {
      const message = errors?.fields?.[key]
      setErrors(form, {
        path: [key],
        errors: message === undefined ? null : [message]
      })
    }
  }, [errors, form])

  const pending = form.isSubmitting
  const busy = pending || isFetchingTitle
  const formErrors = getErrors(form) ?? []
  const summaryMessages = [
    ...(form.isSubmitted && !form.isValid ? ['入力内容を確認してください'] : []),
    ...formErrors,
    errors?.summary,
    titleFetchError,
    errors?.fields?.tags
  ].filter(
    (message): message is string => message !== null && message !== undefined && message !== ''
  )
  const uniqueSummaryMessages = [...new Set(summaryMessages)]

  function clearFieldError(key: FormFieldKey) {
    setErrors(form, { path: [key], errors: null })
  }

  return (
    <Form
      className={workbenchForm}
      of={form}
      onSubmit={onSubmit}
      aria-describedby={uniqueSummaryMessages.length > 0 ? ids.summary : undefined}>
      <BookmarkFormSummary
        id={ids.summary}
        messages={uniqueSummaryMessages}
      />

      <fieldset
        className={workbenchFields}
        disabled={busy}>
        <legend className={srOnly}>{legend}</legend>
        <BookmarkFormFields
          form={form}
          ids={ids}
          errors={errors?.fields}
          busy={busy}
          isFetchingTitle={isFetchingTitle}
          onFetchTitle={onFetchTitle}
          handleFetchTitle={handleFetchTitle}
          clearFieldError={clearFieldError}
        />
      </fieldset>

      {children}

      <StyledButton
        type='submit'
        visual='accent'
        disabled={busy}>
        {pending ? pendingLabel : submitLabel}
      </StyledButton>
    </Form>
  )
}
