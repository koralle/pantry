import type { FormStore } from '@formisch/react'
import type { ReactNode } from 'react'

import { bookmarkFormSchema } from './schema'
import type { BookmarkFormOutput } from './schema'

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

export type BookmarkFormStore = FormStore<typeof bookmarkFormSchema>

export type FormFieldKey = 'url' | 'title' | 'note'
