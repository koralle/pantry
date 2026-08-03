import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import type { Mock } from 'storybook/test'
import { styled } from 'styled-system/jsx'
import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'

import { err, ok } from '../../../../shared/domain/result'
import preview from '../../../../storybook/preview'
import type { CreateTag } from '../../../tags/application/create-tag'
import { tagIdSchema, tagNameSchema } from '../../../tags/domain/tag-values'
import type {
  ExecuteUpdateBookmark,
  UpdateBookmarkError
} from '../../application/execute-update-bookmark'
import type { BookmarkEditorData } from '../../application/load-bookmark-for-edit'
import type {
  LoadSelectableTags,
  SelectableTagsResult
} from '../../application/load-selectable-tags'
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../../domain/bookmark-values'
import { BookmarkEditor } from './index'

const bookmarkId = v.parse(bookmarkIdSchema, uuidv7())

const initialData: BookmarkEditorData = {
  bookmarkId,
  url: v.parse(bookmarkUrlSchema, 'https://example.com/article'),
  title: v.parse(bookmarkTitleSchema, 'Example Article'),
  note: v.parse(bookmarkNoteSchema, 'メモ'),
  tagIds: [v.parse(tagIdSchema, 1)]
}

const sampleTags = [
  { id: v.parse(tagIdSchema, 1), name: v.parse(tagNameSchema, 'react') },
  { id: v.parse(tagIdSchema, 2), name: v.parse(tagNameSchema, 'typescript') }
] as const

function resolvedTags(result: SelectableTagsResult): Promise<SelectableTagsResult> {
  return Promise.resolve(result)
}

function deferredTags(): {
  promise: Promise<SelectableTagsResult>
  resolve: (result: SelectableTagsResult) => void
  reject: (reason?: unknown) => void
} {
  let resolve!: (result: SelectableTagsResult) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<SelectableTagsResult>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const rejectedTagLoad = deferredTags()
const staleRetryTagLoad = deferredTags()

const meta = preview.meta({
  title: 'Components / BookmarkEditor',
  component: BookmarkEditor,
  parameters: {
    layout: 'padded'
  },
  decorators: [
    (Story) => (
      <styled.div maxInlineSize='36rem'>
        <Story />
      </styled.div>
    )
  ]
})

export const Default = meta.story({
  args: {
    initialData,
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () => ok({ bookmarkId })),
    initialTags: resolvedTags(ok(sampleTags)),
    onLoadSelectableTags: fn<LoadSelectableTags>(async () => ok(sampleTags)),
    onCreateTag: fn<CreateTag>(async (name) =>
      ok({ id: v.parse(tagIdSchema, 99), name: v.parse(tagNameSchema, name) })
    ),
    onCompleted: fn(async () => undefined),
    onFetchTitle: fn(async () => '取得したタイトル')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('URL')).toHaveValue(String(initialData.url))
    await expect(canvas.getByRole('checkbox', { name: 'react' })).toBeChecked()
    await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
  }
})

export const TagOptionsAreLoading = Default.extend({
  args: {
    initialTags: deferredTags().promise
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('URL')).toBeEnabled()
    await expect(canvas.getByText('タグを読み込み中…')).toBeInTheDocument()
  }
})

export const TagOptionsLoadFailed = Default.extend({
  args: {
    initialTags: resolvedTags(err({ code: 'unexpected-error' })),
    onLoadSelectableTags: fn<LoadSelectableTags>(async () => ok(sampleTags))
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('タグ候補の取得に失敗しました')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /再試行/ }))
    const onLoadSelectableTags = args.onLoadSelectableTags as Mock<LoadSelectableTags>
    await expect(onLoadSelectableTags).toHaveBeenCalled()
    await waitFor(async () => {
      await expect(canvas.getByRole('checkbox', { name: 'react' })).toBeInTheDocument()
    })
  }
})

export const TagOptionsLoadRejected = Default.extend({
  args: {
    initialTags: rejectedTagLoad.promise
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    rejectedTagLoad.reject(new Error('tag load failed'))
    await expect(canvas.findByText('タグ候補の取得に失敗しました')).resolves.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: /再試行/ })).toBeEnabled()
  }
})

export const StaleTagLoadDoesNotReplaceNewTags = meta.story({
  args: {
    initialData,
    initialTags: resolvedTags(err({ code: 'unexpected-error' })),
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () => ok({ bookmarkId })),
    onLoadSelectableTags: fn<LoadSelectableTags>(async () => staleRetryTagLoad.promise),
    onCreateTag: fn<CreateTag>(async (name) =>
      ok({ id: v.parse(tagIdSchema, 99), name: v.parse(tagNameSchema, name) })
    ),
    onCompleted: fn(async () => undefined),
    onFetchTitle: fn(async () => '取得したタイトル')
  },
  render: (args) => {
    const [initialTags, setInitialTags] = useState(args.initialTags)
    return (
      <>
        <button
          type='button'
          onClick={() => setInitialTags(resolvedTags(ok(sampleTags)))}>
          新しいタグ候補を読み込む
        </button>
        <BookmarkEditor
          {...args}
          initialTags={initialTags}
        />
      </>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('タグ候補の取得に失敗しました')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /再試行/ }))
    await expect(canvas.getByText('タグを読み込み中…')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: '新しいタグ候補を読み込む' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('checkbox', { name: 'react' })).toBeInTheDocument()
    })

    staleRetryTagLoad.resolve(err({ code: 'unexpected-error' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('checkbox', { name: 'react' })).toBeInTheDocument()
      await expect(canvas.queryByText('タグ候補の取得に失敗しました')).not.toBeInTheDocument()
    })
  }
})

export const UpdateHasDuplicateUrl = Default.extend({
  args: {
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () => err({ code: 'duplicate-url' }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      '同じ URL のブックマークが既にあります'
    )
  }
})

export const UpdateHasUnexpectedError = Default.extend({
  args: {
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () => {
      throw new Error('boom')
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('保存に失敗しました')
  }
})

export const UpdateHasInvalidTagWhileTagsAreLoading = Default.extend({
  args: {
    initialTags: deferredTags().promise,
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () =>
      err<UpdateBookmarkError>({
        code: 'invalid-tag',
        field: 'tags',
        cause: { code: 'tag-not-found', tagId: v.parse(tagIdSchema, 1) }
      })
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByText('選択したタグが見つかりません')).toBeInTheDocument()
  }
})

export const UpdateHasInvalidTagWhileTagsFailed = Default.extend({
  args: {
    initialTags: resolvedTags(err({ code: 'unexpected-error' })),
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () =>
      err<UpdateBookmarkError>({
        code: 'invalid-tag',
        field: 'tags',
        cause: { code: 'tag-not-found', tagId: v.parse(tagIdSchema, 1) }
      })
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('タグ候補の取得に失敗しました')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByText('選択したタグが見つかりません')).toBeInTheDocument()
  }
})

export const UpdatePendingDisablesTagControls = Default.extend({
  args: {
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(
      () => new Promise<Awaited<ReturnType<ExecuteUpdateBookmark>>>(() => {})
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('checkbox', { name: 'react' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: 'この名前で作成' })).toBeDisabled()
  }
})

export const CompletionNavigationFails = Default.extend({
  args: {
    onCompleted: fn(async () => {
      throw new Error('navigation failed')
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      '保存は完了しましたが、画面の移動に失敗しました'
    )
    await expect(canvas.queryByText('navigation failed')).not.toBeInTheDocument()
  }
})

export const FetchingTitleClearsTitleServerError = Default.extend({
  args: {
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () =>
      err({ code: 'invalid-title', field: 'title' })
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('タイトルを入力してください')

    await userEvent.click(canvas.getByRole('button', { name: 'タイトルを取得' }))
    await expect(canvas.getByLabelText('タイトル')).toHaveValue('取得したタイトル')
    await expect(canvas.queryByText('タイトルを入力してください')).not.toBeInTheDocument()
  }
})

export const UpdateInvalidTagStaysInTagAreaOnly = Default.extend({
  args: {
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () =>
      err<UpdateBookmarkError>({
        code: 'invalid-tag',
        field: 'tags',
        cause: { code: 'tag-not-found', tagId: v.parse(tagIdSchema, 1) }
      })
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
    })
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))

    // タグ領域だけに表示される
    const alerts = await canvas.findAllByRole('alert')
    const tagAlert = alerts.find((element) =>
      element.textContent?.includes('選択したタグが見つかりません')
    )
    expect(tagAlert).toBeDefined()

    // BookmarkForm の summary (「次を確認してください」) にはタグ由来メッセージが載らない
    for (const alert of alerts) {
      if (alert.textContent?.includes('次を確認してください')) {
        expect(alert.textContent).not.toContain('選択したタグが見つかりません')
      }
    }
  }
})

/**
 * タグ選択を変更するとタグ側の更新 server error が clear されることを検証する。
 * URL/title 側の入力変更経路とは別の clear 契約 (onClearTagsError) を通ることを担保する。
 */
export const SelectingTagClearsTagsServerError = Default.extend({
  args: {
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () =>
      err<UpdateBookmarkError>({
        code: 'invalid-tag',
        field: 'tags',
        cause: { code: 'tag-not-found', tagId: v.parse(tagIdSchema, 1) }
      })
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
    })
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await waitFor(() => {
      expect(canvas.getByText('選択したタグが見つかりません')).toBeInTheDocument()
    })

    // タグの選択変更で server error が消える
    await userEvent.click(canvas.getByRole('checkbox', { name: 'typescript' }))
    await waitFor(() => {
      expect(canvas.queryByText('選択したタグが見つかりません')).not.toBeInTheDocument()
    })
  }
})

/**
 * BookmarkForm の URL 入力を編集しても、タグ側の server error は消えない。
 * 「タグの clear はタグ操作で」「URL/title の clear はそれぞれの入力で」という
 * 責務境界を検証する。
 */
export const EditingUrlDoesNotClearTagsServerError = Default.extend({
  args: {
    onUpdateBookmark: fn<ExecuteUpdateBookmark>(async () =>
      err<UpdateBookmarkError>({
        code: 'invalid-tag',
        field: 'tags',
        cause: { code: 'tag-not-found', tagId: v.parse(tagIdSchema, 1) }
      })
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
    })
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await waitFor(() => {
      expect(canvas.getByText('選択したタグが見つかりません')).toBeInTheDocument()
    })

    const url = canvas.getByLabelText('URL')
    await userEvent.type(url, '/updated')
    // URL 入力変更ではタグ側は消えない
    await expect(canvas.getByText('選択したタグが見つかりません')).toBeInTheDocument()
  }
})
