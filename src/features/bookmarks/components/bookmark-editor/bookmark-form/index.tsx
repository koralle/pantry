import { getFormProps, useForm } from '@conform-to/react'
import { parseWithValibot } from '@conform-to/valibot'
import { useTransition } from 'react'

import { StyledButton } from '../../../../../shared/components/styled-button'
import { srOnly } from '../../../../../styles/sr-only'
import { workbenchFields, workbenchForm } from '../../../../../styles/workbench'
import { BookmarkFormFields } from './fields'
import { bookmarkFormSchema } from './schema'
import type { BookmarkFormOutput } from './schema'
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
  BookmarkTitleFetchAction
} from './types'
export type { BookmarkFormInput, BookmarkFormOutput } from './schema'

function readFormValue(formId: string, name: string): string {
  const formElement = document.getElementById(formId)
  if (!(formElement instanceof HTMLFormElement)) {
    return ''
  }
  const value = new FormData(formElement).get(name)
  return typeof value === 'string' ? value : ''
}

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
  const [pending, startSubmit] = useTransition()
  const [form, fields] = useForm<BookmarkFormOutput>({
    defaultValue: {
      url: initialValues.url,
      title: initialValues.title,
      note: initialValues.note ?? ''
    },
    onSubmit(event, { submission }) {
      if (submission?.status !== 'success') {
        return
      }
      event.preventDefault()
      startSubmit(async () => {
        await onSubmit(submission.value)
      })
    },
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        disableAutoCoercion: true,
        schema: bookmarkFormSchema
      })
    },
    shouldRevalidate: 'onInput',
    shouldValidate: 'onSubmit'
  })

  const { titleFetchError, isFetchingTitle, handleFetchTitle } = useBookmarkTitleFetch({
    fetchTitleAction,
    getUrl: () => readFormValue(form.id, fields.url.name),
    onClearFieldError,
    setTitle: (title) => {
      form.update({ name: fields.title.name, value: title })
    }
  })

  // Server error を Conform へコピーしない。
  // Conform は現在の入力値に対する validation を、serverError は直前の送信結果を
  // それぞれ独立に持つ責務にする。両者を同期させると、外部 prop の serverError と
  // Conform 内部 state の clear タイミングがずれて、古い server error が field に
  // 残り続ける不具合を作る (以前の実装で顕在化していた)。
  // よって Conform は Conform の error だけを所有し、serverError は表示だけ扱う。

  const busy = pending || isFetchingTitle

  // Summary 候補は「重複除去せずに」集めるだけにする。完全一致の除去は
  // BookmarkFormSummary に任せる。責務境界を、
  //   BookmarkForm = どのエラーを summary に流すか (発生源の選択)
  //   BookmarkFormSummary = 表示上の重複除去
  // で分ける。
  const summaryCandidates = [
    ...(form.status === 'error' ? ['入力内容を確認してください'] : []),
    ...(form.errors ?? []),
    serverError?.summary,
    serverError?.fields?.url,
    serverError?.fields?.title,
    serverError?.fields?.note,
    titleFetchError
  ].filter(
    (message): message is string => message !== null && message !== undefined && message !== ''
  )

  function handleClearFieldError(key: BookmarkFormFieldKey) {
    // Conform の field error は Conform が所有し、
    // Server error は BookmarkEditor が所有する。所有者が別なので clear も別経路で行う。
    // Conform 側の clear は shouldRevalidate: onInput で処理されるため、
    // ここでは server 側の clear だけを親へ通知する。
    onClearFieldError?.(key)
  }

  return (
    <form
      className={workbenchForm}
      {...getFormProps(form)}
      aria-describedby={summaryCandidates.length > 0 ? form.errorId : undefined}>
      <BookmarkFormSummary
        id={form.errorId}
        messages={summaryCandidates}
      />

      <fieldset
        className={workbenchFields}
        disabled={busy}>
        <legend className={srOnly}>{legend}</legend>
        <BookmarkFormFields
          fields={fields}
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
        isDisabled={busy}>
        {pending ? pendingLabel : submitLabel}
      </StyledButton>
    </form>
  )
}
