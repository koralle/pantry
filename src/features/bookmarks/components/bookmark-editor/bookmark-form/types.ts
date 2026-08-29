import type { CreateTagFromPickerAction } from '../../../lib/execute-create-tag-from-picker'
import type { TagCandidate } from '../../bookmark-tag-picker'
import type { BookmarkFormOutput } from './schema'

export type BookmarkFormFieldKey = 'url' | 'title' | 'note' | 'tags'

/**
 * BookmarkForm が受け取る画面表示用サーバーエラー。
 * Conform の validation error はここに載せず、Conform が所有する。
 */
export type BookmarkFormServerError = {
  readonly summary?: string
  readonly fields?: Partial<Record<BookmarkFormFieldKey, string>>
}

/**
 * BookmarkEditor が唯一の所有者となる更新結果エラー。
 * Conform validation error はここへ持ち込まない。
 */
export type BookmarkEditorError = {
  readonly form?: BookmarkFormServerError
}

export type BookmarkFormInitialValues = {
  readonly url: string
  readonly title: string
  readonly note: string | null
  readonly tagIds?: readonly number[]
}

export type BookmarkFormSubmitValues = BookmarkFormOutput & {
  readonly tagIds: readonly number[]
}

/** タイトル取得 action の payload。useActionState の第2引数に渡すオブジェクト */
export type BookmarkTitleFetchPayload = {
  readonly url: string
}

/** タイトル取得 action が返す state。success の title は hook 側のラッパーが form へ反映する */
export type BookmarkTitleFetchState =
  | { readonly status: 'idle' }
  | { readonly status: 'success'; readonly title: string }
  | { readonly status: 'error'; readonly message: string }

/**
 * タイトル取得 action。前回の state と payload から次の state を返す。
 * 呼び出し時の previousState は 'success' にならない (ラッパーが反映後に idle へ正規化する)。
 * 成功時の form 反映は hook 側のラッパーが行う。
 */
export type BookmarkTitleFetchAction = (
  previousState: BookmarkTitleFetchState,
  payload: BookmarkTitleFetchPayload
) => Promise<BookmarkTitleFetchState>

export type BookmarkFormProps = {
  readonly initialValues: BookmarkFormInitialValues
  /**
   * BookmarkEditor が保持するサーバーエラーを表示だけのために受け取る。
   * Conform へコピーしない。入力変更時は onClearFieldError 経由で
   * 所有者 (BookmarkEditor) に削除を依頼する。
   */
  readonly serverError?: BookmarkFormServerError | null
  /**
   * Field 入力変更時に、対応する server error を BookmarkEditor 側で clear するための通知。
   * Conform の field error は BookmarkForm が自前で clear するので、
   * ここでは server error 側の clear だけを扱う。
   */
  readonly onClearFieldError?: (field: BookmarkFormFieldKey) => void
  readonly submitLabel?: string
  readonly pendingLabel?: string
  readonly legend?: string
  readonly onSubmit: (values: BookmarkFormSubmitValues) => void | Promise<void>
  /** タイトル取得 action。hook 側のラッパーを経て useActionState に渡る。Server Function は注入側が持つ */
  readonly fetchTitleAction: BookmarkTitleFetchAction
  readonly tagCandidates: readonly TagCandidate[]
  readonly tagsReady: boolean
  readonly createTagAction: CreateTagFromPickerAction
}
