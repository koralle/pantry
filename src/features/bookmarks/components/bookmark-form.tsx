import { Input } from '@base-ui/react'
import { Field, Form, getErrors, getInput, setErrors, setInput, useForm } from '@formisch/react'
import { CircleAlert, Download } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'

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
import { bookmarkFormSchema } from './bookmark-form-schema'
import type { BookmarkFormOutput } from './bookmark-form-schema'

/**
 * BookmarkForm が表示するエラーだけを表す。
 * UpdateBookmarkError は知らず、Editor が UI 向けに変換した結果を受け取る。
 * Application 層の DTO が揃ったら import に差し替え可能。
 */
export type BookmarkFormError = {
  readonly summary?: string
  readonly fields?: {
    readonly url?: string
    readonly title?: string
    readonly note?: string
    readonly tags?: string
  }
}

export type BookmarkFormInitialValues = {
  readonly url: string
  readonly title: string
  readonly note: string | null
}

export type BookmarkFormSubmitValues = BookmarkFormOutput

export type BookmarkFormProps = {
  readonly initialValues: BookmarkFormInitialValues
  /** Editor がサーバー結果から渡す表示用エラー */
  readonly errors?: BookmarkFormError | null
  readonly submitLabel?: string
  readonly pendingLabel?: string
  readonly legend?: string
  readonly onSubmit: (values: BookmarkFormSubmitValues) => void | Promise<void>
  /** タイトル取得。Server Function は注入側が持つ */
  readonly onFetchTitle?: (url: string) => Promise<string | null>
  /** タグ領域など、フォーム内に差し込む UI */
  readonly children?: ReactNode
}

type FormFieldKey = 'url' | 'title' | 'note'

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
  const urlId = `${baseId}-url`
  const titleId = `${baseId}-title`
  const noteId = `${baseId}-note`
  const summaryId = `${baseId}-summary`
  const form = useForm({
    initialInput: {
      url: initialValues.url,
      title: initialValues.title,
      note: initialValues.note
    },
    schema: bookmarkFormSchema
  })

  const [titleFetchError, setTitleFetchError] = useState<string | null>(null)
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)

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

  async function handleFetchTitle() {
    if (onFetchTitle === undefined) {
      return
    }
    setTitleFetchError(null)
    const url = getInput(form, { path: ['url'] }) ?? ''
    if (url.trim() === '') {
      setTitleFetchError('先にURLを入力してください')
      return
    }

    setIsFetchingTitle(true)
    try {
      const fetched = await onFetchTitle(url)
      if (fetched === null) {
        setTitleFetchError('タイトルを取得できませんでした。手入力で続けられます')
        return
      }
      setInput(form, { path: ['title'], input: fetched })
      clearFieldError('title')
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

  return (
    <Form
      className={workbenchForm}
      of={form}
      onSubmit={onSubmit}
      aria-describedby={uniqueSummaryMessages.length > 0 ? summaryId : undefined}>
      {uniqueSummaryMessages.length > 0 ? (
        <div
          id={summaryId}
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
            {uniqueSummaryMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset
        className={workbenchFields}
        disabled={busy}>
        <legend className={srOnly}>{legend}</legend>

        <Field
          of={form}
          path={['url']}>
          {(fieldProps) => {
            const errorMessage = fieldProps.errors?.[0] ?? errors?.fields?.url

            return (
              <div className={field}>
                <label
                  htmlFor={urlId}
                  className={fieldLabel}>
                  URL
                </label>
                <div className={fieldUrlRow}>
                  <Input
                    id={urlId}
                    name={fieldProps.props.name}
                    ref={(element) => {
                      fieldProps.props.ref(element as HTMLInputElement | null)
                    }}
                    className={fieldInput}
                    value={fieldProps.input ?? ''}
                    type='url'
                    autoComplete='url'
                    required
                    aria-invalid={errorMessage !== undefined}
                    aria-describedby={errorMessage !== undefined ? `${urlId}-error` : undefined}
                    onValueChange={(value) => {
                      fieldProps.onChange(value)
                      clearFieldError('url')
                    }}
                  />
                  {onFetchTitle !== undefined ? (
                    <StyledButton
                      type='button'
                      onClick={async () => {
                        try {
                          await handleFetchTitle()
                        } catch {
                          /* TitleFetchError で表示 */
                        }
                      }}
                      disabled={busy}>
                      <Download
                        size={16}
                        aria-hidden
                      />{' '}
                      {isFetchingTitle ? '取得中…' : 'タイトルを取得'}
                    </StyledButton>
                  ) : null}
                </div>
                {errorMessage !== undefined ? (
                  <p
                    id={`${urlId}-error`}
                    className={fieldError}>
                    {errorMessage}
                  </p>
                ) : null}
              </div>
            )
          }}
        </Field>

        <Field
          of={form}
          path={['title']}>
          {(fieldProps) => {
            const errorMessage = fieldProps.errors?.[0] ?? errors?.fields?.title

            return (
              <div className={field}>
                <label
                  htmlFor={titleId}
                  className={fieldLabel}>
                  タイトル
                </label>
                <Input
                  id={titleId}
                  name={fieldProps.props.name}
                  ref={(element) => {
                    fieldProps.props.ref(element as HTMLInputElement | null)
                  }}
                  className={fieldInput}
                  value={fieldProps.input ?? ''}
                  type='text'
                  autoComplete='off'
                  required
                  aria-invalid={errorMessage !== undefined}
                  aria-describedby={errorMessage !== undefined ? `${titleId}-error` : undefined}
                  onValueChange={(value) => {
                    fieldProps.onChange(value)
                    clearFieldError('title')
                  }}
                />
                {errorMessage !== undefined ? (
                  <p
                    id={`${titleId}-error`}
                    className={fieldError}>
                    {errorMessage}
                  </p>
                ) : null}
              </div>
            )
          }}
        </Field>

        <Field
          of={form}
          path={['note']}>
          {(fieldProps) => {
            const errorMessage = fieldProps.errors?.[0] ?? errors?.fields?.note

            return (
              <div className={field}>
                <label
                  htmlFor={noteId}
                  className={fieldLabel}>
                  メモ
                </label>
                <Input
                  id={noteId}
                  name={fieldProps.props.name}
                  ref={(element) => {
                    fieldProps.props.ref(element as HTMLInputElement | null)
                  }}
                  className={fieldInput}
                  value={fieldProps.input ?? ''}
                  type='text'
                  autoComplete='off'
                  aria-invalid={errorMessage !== undefined}
                  aria-describedby={errorMessage !== undefined ? `${noteId}-error` : undefined}
                  onValueChange={(value) => {
                    fieldProps.onChange(value)
                    clearFieldError('note')
                  }}
                />
                {errorMessage !== undefined ? (
                  <p
                    id={`${noteId}-error`}
                    className={fieldError}>
                    {errorMessage}
                  </p>
                ) : null}
              </div>
            )
          }}
        </Field>
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
