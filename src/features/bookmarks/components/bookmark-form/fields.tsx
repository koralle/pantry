import { Input } from '@base-ui/react'
import { Field } from '@formisch/react'
import { Download } from 'lucide-react'

import { StyledButton } from '../../../../shared/components/styled-button'
import { field, fieldError, fieldInput, fieldLabel, fieldUrlRow } from '../../../../styles/form'
import type { BookmarkFormError, BookmarkFormStore, FormFieldKey } from './types'

export type BookmarkFormFieldIds = {
  readonly url: string
  readonly title: string
  readonly note: string
}

type BookmarkFormFieldsProps = {
  readonly form: BookmarkFormStore
  readonly ids: BookmarkFormFieldIds
  readonly errors?: BookmarkFormError['fields']
  readonly busy: boolean
  readonly isFetchingTitle: boolean
  readonly onFetchTitle: ((url: string) => Promise<string | null>) | undefined
  readonly handleFetchTitle: () => void
  readonly clearFieldError: (key: FormFieldKey) => void
}

export function BookmarkFormFields({
  form,
  ids,
  errors,
  busy,
  isFetchingTitle,
  onFetchTitle,
  handleFetchTitle,
  clearFieldError
}: BookmarkFormFieldsProps) {
  return (
    <>
      <Field
        of={form}
        path={['url']}>
        {(fieldProps) => {
          const errorMessage = fieldProps.errors?.[0] ?? errors?.url

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
                    clearFieldError('url')
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
                    />{' '}
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
          const errorMessage = fieldProps.errors?.[0] ?? errors?.title

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
                  clearFieldError('title')
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
          const errorMessage = fieldProps.errors?.[0] ?? errors?.note

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
                  clearFieldError('note')
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
