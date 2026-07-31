import { Input } from '@base-ui/react'
import { CircleAlert, Download } from 'lucide-react'
import { useId, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import * as v from 'valibot'

import { StyledButton } from '../../../shared/components/styled-button'
import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
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
import {
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../domain/bookmark-values'
import type { BookmarkNote, BookmarkTitle, BookmarkUrl } from '../domain/bookmark-values'

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

export type BookmarkFormSubmitValues = {
  readonly url: BookmarkUrl
  readonly title: BookmarkTitle
  readonly note: BookmarkNote
}

export type BookmarkFormProps = {
  readonly initialValues: BookmarkFormInitialValues
  /** Editor がサーバー結果から渡す表示用エラー */
  readonly errors?: BookmarkFormError | null
  /** 送信中は fieldset を無効化し、二重送信を防ぐ */
  readonly submission?: 'idle' | 'pending'
  readonly submitLabel?: string
  readonly pendingLabel?: string
  readonly legend?: string
  readonly onSubmit: (values: BookmarkFormSubmitValues) => void | Promise<void>
  /** タイトル取得。Server Function は注入側が持つ */
  readonly onFetchTitle?: (url: string) => Promise<string | null>
  /** タグ領域など、フォーム内に差し込む UI */
  readonly children?: ReactNode
}

type FieldKey = 'url' | 'title' | 'note' | 'tags'

type LocalFieldErrors = Partial<Record<FieldKey, string>>

function issueMessage(issues: readonly v.BaseIssue<unknown>[] | undefined, fallback: string) {
  return issues?.[0]?.message ?? fallback
}

function parseSubmitValues(
  url: string,
  title: string,
  note: string
): Result<BookmarkFormSubmitValues, LocalFieldErrors> {
  const urlResult = v.safeParse(bookmarkUrlSchema, url)
  const titleResult = v.safeParse(bookmarkTitleSchema, title)
  const noteResult = v.safeParse(bookmarkNoteSchema, note === '' ? null : note)

  const fields: LocalFieldErrors = {}
  if (!urlResult.success) {
    fields.url = issueMessage(urlResult.issues, '有効なURLを入力してください')
  }
  if (!titleResult.success) {
    fields.title = issueMessage(titleResult.issues, 'タイトルを入力してください')
  }
  if (!noteResult.success) {
    fields.note = issueMessage(noteResult.issues, 'メモの形式が正しくありません')
  }

  if (!urlResult.success || !titleResult.success || !noteResult.success) {
    return err(fields)
  }

  return ok({
    url: urlResult.output,
    title: titleResult.output,
    note: noteResult.output
  })
}

function mergeFieldErrors(
  localFields: LocalFieldErrors,
  external: BookmarkFormError['fields']
): LocalFieldErrors {
  const merged: LocalFieldErrors = {}
  for (const key of ['url', 'title', 'note', 'tags'] as const) {
    const message = localFields[key] ?? external?.[key]
    if (message !== undefined) {
      merged[key] = message
    }
  }
  return merged
}

export function BookmarkForm({
  initialValues,
  errors = null,
  submission = 'idle',
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

  const [url, setUrl] = useState(initialValues.url)
  const [title, setTitle] = useState(initialValues.title)
  const [note, setNote] = useState(initialValues.note ?? '')
  const [localFields, setLocalFields] = useState<LocalFieldErrors>({})
  const [localSummary, setLocalSummary] = useState<string | null>(null)
  const [titleFetchError, setTitleFetchError] = useState<string | null>(null)
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)

  const pending = submission === 'pending'
  const busy = pending || isFetchingTitle
  const fieldErrors = mergeFieldErrors(localFields, errors?.fields)
  const summaryMessages = [localSummary, errors?.summary, titleFetchError, fieldErrors.tags].filter(
    (message): message is string => message !== null && message !== undefined && message !== ''
  )

  function clearFieldError(key: FieldKey) {
    setLocalFields((current) => {
      if (current[key] === undefined) {
        return current
      }
      const next = { ...current }
      delete next[key]
      return next
    })
    setLocalSummary(null)
  }

  async function handleFetchTitle() {
    if (onFetchTitle === undefined) {
      return
    }
    setTitleFetchError(null)
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
      setTitle(fetched)
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) {
      return
    }

    setLocalSummary(null)
    setTitleFetchError(null)

    const parsed = parseSubmitValues(url, title, note)
    if (!parsed.ok) {
      setLocalFields(parsed.error)
      setLocalSummary('入力内容を確認してください')
      return
    }

    setLocalFields({})
    await onSubmit(parsed.value)
  }

  return (
    <form
      className={workbenchForm}
      onSubmit={(event) => {
        handleSubmit(event).catch(() => {
          /* OnSubmit 側で表示する */
        })
      }}
      noValidate
      aria-describedby={summaryMessages.length > 0 ? summaryId : undefined}>
      {summaryMessages.length > 0 ? (
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
            {summaryMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset
        className={workbenchFields}
        disabled={busy}>
        <legend className={srOnly}>{legend}</legend>

        <div className={field}>
          <label
            htmlFor={urlId}
            className={fieldLabel}>
            URL
          </label>
          <div className={fieldUrlRow}>
            <Input
              id={urlId}
              name='url'
              className={fieldInput}
              value={url}
              type='url'
              autoComplete='url'
              required
              aria-invalid={fieldErrors.url !== undefined}
              aria-describedby={fieldErrors.url !== undefined ? `${urlId}-error` : undefined}
              onValueChange={(value) => {
                setUrl(value)
                clearFieldError('url')
              }}
            />
            {onFetchTitle !== undefined ? (
              <StyledButton
                type='button'
                onClick={() => {
                  handleFetchTitle().catch(() => {
                    /* TitleFetchError で表示 */
                  })
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
          {fieldErrors.url !== undefined ? (
            <p
              id={`${urlId}-error`}
              className={fieldError}>
              {fieldErrors.url}
            </p>
          ) : null}
        </div>

        <div className={field}>
          <label
            htmlFor={titleId}
            className={fieldLabel}>
            タイトル
          </label>
          <Input
            id={titleId}
            name='title'
            className={fieldInput}
            value={title}
            type='text'
            autoComplete='off'
            required
            aria-invalid={fieldErrors.title !== undefined}
            aria-describedby={fieldErrors.title !== undefined ? `${titleId}-error` : undefined}
            onValueChange={(value) => {
              setTitle(value)
              clearFieldError('title')
            }}
          />
          {fieldErrors.title !== undefined ? (
            <p
              id={`${titleId}-error`}
              className={fieldError}>
              {fieldErrors.title}
            </p>
          ) : null}
        </div>

        <div className={field}>
          <label
            htmlFor={noteId}
            className={fieldLabel}>
            メモ
          </label>
          <Input
            id={noteId}
            name='note'
            className={fieldInput}
            value={note}
            type='text'
            autoComplete='off'
            aria-invalid={fieldErrors.note !== undefined}
            aria-describedby={fieldErrors.note !== undefined ? `${noteId}-error` : undefined}
            onValueChange={(value) => {
              setNote(value)
              clearFieldError('note')
            }}
          />
          {fieldErrors.note !== undefined ? (
            <p
              id={`${noteId}-error`}
              className={fieldError}>
              {fieldErrors.note}
            </p>
          ) : null}
        </div>
      </fieldset>

      {children}

      <StyledButton
        type='submit'
        visual='accent'
        disabled={busy}>
        {pending ? pendingLabel : submitLabel}
      </StyledButton>
    </form>
  )
}
