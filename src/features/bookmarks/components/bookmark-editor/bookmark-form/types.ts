import type { FormStore } from '@formisch/react'

import { bookmarkFormSchema } from './schema'
import type { BookmarkFormOutput } from './schema'

export type BookmarkFormFieldKey = 'url' | 'title' | 'note'

/**
 * BookmarkForm が受け取る画面表示用サーバーエラー。
 * Formisch の validation error はここに載せず、Formisch store が所有する。
 * tags は BookmarkForm の責務外なので含めない。
 */
export type BookmarkFormServerError = {
  readonly summary?: string
  readonly fields?: Partial<Record<BookmarkFormFieldKey, string>>
}

/**
 * BookmarkEditor が唯一の所有者となる更新結果エラー。
 * Formisch validation error はここへ持ち込まない。
 */
export type BookmarkEditorError = {
  readonly form?: BookmarkFormServerError
}

export type BookmarkFormInitialValues = {
  readonly url: string
  readonly title: string
  readonly note: string | null
}

export type BookmarkFormSubmitValues = BookmarkFormOutput

/**
 * タイトル取得 action の payload。useActionState の第2引数として渡す。
 * FormData ではなく、URL を載せた通常のオブジェクト。
 */
export type BookmarkTitleFetchPayload = {
  readonly url: string
}

/**
 * タイトル取得 action が返す state。
 * status: 'success' の title は hook 側が Formisch の store へ反映する
 * (action は form store にアクセスできない)。
 */
export type BookmarkTitleFetchState =
  | { readonly status: 'idle' }
  | { readonly status: 'success'; readonly title: string }
  | { readonly status: 'error'; readonly message: string }

/**
 * そのまま useActionState に渡せるタイトル取得 action。
 * 前回の state と payload ({ url }) を受け取り、次の state を返す。
 */
export type BookmarkTitleFetchAction = (
  previousState: BookmarkTitleFetchState,
  payload: BookmarkTitleFetchPayload
) => Promise<BookmarkTitleFetchState>

export type BookmarkFormProps = {
  readonly initialValues: BookmarkFormInitialValues
  /**
   * BookmarkEditor が保持するサーバーエラーを表示だけのために受け取る。
   * Formisch store へコピーしない。入力変更時は onClearFieldError 経由で
   * 所有者 (BookmarkEditor) に削除を依頼する。
   */
  readonly serverError?: BookmarkFormServerError | null
  /**
   * Field 入力変更時に、対応する server error を BookmarkEditor 側で clear するための通知。
   * Formisch の field error は BookmarkForm が自前で clear するので、
   * ここでは server error 側の clear だけを扱う。
   */
  readonly onClearFieldError?: (field: BookmarkFormFieldKey) => void
  readonly submitLabel?: string
  readonly pendingLabel?: string
  readonly legend?: string
  readonly onSubmit: (values: BookmarkFormSubmitValues) => void | Promise<void>
  /** タイトル取得 action。useActionState にそのまま渡す。Server Function は注入側が持つ */
  readonly fetchTitleAction: BookmarkTitleFetchAction
}

export type BookmarkFormStore = FormStore<typeof bookmarkFormSchema>
