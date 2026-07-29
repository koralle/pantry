import { Input } from '@base-ui/react'
import { Field, getAllErrors, getInput, useForm, validate } from '@formisch/react'
import { CircleAlert, Download } from 'lucide-react'
import { useActionState, useState } from 'react'
import * as v from 'valibot'

import { StyledButton } from '../../../shared/components/styled-button'
import {
  field,
  fieldError,
  fieldInput,
  fieldLabel,
  fieldUrlRow,
  formSummary
} from '../../../styles/form'
import { srOnly } from '../../../styles/sr-only'
import { workbenchFields, workbenchForm } from '../../../styles/workbench'
import { TagSelector } from '../../tags/components/tag-selector'
import type { SelectableTag } from '../../tags/components/tag-selector'
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
  readonly allTags: SelectableTag[]
  readonly selectedTagIds: number[]
  readonly onTagChange: (ids: number[]) => void
  readonly submitLabel: string
  readonly pendingLabel: string
  readonly onSubmit: (values: BookmarkWorkbenchValues) => Promise<void>
}

export function BookmarkWorkbenchForm({
  mode,
  initialValues,
  allTags,
  selectedTagIds,
  onTagChange,
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
  const schemaErrors = getAllErrors(form)
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
              <label
                htmlFor={f.props.name}
                className={fieldLabel}>
                URL
              </label>
              <div className={fieldUrlRow}>
                <Input
                  id={f.props.name}
                  className={fieldInput}
                  value={f.input}
                  type='url'
                  onValueChange={(newValue) => {
                    f.onChange(newValue)
                  }}
                  required
                  disabled={busy}
                />
                <StyledButton
                  onClick={() => {
                    void handleFetchTitle()
                  }}
                  disabled={busy}>
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
              <label
                htmlFor={f.props.name}
                className={fieldLabel}>
                タイトル
              </label>
              <Input
                id={f.props.name}
                className={fieldInput}
                value={f.input}
                type='text'
                onValueChange={(newValue) => {
                  f.onChange(newValue)
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
              <label
                htmlFor={f.props.name}
                className={fieldLabel}>
                メモ
              </label>
              <Input
                id={f.props.name}
                className={fieldInput}
                value={f.input ?? ''}
                type='text'
                onValueChange={(newValue) => {
                  f.onChange(newValue)
                }}
                disabled={busy}
              />
              {f.errors ? <p className={fieldError}>{f.errors[0]}</p> : null}
            </div>
          )}
        </Field>
      </fieldset>

      <div>
        <TagSelector
          allTags={allTags}
          selectedTagIds={selectedTagIds}
          onChange={onTagChange}
        />
      </div>

      <StyledButton
        type='submit'
        visual='accent'
        disabled={busy}>
        {isPending ? pendingLabel : submitLabel}
      </StyledButton>
    </form>
  )
}
