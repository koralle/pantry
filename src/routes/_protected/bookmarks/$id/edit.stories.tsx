import { expect, mocked, userEvent, waitFor, within } from 'storybook/test'
import * as v from 'valibot'

import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../../../../features/bookmarks/domain/bookmark-values'
import { loadBookmarkForEdit } from '../../../../features/bookmarks/functions/load-bookmark-for-edit'
import { loadSelectableTags } from '../../../../features/bookmarks/functions/load-selectable-tags'
import { updateBookmark } from '../../../../features/bookmarks/functions/update-bookmark'
import { tagIdSchema, tagNameSchema } from '../../../../features/tags/domain/tag-values'
import { createTag } from '../../../../features/tags/functions/create-tag'
import { err, ok } from '../../../../shared/domain/result'
import preview from '../../../../storybook/preview'
import { Route } from './edit'

const bookmarkId = '019fae92-3bb0-78cd-b488-65ce0e26a939'

const editorData = {
  bookmarkId: v.parse(bookmarkIdSchema, bookmarkId),
  url: v.parse(bookmarkUrlSchema, 'https://zenn.dev/mizchi/books/0c55c230f5cc754c38b9'),
  title: v.parse(
    bookmarkTitleSchema,
    '2020年版: なぜ仮想 DOM / 宣言的 UI という概念が、あのときの俺達の魂を震えさせたのか'
  ),
  note: v.parse(bookmarkNoteSchema, ''),
  tagIds: []
}

const sampleTags = [
  { id: v.parse(tagIdSchema, 1), name: v.parse(tagNameSchema, 'react') },
  { id: v.parse(tagIdSchema, 2), name: v.parse(tagNameSchema, 'typescript') },
  { id: v.parse(tagIdSchema, 3), name: v.parse(tagNameSchema, 'uiux') }
]

function neverTags() {
  return new Promise<never>(() => undefined)
}

const meta = preview.meta({
  title: 'Pages / ブックマーク編集画面',
  parameters: {
    layout: 'fullscreen',
    tanstack: {
      router: {
        route: Route,
        params: {
          id: bookmarkId
        },
        routeOverrides: {
          '/_protected': {}
        }
      }
    }
  },
  beforeEach: async () => {
    mocked(loadBookmarkForEdit).mockResolvedValue(ok(editorData))
    mocked(loadSelectableTags).mockResolvedValue(ok(sampleTags))
    mocked(updateBookmark).mockResolvedValue(ok({ bookmarkId: editorData.bookmarkId }))
    mocked(createTag).mockResolvedValue(
      ok({
        id: v.parse(tagIdSchema, 10),
        name: v.parse(tagNameSchema, 'created')
      })
    )
  }
})

export const Default = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: 'ブックマークを並べ替える' })
    ).toBeInTheDocument()
    await expect(canvas.getByLabelText('URL')).toHaveValue(String(editorData.url))
    await waitFor(async () => {
      await expect(canvas.getByRole('checkbox', { name: 'react' })).toBeInTheDocument()
    })
  }
})

export const InitialLoading = meta.story({
  beforeEach: async () => {
    mocked(loadBookmarkForEdit).mockImplementation(() => neverTags())
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.queryByRole('heading', { name: 'ブックマークを並べ替える' })
    ).not.toBeInTheDocument()
  }
})

export const BookmarkIsNotFound = meta.story({
  beforeEach: async () => {
    mocked(loadBookmarkForEdit).mockResolvedValue(err({ code: 'bookmark-not-found' }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: 'このブックマークは見つかりません' })
    ).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: '一覧へ戻る' })).toBeInTheDocument()
  }
})

export const TagOptionsAreLoading = meta.story({
  beforeEach: async () => {
    mocked(loadBookmarkForEdit).mockResolvedValue(ok(editorData))
    mocked(loadSelectableTags).mockImplementation(() => neverTags())
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('URL')).toBeEnabled()
    await expect(canvas.getByText('タグを読み込み中…')).toBeInTheDocument()
  }
})

export const TagOptionsAreEmpty = meta.story({
  beforeEach: async () => {
    mocked(loadSelectableTags).mockResolvedValue(ok([]))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(
        canvas.getByText('タグがまだありません。名前を入れて作成できます。')
      ).toBeInTheDocument()
    })
    await expect(canvas.getByRole('button', { name: /この名前で作成/ })).toBeInTheDocument()
  }
})

export const TagOptionsLoadFailed = meta.story({
  beforeEach: async () => {
    mocked(loadSelectableTags).mockResolvedValue(err({ code: 'unexpected-error' }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByText('タグ候補の取得に失敗しました')).toBeInTheDocument()
    })
    await expect(canvas.getByLabelText('URL')).toBeEnabled()
    await expect(canvas.getByRole('button', { name: /再試行/ })).toBeInTheDocument()
  }
})

export const TagOptionsLoadRejected = meta.story({
  beforeEach: async () => {
    mocked(loadSelectableTags).mockRejectedValue(new Error('tag load failed'))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByText('タグ候補の取得に失敗しました')).toBeInTheDocument()
    })
    await expect(canvas.getByLabelText('URL')).toBeEnabled()
    await expect(canvas.getByRole('button', { name: /再試行/ })).toBeEnabled()
  }
})

export const TagOptionsRetrySucceeded = meta.story({
  beforeEach: async () => {
    mocked(loadSelectableTags)
      .mockResolvedValueOnce(err({ code: 'unexpected-error' }))
      .mockResolvedValueOnce(ok(sampleTags))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: /再試行/ })).toBeInTheDocument()
    })
    await userEvent.click(canvas.getByRole('button', { name: /再試行/ }))
    await waitFor(async () => {
      await expect(canvas.getByRole('checkbox', { name: 'react' })).toBeInTheDocument()
    })
  }
})

export const UpdateHasDuplicateUrl = meta.story({
  beforeEach: async () => {
    mocked(updateBookmark).mockResolvedValue(err({ code: 'duplicate-url' }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
    })
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent(
      '同じ URL のブックマークが既にあります'
    )
  }
})

export const UpdateHasInvalidTag = meta.story({
  beforeEach: async () => {
    mocked(loadBookmarkForEdit).mockResolvedValue(
      ok({
        ...editorData,
        tagIds: [v.parse(tagIdSchema, 1)]
      })
    )
    mocked(updateBookmark).mockResolvedValue(
      err({
        code: 'invalid-tag',
        field: 'tags',
        cause: { code: 'tag-not-found', tagId: v.parse(tagIdSchema, 1) }
      })
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
    })
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    // タグ側の更新 server error はタグ領域だけに表示される。
    // BookmarkForm の summary へは混ぜないので、'次を確認してください' には出さない。
    await waitFor(async () => {
      await expect(canvas.getByText('選択したタグが見つかりません')).toBeInTheDocument()
    })
    const alerts = canvas.queryAllByRole('alert')
    for (const alert of alerts) {
      if (alert.textContent?.includes('次を確認してください')) {
        await expect(alert.textContent).not.toContain('選択したタグが見つかりません')
      }
    }
  }
})

export const UpdateHasUnexpectedError = meta.story({
  beforeEach: async () => {
    mocked(updateBookmark).mockRejectedValue(new Error('server boom'))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
    })
    await userEvent.click(canvas.getByRole('button', { name: '更新' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('保存に失敗しました')
  }
})

export const CreateTagFromEmptyOptions = meta.story({
  beforeEach: async () => {
    mocked(loadSelectableTags).mockResolvedValue(ok([]))
    mocked(createTag).mockImplementation(async (input) => {
      const name =
        typeof input === 'object' && input != null && 'data' in input
          ? String((input as { data: { name: string } }).data.name)
          : 'new-tag'
      return ok({
        id: v.parse(tagIdSchema, 42),
        name: v.parse(tagNameSchema, name)
      })
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: /この名前で作成/ })).toBeInTheDocument()
    })
    const input = canvas.getByPlaceholderText('タグを絞り込む / 新規作成')
    await userEvent.type(input, 'new-tag')
    await userEvent.click(canvas.getByRole('button', { name: /この名前で作成/ }))
    await waitFor(async () => {
      await expect(canvas.getByRole('checkbox', { name: 'new-tag' })).toBeChecked()
    })
  }
})

export const CreateTagNameAlreadyExists = meta.story({
  beforeEach: async () => {
    mocked(loadSelectableTags).mockResolvedValue(ok([]))
    mocked(createTag).mockResolvedValue(err({ code: 'duplicate-tag-name', field: 'name' }))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: /この名前で作成/ })).toBeInTheDocument()
    })
    const input = canvas.getByPlaceholderText('タグを絞り込む / 新規作成')
    await userEvent.type(input, 'react')
    await userEvent.click(canvas.getByRole('button', { name: /この名前で作成/ }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('そのタグ名は既に存在します')
  }
})
