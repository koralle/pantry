import { useEffect, useMemo, useState, useTransition } from 'react'

import type { CreateTag, SelectableTag } from '../../tags/application/create-tag'
import type { TagId } from '../../tags/domain/tag-values'
import type { ExecuteUpdateBookmark } from '../application/execute-update-bookmark'
import type { BookmarkEditorData } from '../application/load-bookmark-for-edit'
import type { LoadSelectableTags, SelectableTagsResult } from '../application/load-selectable-tags'
import type { BookmarkId } from '../domain/bookmark-values'
import { mapUpdateBookmarkError } from './bookmark-editor-error'
import { BookmarkForm } from './bookmark-form'
import type {
  BookmarkEditorError,
  BookmarkFormFieldKey,
  BookmarkFormSubmitValues
} from './bookmark-form'
import { BookmarkTagField } from './bookmark-tag-field'

export type { ExecuteUpdateBookmark, LoadSelectableTags }

export type BookmarkEditorProps = {
  readonly initialData: BookmarkEditorData
  readonly onUpdateBookmark: ExecuteUpdateBookmark
  readonly initialTags: Promise<SelectableTagsResult>
  readonly onLoadSelectableTags: LoadSelectableTags
  readonly onCreateTag: CreateTag
  readonly onCompleted: (bookmarkId: BookmarkId) => Promise<void>
  readonly onFetchTitle?: (url: string) => Promise<string | null>
}

type TagsViewState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly tags: readonly SelectableTag[] }
  | { readonly status: 'blank' }
  | { readonly status: 'error'; readonly message: string }

const tagLoadErrorMessage = 'タグ候補の取得に失敗しました'

function resolveTagsState(result: SelectableTagsResult): TagsViewState {
  if (!result.ok) {
    return { status: 'error', message: tagLoadErrorMessage }
  }
  if (result.value.length === 0) {
    return { status: 'blank' }
  }
  return {
    status: 'ready',
    tags: result.value.map((tag) => ({ id: tag.id, name: tag.name }))
  }
}

async function loadTagsState(load: () => Promise<SelectableTagsResult>): Promise<TagsViewState> {
  try {
    return resolveTagsState(await load())
  } catch {
    return { status: 'error', message: tagLoadErrorMessage }
  }
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
  onLoadSelectableTags,
  onCreateTag,
  onCompleted,
  onFetchTitle
}: BookmarkEditorProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<readonly TagId[]>(() => [
    ...initialData.tagIds
  ])
  const [tagsState, setTagsState] = useState<TagsViewState>({ status: 'loading' })
  // Promise の reject handler は Effect より早く登録する。
  // Route から受け取るタグ取得 Promise が render と Effect の間に reject しても、
  // Unhandled rejection にせず、タグ領域の retry 可能な error state へ変換する。
  const safeInitialTags = useMemo(
    () =>
      initialTags.catch(
        () =>
          ({
            ok: false,
            error: { code: 'unexpected-error' }
          }) as const
      ),
    [initialTags]
  )
  // 更新結果の server error は BookmarkEditor が唯一の所有者になる。
  // BookmarkForm へは表示用に serverError を渡し、Formisch store へはコピーしない。
  // これによって、Formisch の validation error と server error のライフサイクルを
  // 分離でき、field の onChange から Formisch と server それぞれの clear 経路が
  // 明確に分かれる。
  const [editorError, setEditorError] = useState<BookmarkEditorError | null>(null)
  const [, startTagsTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const nextState = await loadTagsState(() => safeInitialTags)
      if (!cancelled) {
        setTagsState(nextState)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [safeInitialTags])

  function retryTags() {
    // タグ再取得は入力をブロックしない非緊急更新として useTransition で包む。
    startTagsTransition(() => {
      setTagsState({ status: 'loading' })
      void (async () => {
        setTagsState(await loadTagsState(onLoadSelectableTags))
      })()
    })
  }

  function handleTagCreated(tag: SelectableTag) {
    setSelectedTagIds((current) => (current.includes(tag.id) ? current : [...current, tag.id]))
    setTagsState((current) => {
      if (current.status === 'blank') {
        return { status: 'ready', tags: [tag] }
      }
      if (current.status === 'ready') {
        if (current.tags.some((existing) => existing.id === tag.id)) {
          return current
        }
        return { status: 'ready', tags: [...current.tags, tag] }
      }
      return current
    })
  }

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

  const tagField =
    tagsState.status === 'loading' ? (
      <BookmarkTagField.Loading serverError={editorError?.tags ?? null} />
    ) : tagsState.status === 'error' ? (
      <BookmarkTagField.Error
        message={tagsState.message}
        onRetry={retryTags}
        serverError={editorError?.tags ?? null}
      />
    ) : tagsState.status === 'blank' ? (
      <BookmarkTagField.Blank
        onCreateTag={onCreateTag}
        onCreated={handleTagCreated}
        serverError={editorError?.tags ?? null}
        onClearServerError={clearTagsError}
      />
    ) : (
      <BookmarkTagField.Ready
        tags={tagsState.tags}
        selectedTagIds={selectedTagIds}
        onSelectedTagIdsChange={setSelectedTagIds}
        onCreateTag={onCreateTag}
        serverError={editorError?.tags ?? null}
        onClearServerError={clearTagsError}
      />
    )

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
      {tagField}
    </BookmarkForm>
  )
}
