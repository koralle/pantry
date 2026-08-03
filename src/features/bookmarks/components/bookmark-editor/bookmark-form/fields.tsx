import { Input } from '@base-ui/react'
import { Field, setErrors } from '@formisch/react'
import { Download } from 'lucide-react'

import { StyledButton } from '../../../../../shared/components/styled-button'
import { field, fieldError, fieldInput, fieldLabel, fieldUrlRow } from '../../../../../styles/form'
import type { BookmarkFormFieldKey, BookmarkFormServerError, BookmarkFormStore } from './types'

export type BookmarkFormFieldIds = {
  readonly url: string
  readonly title: string
  readonly note: string
}

type BookmarkFormFieldsProps = {
  readonly form: BookmarkFormStore
  readonly ids: BookmarkFormFieldIds
  readonly serverFieldErrors?: BookmarkFormServerError['fields']
  readonly busy: boolean
  readonly isFetchingTitle: boolean
  readonly onFetchTitle: ((url: string) => Promise<string | null>) | undefined
  readonly handleFetchTitle: () => void
  readonly onClearServerFieldError: (key: BookmarkFormFieldKey) => void
}

// Field に表示するメッセージの優先順位を「Formisch の validation error → server error」に固定する。
// Formisch は現在の入力値に対する結果、server error は直前の送信時点の入力値に対する結果なので、
// 現在値へのフィードバックを優先する方が入力者の認知と一致する。
// また serverError は入力変更時に onClearServerFieldError で clear されるため、
// この優先順位は過渡状態や race condition に対する最終的な解決ルールでもある。
function resolveFieldMessage(
  formErrors: readonly string[] | null | undefined,
  serverMessage: string | undefined
): string | undefined {
  const formismError = formErrors?.[0]
  if (formismError !== undefined) {
    return formismError
  }
  return serverMessage
}

export function BookmarkFormFields({
  form,
  ids,
  serverFieldErrors,
  busy,
  isFetchingTitle,
  onFetchTitle,
  handleFetchTitle,
  onClearServerFieldError
}: BookmarkFormFieldsProps) {
  // 入力変更時に Formisch 側の field error と server 側の field error を「同時に」clear する。
  // 所有者は別 (Formisch store / BookmarkEditor) だが、
  // 入力の変化に対して両者が古い判断を残さないという契約を、この一関数で表現する。
  function handleFieldChange(key: BookmarkFormFieldKey) {
    setErrors(form, { path: [key], errors: null })
    onClearServerFieldError(key)
  }

  return (
    <>
      <Field
        of={form}
        path={['url']}>
        {(fieldProps) => {
          const errorMessage = resolveFieldMessage(fieldProps.errors, serverFieldErrors?.url)

          return (
            <div className={field}>
              <label
                htmlFor={ids.url}
                className={fieldLabel}>
                URL
              </label>
              <div className={fieldUrlRow}>
                <Input
                  id={ids.url}
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
                  aria-describedby={errorMessage !== undefined ? `${ids.url}-error` : undefined}
                  onValueChange={(value) => {
                    fieldProps.onChange(value)
                    handleFieldChange('url')
                  }}
                />
                {onFetchTitle !== undefined ? (
                  <StyledButton
                    type='button'
                    onClick={handleFetchTitle}
                    disabled={busy}
                    aria-busy={isFetchingTitle}>
                    <Download
                      size={16}
                      aria-hidden
                    />
                    {isFetchingTitle ? '取得中…' : 'タイトルを取得'}
                  </StyledButton>
                ) : null}
              </div>
              {errorMessage !== undefined ? (
                <p
                  id={`${ids.url}-error`}
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
          const errorMessage = resolveFieldMessage(fieldProps.errors, serverFieldErrors?.title)

          return (
            <div className={field}>
              <label
                htmlFor={ids.title}
                className={fieldLabel}>
                タイトル
              </label>
              <Input
                id={ids.title}
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
                aria-describedby={errorMessage !== undefined ? `${ids.title}-error` : undefined}
                onValueChange={(value) => {
                  fieldProps.onChange(value)
                  handleFieldChange('title')
                }}
              />
              {errorMessage !== undefined ? (
                <p
                  id={`${ids.title}-error`}
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
          const errorMessage = resolveFieldMessage(fieldProps.errors, serverFieldErrors?.note)

          return (
            <div className={field}>
              <label
                htmlFor={ids.note}
                className={fieldLabel}>
                メモ
              </label>
              <Input
                id={ids.note}
                name={fieldProps.props.name}
                ref={(element) => {
                  fieldProps.props.ref(element as HTMLInputElement | null)
                }}
                className={fieldInput}
                value={fieldProps.input ?? ''}
                type='text'
                autoComplete='off'
                aria-invalid={errorMessage !== undefined}
                aria-describedby={errorMessage !== undefined ? `${ids.note}-error` : undefined}
                onValueChange={(value) => {
                  fieldProps.onChange(value)
                  handleFieldChange('note')
                }}
              />
              {errorMessage !== undefined ? (
                <p
                  id={`${ids.note}-error`}
                  className={fieldError}>
                  {errorMessage}
                </p>
              ) : null}
            </div>
          )
        }}
      </Field>
    </>
  )
}
