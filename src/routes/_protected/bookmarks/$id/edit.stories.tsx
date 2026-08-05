import { expect, mocked, userEvent, waitFor, within } from 'storybook/test'
import * as v from 'valibot'

import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema
} from '../../../../features/bookmarks/domain/bookmark-values'
import { loadBookmarkForEdit } from '../../../../features/bookmarks/functions/load-bookmark-for-edit'
import { updateBookmark } from '../../../../features/bookmarks/functions/update-bookmark'
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

function neverBookmark() {
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
    mocked(updateBookmark).mockResolvedValue(ok({ bookmarkId: editorData.bookmarkId }))
  }
})

export const Default = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: 'ブックマークを並べ替える' })
    ).toBeInTheDocument()
    await expect(canvas.getByLabelText('URL')).toHaveValue(String(editorData.url))
    await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
  }
})

export const InitialLoading = meta.story({
  beforeEach: async () => {
    mocked(loadBookmarkForEdit).mockImplementation(() => neverBookmark())
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
