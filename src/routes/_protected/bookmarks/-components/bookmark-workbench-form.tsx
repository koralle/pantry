import { Input } from '@base-ui/react'
import { Field, getAllErrors, getInput, setInput, useForm, validate } from '@formisch/react'
import { CircleAlert, Download } from 'lucide-react'
import { useActionState, useState } from 'react'
import * as v from 'valibot'

import type { TagSelectType } from '../../../../db/schema/tag'
import { fetchBookmarkTitle } from '../../../../features/bookmarks/bookmark.function'
import { TagSelector } from '../../../../features/bookmarks/components/tag-selector'
import {
  button,
  field,
  fieldError,
  fieldInput,
  fieldLabel,
  fieldUrlRow,
  formSummary,
  srOnly,
  workbenchFields,
  workbenchForm
} from '../../../../styles/ui'

const workbenchSchema = v.object({
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
  readonly allTags: TagSelectType[]
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

  const [formError, setFormError] = useState<string | null>(null)
  const [titleFetchError, setTitleFetchError] = useState<string | null>(null)
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)

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

  async function handleFetchTitle() {
    setTitleFetchError(null)
    const url = getInput(form, { path: ['url'] }) ?? ''
    if (url.trim() === '') {
      setTitleFetchError('先にURLを入力してください')
      return
    }

    setIsFetchingTitle(true)
    try {
      const title = await fetchBookmarkTitle({ data: { url } })
      if (title == null) {
        setTitleFetchError('タイトルを取得できませんでした。手入力で続けられます')
        return
      }
      setInput(form, { path: ['title'], input: title })
    } catch (error) {
      setTitleFetchError(
        error instanceof Error
          ? error.message
          : 'タイトルを取得できませんでした。手入力で続けられます'
      )
    } finally {
      setIsFetchingTitle(false)
    }
  }

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
                <button
                  type='button'
                  className={button()}
                  onClick={() => {
                    void handleFetchTitle()
                  }}
                  disabled={busy}>
                  <Download
                    size={16}
                    aria-hidden
                  />{' '}
                  {isFetchingTitle ? '取得中…' : 'タイトルを取得'}
                </button>
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

      <button
        type='submit'
        className={button({ visual: 'accent' })}
        disabled={busy}>
        {isPending ? pendingLabel : submitLabel}
      </button>
    </form>
  )
}
