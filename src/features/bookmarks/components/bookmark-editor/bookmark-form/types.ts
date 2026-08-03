import type { FormStore } from '@formisch/react'
import type { ReactNode } from 'react'

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
 * フォーム向けは form へ、タグ向けは tags へ振り分ける。
 * Formisch validation error はここへ持ち込まない。
 */
export type BookmarkEditorError = {
  readonly form?: BookmarkFormServerError
  readonly tags?: string
}

export type BookmarkFormInitialValues = {
  readonly url: string
  readonly title: string
  readonly note: string | null
}

export type BookmarkFormSubmitValues = BookmarkFormOutput

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
  /** タイトル取得。Server Function は注入側が持つ */
  readonly onFetchTitle?: (url: string) => Promise<string | null>
  /** タグ領域など、フォーム内に差し込む UI */
  readonly children?: ReactNode
}

export type BookmarkFormStore = FormStore<typeof bookmarkFormSchema>
