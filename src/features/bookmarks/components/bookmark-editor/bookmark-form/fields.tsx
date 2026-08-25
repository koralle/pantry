import { getInputProps } from '@conform-to/react'
import type { FieldMetadata } from '@conform-to/react'
import { Download } from 'lucide-react'

import { StyledButton } from '../../../../../shared/components/styled-button'
import { StyledInput } from '../../../../../shared/components/styled-input'
import { StyledLabel } from '../../../../../shared/components/styled-label'
import { field, fieldError, fieldUrlRow } from '../../../../../styles/form'
import type { BookmarkFormFieldKey, BookmarkFormServerError } from './types'

type BookmarkFormFieldsProps = {
  readonly fields: {
    readonly url: FieldMetadata
    readonly title: FieldMetadata
    readonly note: FieldMetadata
  }
  readonly serverFieldErrors?: BookmarkFormServerError['fields']
  readonly busy: boolean
  readonly isFetchingTitle: boolean
  readonly handleFetchTitle: () => void
  readonly onClearServerFieldError: (key: BookmarkFormFieldKey) => void
}

// Field に表示するメッセージの優先順位を「Conform の validation error → server error」に固定する。
// Conform は現在の入力値に対する結果、server error は直前の送信時点の入力値に対する結果なので、
// 現在値へのフィードバックを優先する方が入力者の認知と一致する。
// また serverError は入力変更時に onClearServerFieldError で clear されるため、
// この優先順位は過渡状態や race condition に対する最終的な解決ルールでもある。
function resolveFieldMessage(
  formErrors: readonly string[] | null | undefined,
  serverMessage: string | undefined
): string | undefined {
  const formError = formErrors?.[0]
  if (formError !== undefined) {
    return formError
  }
  return serverMessage
}

export function BookmarkFormFields({
  fields,
  serverFieldErrors,
  busy,
  isFetchingTitle,
  handleFetchTitle,
  onClearServerFieldError
}: BookmarkFormFieldsProps) {
  function handleFieldChange(key: BookmarkFormFieldKey) {
    onClearServerFieldError(key)
  }

  const urlError = resolveFieldMessage(fields.url.errors, serverFieldErrors?.url)
  const titleError = resolveFieldMessage(fields.title.errors, serverFieldErrors?.title)
  const noteError = resolveFieldMessage(fields.note.errors, serverFieldErrors?.note)

  return (
    <>
      <div className={field}>
        <StyledLabel htmlFor={fields.url.id}>URL</StyledLabel>
        <div className={fieldUrlRow}>
          <StyledInput
            {...getInputProps(fields.url, { type: 'url' })}
            autoComplete='url'
            required
            aria-invalid={urlError !== undefined}
            aria-describedby={urlError !== undefined ? fields.url.errorId : undefined}
            onChange={() => {
              handleFieldChange('url')
            }}
          />
          <StyledButton
            type='button'
            onPress={handleFetchTitle}
            isDisabled={busy}
            aria-busy={isFetchingTitle}>
            <Download
              size={16}
              aria-hidden
            />
            {isFetchingTitle ? '取得中…' : 'タイトルを取得'}
          </StyledButton>
        </div>
        {urlError !== undefined ? (
          <p
            id={fields.url.errorId}
            className={fieldError}>
            {urlError}
          </p>
        ) : null}
      </div>

      <div className={field}>
        <StyledLabel htmlFor={fields.title.id}>タイトル</StyledLabel>
        <StyledInput
          {...getInputProps(fields.title, { type: 'text' })}
          autoComplete='off'
          required
          aria-invalid={titleError !== undefined}
          aria-describedby={titleError !== undefined ? fields.title.errorId : undefined}
          onChange={() => {
            handleFieldChange('title')
          }}
        />
        {titleError !== undefined ? (
          <p
            id={fields.title.errorId}
            className={fieldError}>
            {titleError}
          </p>
        ) : null}
      </div>

      <div className={field}>
        <StyledLabel htmlFor={fields.note.id}>メモ</StyledLabel>
        <StyledInput
          {...getInputProps(fields.note, { type: 'text' })}
          autoComplete='off'
          aria-invalid={noteError !== undefined}
          aria-describedby={noteError !== undefined ? fields.note.errorId : undefined}
          onChange={() => {
            handleFieldChange('note')
          }}
        />
        {noteError !== undefined ? (
          <p
            id={fields.note.errorId}
            className={fieldError}>
            {noteError}
          </p>
        ) : null}
      </div>
    </>
  )
}
