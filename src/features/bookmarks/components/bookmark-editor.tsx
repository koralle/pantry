import { useEffect, useState, useTransition } from 'react'

import type { CreateTag, SelectableTag } from '../../tags/application/create-tag'
import type { TagId } from '../../tags/domain/tag-values'
import type {
  ExecuteUpdateBookmark,
  UpdateBookmarkError
} from '../application/execute-update-bookmark'
import type { BookmarkEditorData } from '../application/load-bookmark-for-edit'
import type { LoadSelectableTags, SelectableTagsResult } from '../application/load-selectable-tags'
import type { BookmarkId } from '../domain/bookmark-values'
import { BookmarkForm } from './bookmark-form'
import type { BookmarkFormError, BookmarkFormSubmitValues } from './bookmark-form'
import { BookmarkTagField } from './bookmark-tag-field'

export type { ExecuteUpdateBookmark, LoadSelectableTags }

export type BookmarkEditorProps = {
  readonly initialData: BookmarkEditorData
  readonly executeUpdate: ExecuteUpdateBookmark
  readonly initialTags: Promise<SelectableTagsResult>
  readonly loadSelectableTags: LoadSelectableTags
  readonly createTag: CreateTag
  readonly onCompleted: (bookmarkId: BookmarkId) => Promise<void>
  readonly onFetchTitle?: (url: string) => Promise<string | null>
}

type TagsViewState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly tags: readonly SelectableTag[] }
  | { readonly status: 'blank' }
  | { readonly status: 'error'; readonly message: string }

function mapUpdateError(error: UpdateBookmarkError): BookmarkFormError {
  switch (error.code) {
    case 'bookmark-not-found': {
      return { summary: 'このブックマークは見つかりません' }
    }
    case 'duplicate-url': {
      return {
        summary: '同じ URL のブックマークが既にあります',
        fields: { url: 'この URL は既に登録されています' }
      }
    }
    case 'invalid-title': {
      return {
        summary: '入力内容を確認してください',
        fields: { title: 'タイトルを入力してください' }
      }
    }
    case 'invalid-url': {
      return {
        summary: '入力内容を確認してください',
        fields: { url: '有効な URL を入力してください' }
      }
    }
    case 'duplicate-tag-id': {
      return {
        summary: 'タグの指定が不正です',
        fields: { tags: '同じタグが重複しています' }
      }
    }
    case 'invalid-tag': {
      return {
        summary: 'タグの指定が不正です',
        fields: {
          tags:
            error.cause.code === 'tag-not-owned'
              ? '選択したタグを利用できません'
              : '選択したタグが見つかりません'
        }
      }
    }
    case 'unexpected-error': {
      return { summary: '保存に失敗しました。時間をおいて再度お試しください' }
    }
  }
}

function resolveTagsState(result: SelectableTagsResult): TagsViewState {
  if (!result.ok) {
    return { status: 'error', message: 'タグ候補の取得に失敗しました' }
  }
  if (result.value.length === 0) {
    return { status: 'blank' }
  }
  return {
    status: 'ready',
    tags: result.value.map((tag) => ({ id: tag.id, name: tag.name }))
  }
}

/**
 * BookmarkEditor は編集操作のオーケストレーター。
 * Server Function / Router / DB を直接 import せず、依存を props で注入する。
 * Storybook では fake port に差し替えて画面状態を再現できる。
 */
export function BookmarkEditor({
  initialData,
  executeUpdate,
  initialTags,
  loadSelectableTags,
  createTag,
  onCompleted,
  onFetchTitle
}: BookmarkEditorProps) {
  const [selectedTagIds, setSelectedTagIds] = useState<readonly TagId[]>(() => [
    ...initialData.tagIds
  ])
  const [tagsState, setTagsState] = useState<TagsViewState>({ status: 'loading' })
  const [formError, setFormError] = useState<BookmarkFormError | null>(null)
  const [submission, setSubmission] = useState<'idle' | 'pending'>('idle')
  const [, startTagsTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await initialTags
      if (!cancelled) {
        setTagsState(resolveTagsState(result))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [initialTags])

  function retryTags() {
    // タグ再取得は入力をブロックしない非緊急更新として useTransition で包む。
    startTagsTransition(() => {
      setTagsState({ status: 'loading' })
      void (async () => {
        const result = await loadSelectableTags()
        setTagsState(resolveTagsState(result))
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

  async function handleSubmit(values: BookmarkFormSubmitValues) {
    setFormError(null)
    setSubmission('pending')

    try {
      const result = await executeUpdate({
        bookmarkId: initialData.bookmarkId,
        url: values.url,
        title: values.title,
        note: values.note,
        tagIds: selectedTagIds
      })

      if (!result.ok) {
        setFormError(mapUpdateError(result.error))
        return
      }

      await onCompleted(result.value.bookmarkId)
    } catch {
      setFormError(mapUpdateError({ code: 'unexpected-error' }))
    } finally {
      setSubmission('idle')
    }
  }

  const tagField =
    tagsState.status === 'loading' ? (
      <BookmarkTagField.Loading />
    ) : tagsState.status === 'error' ? (
      <BookmarkTagField.Error
        message={tagsState.message}
        onRetry={retryTags}
      />
    ) : tagsState.status === 'blank' ? (
      <BookmarkTagField.Blank
        onCreateTag={createTag}
        onCreated={handleTagCreated}
      />
    ) : (
      <BookmarkTagField.Ready
        tags={tagsState.tags}
        selectedTagIds={selectedTagIds}
        onSelectedTagIdsChange={setSelectedTagIds}
        onCreateTag={createTag}
      />
    )

  return (
    <BookmarkForm
      initialValues={{
        url: initialData.url,
        title: initialData.title,
        note: initialData.note
      }}
      errors={formError}
      submission={submission}
      submitLabel='更新'
      pendingLabel='更新中…'
      onSubmit={handleSubmit}
      {...(onFetchTitle != null ? { onFetchTitle } : {})}>
      {tagField}
    </BookmarkForm>
  )
}
