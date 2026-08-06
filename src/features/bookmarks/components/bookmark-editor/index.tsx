import { useState } from 'react'

import type { ExecuteUpdateBookmark } from '../../application/execute-update-bookmark'
import type { BookmarkEditorData } from '../../application/load-bookmark-for-edit'
import type { BookmarkId } from '../../domain/bookmark-values'
import { buildUpdateBookmarkCommand } from './bookmark-editor-command'
import { mapUpdateBookmarkError } from './bookmark-editor-error'
import { BookmarkForm } from './bookmark-form'
import type {
  BookmarkEditorError,
  BookmarkFormFieldKey,
  BookmarkFormSubmitValues,
  BookmarkTitleFetchAction
} from './bookmark-form'

export type { ExecuteUpdateBookmark }
export type {
  BookmarkTitleFetchAction,
  BookmarkTitleFetchPayload,
  BookmarkTitleFetchState
} from './bookmark-form'

export type BookmarkEditorProps = {
  readonly initialData: BookmarkEditorData
  readonly onUpdateBookmark: ExecuteUpdateBookmark
  readonly onCompleted: (bookmarkId: BookmarkId) => Promise<void>
  readonly fetchTitleAction?: BookmarkTitleFetchAction
}

/**
 * BookmarkEditor は編集操作のオーケストレーター。
 * Server Function / Router / DB を直接 import せず、依存を props で注入する。
 * Storybook では fake port に差し替えて画面状態を再現できる。
 */
export function BookmarkEditor({
  initialData,
  onUpdateBookmark,
  onCompleted,
  fetchTitleAction
}: BookmarkEditorProps) {
  // 更新結果の server error は BookmarkEditor が唯一の所有者になる。
  // BookmarkForm へは表示用に serverError を渡し、Formisch store へはコピーしない。
  // これによって、Formisch の validation error と server error のライフサイクルを
  // 分離でき、field の onChange から Formisch と server それぞれの clear 経路が
  // 明確に分かれる。
  const [editorError, setEditorError] = useState<BookmarkEditorError | null>(null)

  function clearFormFieldError(field: BookmarkFormFieldKey) {
    // BookmarkForm の field 入力変更に応じて、対応する server field error だけを取り除く。
    // Summary と他 field は残す。所有者が Editor 側なので、
    // BookmarkForm から Formisch を触らずに済む。
    setEditorError((current) => {
      if (current === null || current.form === undefined) {
        return current
      }
      const { fields } = current.form
      if (fields === undefined || fields[field] === undefined) {
        return current
      }
      const { [field]: _removed, ...rest } = fields
      const nextFields = Object.keys(rest).length === 0 ? undefined : rest
      const nextForm: BookmarkEditorError['form'] = {
        ...(current.form.summary === undefined ? {} : { summary: current.form.summary }),
        ...(nextFields === undefined ? {} : { fields: nextFields })
      }
      const isFormEmpty = nextForm.summary === undefined && nextForm.fields === undefined
      return isFormEmpty ? {} : { form: nextForm }
    })
  }

  async function handleSubmit(values: BookmarkFormSubmitValues) {
    setEditorError(null)

    // OnUpdateBookmark と onCompleted のエラー境界を分離する。
    // Update が成功したあとに Navigation (onCompleted) が失敗しても、
    // それは「保存失敗」ではない (実データは保存済み)。
    // 保存済みであることを伝える安全なメッセージへ変換し、Formisch の submit
    // Handler へ rejection を返して raw error を validation error にしない。
    let updateResult: Awaited<ReturnType<ExecuteUpdateBookmark>>
    try {
      updateResult = await onUpdateBookmark(buildUpdateBookmarkCommand(initialData, values))
    } catch {
      setEditorError(mapUpdateBookmarkError({ code: 'unexpected-error' }))
      return
    }

    if (!updateResult.ok) {
      setEditorError(mapUpdateBookmarkError(updateResult.error))
      return
    }

    try {
      await onCompleted(updateResult.value.bookmarkId)
    } catch {
      setEditorError({
        form: {
          summary: '保存は完了しましたが、画面の移動に失敗しました'
        }
      })
    }
  }

  return (
    <BookmarkForm
      initialValues={{
        url: initialData.url,
        title: initialData.title,
        note: initialData.note
      }}
      serverError={editorError?.form ?? null}
      onClearFieldError={clearFormFieldError}
      submitLabel='更新'
      pendingLabel='更新中…'
      onSubmit={handleSubmit}
      {...(fetchTitleAction != null ? { fetchTitleAction } : {})}
    />
  )
}
