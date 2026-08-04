import { useState } from 'react'

import type { CreateTag } from '../../../tags/application/create-tag'
import type { TagId } from '../../../tags/domain/tag-values'
import type { ExecuteUpdateBookmark } from '../../application/execute-update-bookmark'
import type { BookmarkEditorData } from '../../application/load-bookmark-for-edit'
import type { SelectableTagsResult } from '../../application/load-selectable-tags'
import type { BookmarkId } from '../../domain/bookmark-values'
import { mapUpdateBookmarkError } from './bookmark-editor-error'
import { BookmarkForm } from './bookmark-form'
import type {
  BookmarkEditorError,
  BookmarkFormFieldKey,
  BookmarkFormSubmitValues
} from './bookmark-form'
import { BookmarkTagField } from './bookmark-tag-field'

export type { ExecuteUpdateBookmark }

export type BookmarkEditorProps = {
  readonly initialData: BookmarkEditorData
  readonly onUpdateBookmark: ExecuteUpdateBookmark
  readonly initialTags: Promise<SelectableTagsResult>
  readonly onCreateTag: CreateTag
  readonly onCompleted: (bookmarkId: BookmarkId) => Promise<void>
  readonly onFetchTitle?: (url: string) => Promise<string | null>
}

/**
 * BookmarkEditor は編集操作のオーケストレーター。
 * Server Function / Router / DB を直接 import せず、依存を props で注入する。
 * Storybook では fake port に差し替えて画面状態を再現できる。
 */
export function BookmarkEditor({
  initialData,
  onUpdateBookmark,
  initialTags,
  onCreateTag,
  onCompleted,
  onFetchTitle
}: BookmarkEditorProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<readonly TagId[]>(() => [
    ...initialData.tagIds
  ])
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
      return {
        ...(isFormEmpty ? {} : { form: nextForm }),
        ...(current.tags === undefined ? {} : { tags: current.tags })
      }
    })
  }

  function clearTagsError() {
    setEditorError((current) => {
      if (current === null || current.tags === undefined) {
        return current
      }
      if (current.form === undefined) {
        return null
      }
      return { form: current.form }
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
      updateResult = await onUpdateBookmark({
        bookmarkId: initialData.bookmarkId,
        url: values.url,
        title: values.title,
        note: values.note,
        tagIds: selectedTagIds
      })
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
      {...(onFetchTitle != null ? { onFetchTitle } : {})}>
      <BookmarkTagField
        initialTags={initialTags}
        selectedTagIds={selectedTagIds}
        onSelectedTagIdsChange={setSelectedTagIds}
        onCreateTag={onCreateTag}
        serverError={editorError?.tags ?? null}
        onClearServerError={clearTagsError}
      />
    </BookmarkForm>
  )
}
