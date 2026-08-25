import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithValibot } from '@conform-to/valibot'
import { CircleAlert, Download } from 'lucide-react'
import { startTransition, useActionState, useState } from 'react'
import * as v from 'valibot'

import { StyledButton } from '../../../shared/components/styled-button'
import { StyledInput } from '../../../shared/components/styled-input'
import { StyledLabel } from '../../../shared/components/styled-label'
import { field, fieldError, fieldUrlRow, formSummary } from '../../../styles/form'
import { srOnly } from '../../../styles/sr-only'
import { workbenchFields, workbenchForm } from '../../../styles/workbench'
import { useBookmarkTitleFetch } from '../hooks/use-bookmark-title-fetch'

export const workbenchSchema = v.object({
  url: v.pipe(v.string(), v.url('有効なURLを入力してください')),
  title: v.pipe(v.string(), v.minLength(1, 'タイトルを入力してください')),
  note: v.nullable(v.string())
})

export type BookmarkWorkbenchValues = {
  url: string
  title: string
  note: string | null
}

interface BookmarkWorkbenchFormProps {
  readonly mode: 'new' | 'edit'
  readonly initialValues: BookmarkWorkbenchValues
  readonly submitLabel: string
  readonly pendingLabel: string
  readonly onSubmit: (values: BookmarkWorkbenchValues) => Promise<void>
  /**
   * Null のときはフォームエラーを出さない。
   * セッション期限切れはリダイレクト側の仕事で、ここが汎用失敗文を重ねないため。
   */
  readonly mapError: (error: unknown) => string | null
}

function readFormValue(formId: string, name: string): string {
  const formElement = document.getElementById(formId)
  if (!(formElement instanceof HTMLFormElement)) {
    return ''
  }
  const value = new FormData(formElement).get(name)
  return typeof value === 'string' ? value : ''
}

export function BookmarkWorkbenchForm({
  mode,
  initialValues,
  submitLabel,
  pendingLabel,
  onSubmit,
  mapError
}: BookmarkWorkbenchFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const [, submitAction, isPending] = useActionState(
    async (_previous: unknown, formData: FormData) => {
      setFormError(null)
      const submission = parseWithValibot(formData, {
        disableAutoCoercion: true,
        schema: workbenchSchema
      })
      if (submission.status !== 'success') {
        return
      }

      const note = submission.value.note === '' ? null : submission.value.note

      try {
        await onSubmit({ url: submission.value.url, title: submission.value.title, note })
      } catch (error) {
        const message = mapError(error)
        if (message !== null) {
          setFormError(message)
        }
      }
    },
    null
  )
  const [form, fields] = useForm<BookmarkWorkbenchValues>({
    defaultValue: {
      url: initialValues.url,
      title: initialValues.title,
      note: initialValues.note ?? ''
    },
    onSubmit(event, { formData, submission }) {
      event.preventDefault()
      if (submission?.status !== 'success') {
        return
      }
      startTransition(() => {
        submitAction(formData)
      })
    },
    onValidate({ formData }) {
      return parseWithValibot(formData, { disableAutoCoercion: true, schema: workbenchSchema })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit'
  })

  const { titleFetchError, isFetchingTitle, handleFetchTitle } = useBookmarkTitleFetch({
    getUrl: () => readFormValue(form.id, fields.url.name),
    setTitle: (title) => {
      form.update({ name: fields.title.name, value: title })
    }
  })

  const busy = isPending || isFetchingTitle
  const summaryErrors = [formError, titleFetchError].filter(
    (message): message is string => message != null
  )
  const schemaErrors = form.status === 'error' ? ['入力内容を確認してください'] : []
  const allSummary = [
    ...summaryErrors,
    ...schemaErrors.filter((message) => !summaryErrors.includes(message)),
    ...(form.errors ?? []).filter((message) => !summaryErrors.includes(message))
  ]

  return (
    <form
      className={workbenchForm}
      {...getFormProps(form)}
      action={submitAction}>
      {allSummary.length > 0 ? (
        <div
          className={formSummary}
          role='alert'
          aria-live='polite'>
          <p>
            <CircleAlert
              size={16}
              aria-hidden
            />{' '}
            次を確認してください
          </p>
          <ul>
            {allSummary.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset className={workbenchFields}>
        <legend className={srOnly}>
          {mode === 'new' ? 'ブックマーク新規登録' : 'ブックマーク編集'}
        </legend>

        <div className={field}>
          <StyledLabel htmlFor={fields.url.id}>URL</StyledLabel>
          <div className={fieldUrlRow}>
            <StyledInput
              {...getInputProps(fields.url, { type: 'url' })}
              required
              disabled={busy}
            />
            <StyledButton
              onPress={() => {
                void handleFetchTitle()
              }}
              isDisabled={busy}>
              <Download
                size={16}
                aria-hidden
              />{' '}
              {isFetchingTitle ? '取得中…' : 'タイトルを取得'}
            </StyledButton>
          </div>
          {fields.url.errors ? <p className={fieldError}>{fields.url.errors[0]}</p> : null}
        </div>

        <div className={field}>
          <StyledLabel htmlFor={fields.title.id}>タイトル</StyledLabel>
          <StyledInput
            {...getInputProps(fields.title, { type: 'text' })}
            required
            disabled={busy}
          />
          {fields.title.errors ? <p className={fieldError}>{fields.title.errors[0]}</p> : null}
        </div>

        <div className={field}>
          <StyledLabel htmlFor={fields.note.id}>メモ</StyledLabel>
          <StyledInput
            {...getInputProps(fields.note, { type: 'text' })}
            disabled={busy}
          />
          {fields.note.errors ? <p className={fieldError}>{fields.note.errors[0]}</p> : null}
        </div>
      </fieldset>

      <StyledButton
        type='submit'
        visual='accent'
        isDisabled={busy}>
        {isPending ? pendingLabel : submitLabel}
      </StyledButton>
    </form>
  )
}
