import { Form, getErrors, useForm } from '@formisch/react'
import { useId } from 'react'

import { StyledButton } from '../../../../../shared/components/styled-button'
import { srOnly } from '../../../../../styles/sr-only'
import { workbenchFields, workbenchForm } from '../../../../../styles/workbench'
import { BookmarkFormFields } from './fields'
import type { BookmarkFormFieldIds } from './fields'
import { bookmarkFormSchema } from './schema'
import { BookmarkFormSummary } from './summary'
import type { BookmarkFormFieldKey, BookmarkFormProps } from './types'
import { useBookmarkTitleFetch } from './use-bookmark-title-fetch'

export { bookmarkFormSchema }
export type {
  BookmarkEditorError,
  BookmarkFormFieldKey,
  BookmarkFormInitialValues,
  BookmarkFormProps,
  BookmarkFormServerError,
  BookmarkFormSubmitValues,
  BookmarkTitleFetchAction,
  BookmarkTitleFetchPayload,
  BookmarkTitleFetchState
} from './types'
export type { BookmarkFormInput, BookmarkFormOutput } from './schema'

export function BookmarkForm({
  initialValues,
  serverError = null,
  onClearFieldError,
  submitLabel = '更新',
  pendingLabel = '更新中…',
  legend = 'ブックマーク編集',
  onSubmit,
  fetchTitleAction
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
    fetchTitleAction,
    onClearFieldError
  })

  // Server error を Formisch store へコピーしない。
  // Formisch は現在の入力値に対する validation を、serverError は直前の送信結果を
  // それぞれ独立に持つ責務にする。両者を同期させると、外部 prop の serverError と
  // Formisch 内部 store の clear タイミングがずれて、古い server error が field に
  // 残り続ける不具合を作る (以前の実装で顕在化していた)。
  // よって Formisch は Formisch の error だけを所有し、serverError は表示だけ扱う。

  const pending = form.isSubmitting
  const busy = pending || isFetchingTitle
  const formErrors = getErrors(form) ?? []

  // Summary 候補は「重複除去せずに」集めるだけにする。完全一致の除去は
  // BookmarkFormSummary に任せる。責務境界を、
  //   BookmarkForm = どのエラーを summary に流すか (発生源の選択)
  //   BookmarkFormSummary = 表示上の重複除去
  // で分ける。
  const summaryCandidates = [
    ...(form.isSubmitted && !form.isValid ? ['入力内容を確認してください'] : []),
    ...formErrors,
    serverError?.summary,
    serverError?.fields?.url,
    serverError?.fields?.title,
    serverError?.fields?.note,
    titleFetchError
  ].filter(
    (message): message is string => message !== null && message !== undefined && message !== ''
  )

  function handleClearFieldError(key: BookmarkFormFieldKey) {
    // Formisch の field error は Formisch store が所有し、
    // Server error は BookmarkEditor が所有する。所有者が別なので clear も別経路で行う。
    // Formisch 側の clear は fields.tsx の Field 内で fieldProps.onChange 経由で処理されるため、
    // ここでは server 側の clear だけを親へ通知する。
    onClearFieldError?.(key)
  }

  return (
    <Form
      className={workbenchForm}
      of={form}
      onSubmit={onSubmit}
      aria-describedby={summaryCandidates.length > 0 ? ids.summary : undefined}>
      <BookmarkFormSummary
        id={ids.summary}
        messages={summaryCandidates}
      />

      <fieldset
        className={workbenchFields}
        disabled={busy}>
        <legend className={srOnly}>{legend}</legend>
        <BookmarkFormFields
          form={form}
          ids={ids}
          serverFieldErrors={serverError?.fields}
          busy={busy}
          isFetchingTitle={isFetchingTitle}
          handleFetchTitle={handleFetchTitle}
          onClearServerFieldError={handleClearFieldError}
        />
      </fieldset>

      <StyledButton
        type='submit'
        visual='accent'
        disabled={busy}>
        {pending ? pendingLabel : submitLabel}
      </StyledButton>
    </Form>
  )
}
