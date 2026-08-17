import { Field, getErrors, getInput, useForm, validate } from '@formisch/react'
import { CircleAlert, Download } from 'lucide-react'
import { useActionState, useState } from 'react'
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
}

export function BookmarkWorkbenchForm({
  mode,
  initialValues,
  submitLabel,
  pendingLabel,
  onSubmit
}: BookmarkWorkbenchFormProps) {
  const form = useForm({
    initialInput: {
      url: initialValues.url,
      title: initialValues.title,
      note: initialValues.note ?? ''
    },
    schema: workbenchSchema
  })

  const { titleFetchError, isFetchingTitle, handleFetchTitle } = useBookmarkTitleFetch(form)

  const [formError, setFormError] = useState<string | null>(null)

  const [, submitAction, isPending] = useActionState(async () => {
    setFormError(null)
    const result = await validate(form)
    if (!result.success) {
      setFormError('入力内容を確認してください')
      return
    }

    const url = getInput(form, { path: ['url'] }) ?? ''
    const title = getInput(form, { path: ['title'] }) ?? ''
    const rawNote = getInput(form, { path: ['note'] }) ?? ''
    const note = rawNote === '' ? null : rawNote

    try {
      await onSubmit({ url, title, note })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存に失敗しました')
    }
  }, null)

  const busy = isPending || isFetchingTitle
  const summaryErrors = [formError, titleFetchError].filter(
    (message): message is string => message != null
  )
  const schemaErrors = getErrors(form)
  const allSummary = [
    ...summaryErrors,
    ...(schemaErrors ?? []).filter((message) => !summaryErrors.includes(message))
  ]

  return (
    <form
      className={workbenchForm}
      action={submitAction}
      noValidate>
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

        <Field
          of={form}
          path={['url']}>
          {(f) => (
            <div className={field}>
              <StyledLabel htmlFor={f.props.name}>URL</StyledLabel>
              <div className={fieldUrlRow}>
                <StyledInput
                  id={f.props.name}
                  value={f.input}
                  type='url'
                  onChange={(event) => {
                    f.onChange(event.target.value)
                  }}
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
              {f.errors ? <p className={fieldError}>{f.errors[0]}</p> : null}
            </div>
          )}
        </Field>

        <Field
          of={form}
          path={['title']}>
          {(f) => (
            <div className={field}>
              <StyledLabel htmlFor={f.props.name}>タイトル</StyledLabel>
              <StyledInput
                id={f.props.name}
                value={f.input}
                type='text'
                onChange={(event) => {
                  f.onChange(event.target.value)
                }}
                required
                disabled={busy}
              />
              {f.errors ? <p className={fieldError}>{f.errors[0]}</p> : null}
            </div>
          )}
        </Field>

        <Field
          of={form}
          path={['note']}>
          {(f) => (
            <div className={field}>
              <StyledLabel htmlFor={f.props.name}>メモ</StyledLabel>
              <StyledInput
                id={f.props.name}
                value={f.input ?? ''}
                type='text'
                onChange={(event) => {
                  f.onChange(event.target.value)
                }}
                disabled={busy}
              />
              {f.errors ? <p className={fieldError}>{f.errors[0]}</p> : null}
            </div>
          )}
        </Field>
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
