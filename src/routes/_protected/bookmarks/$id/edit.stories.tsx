import { ORPCError } from '@orpc/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import * as v from 'valibot'

import type { UpdateBookmark } from '../../../../features/bookmarks/application/update-bookmark'
import { bookmarkIdSchema } from '../../../../features/bookmarks/domain/bookmark-values'
import { createAppRouter } from '../../../../rpc/create-app-router'
import type { AppRouter } from '../../../../rpc/create-app-router'
import { handleRpcRequest } from '../../../../rpc/handle-request.server'
import { orpc } from '../../../../rpc/query'
import preview from '../../../../storybook/preview'
import { Route } from './edit'

const editorStaleTime = 5000
const bookmarkId = '019fae92-3bb0-78cd-b488-65ce0e26a939'

const editorRecord = {
  id: bookmarkId,
  url: 'https://zenn.dev/mizchi/books/0c55c230f5cc754c38b9',
  title: '2020年版: なぜ仮想 DOM / 宣言的 UI という概念が、あのときの俺達の魂を震えさせたのか',
  note: null,
  tagIds: []
}

type RouterDeps = Parameters<typeof createAppRouter>[0]

let findBookmarkEditorDep: RouterDeps['findBookmarkEditor']
let updateBookmarkDep: UpdateBookmark

function buildRpcRouter(): AppRouter {
  return createAppRouter({
    getSession: async () => ({
      id: 'story-user',
      name: 'Story User',
      email: 'story-user@example.com'
    }),
    insertTag: async () => ({ kind: 'created', id: 1 as never }),
    updateTag: async () => ({ kind: 'not-found' }),
    touchTag: async () => ({ kind: 'touched' }),
    listShelfTags: async () => [],
    listTags: async () => [],
    findTagById: async () => null,
    insertBookmark: async () => ({ kind: 'duplicate-url' }),
    fetchPageTitle: async () => ({ kind: 'unavailable' }),
    updateBookmark: updateBookmarkDep,
    findBookmarkEditor: findBookmarkEditorDep,
    listBookmarks: async () => [],
    getBookmarkDetail: async () => null,
    softDeleteBookmark: async () => ({ kind: 'bookmark-not-found', id: '' })
  })
}

/**
 * Storybook には RPC 受け口がないため、/api/rpc への fetch だけを
 * process 内の handleRpcRequest に繋ぎ替える。client 契約ごと exercise する。
 * browser client は呼び出し毎に globalThis.fetch を解決するので、差し替えが効く。
 */
let originalFetch: typeof globalThis.fetch | undefined = undefined

function installRpcFetchStub(): void {
  if (originalFetch === undefined) {
    originalFetch = globalThis.fetch.bind(globalThis)
  }
  const passthroughFetch = originalFetch
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (new URL(url, window.location.origin).pathname === '/api/rpc') {
      return handleRpcRequest(new Request(url, init), buildRpcRouter())
    }
    return passthroughFetch(input, init)
  }) as typeof globalThis.fetch
}

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
})

async function loadEditorForStory(id: string): Promise<{ kind: 'ok' } | { kind: 'not-found' }> {
  try {
    await storyQueryClient.ensureQueryData(
      orpc.bookmarks.editor.queryOptions({ input: { id }, staleTime: editorStaleTime })
    )
    return { kind: 'ok' }
  } catch (error: unknown) {
    // 本物の loader と同じ判定。404 だけ not-found 表示へ落とし、他は error boundary へ投げる。
    if (error instanceof ORPCError && error.defined && error.code === 'bookmark-not-found') {
      return { kind: 'not-found' }
    }
    throw error
  }
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
          '/_protected': {},
          '/_protected/bookmarks/$id/edit': {
            loader: (context: { params: { id: string } }) => loadEditorForStory(context.params.id)
          }
        }
      }
    }
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={storyQueryClient}>
        <Story />
      </QueryClientProvider>
    )
  ],
  beforeEach: async () => {
    findBookmarkEditorDep = async () =>
      Promise.resolve({
        ...editorRecord,
        id: v.parse(bookmarkIdSchema, editorRecord.id)
      })
    updateBookmarkDep = async () => ({ kind: 'updated', id: v.parse(bookmarkIdSchema, bookmarkId) })
    installRpcFetchStub()
    await storyQueryClient.clear()
  }
})

export const Default = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'ブックマークを編集' })).toBeInTheDocument()
    await expect(canvas.getByLabelText('URL')).toHaveValue(editorRecord.url)
    await expect(canvas.getByRole('button', { name: '更新' })).toBeEnabled()
  }
})

export const InitialLoading = meta.story({
  beforeEach: async () => {
    findBookmarkEditorDep = () => new Promise<never>(() => undefined)
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.queryByRole('heading', { name: 'ブックマークを編集' })
    ).not.toBeInTheDocument()
  }
})

export const BookmarkIsNotFound = meta.story({
  beforeEach: async () => {
    findBookmarkEditorDep = async () => null
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
    updateBookmarkDep = async () => ({ kind: 'duplicate-url' })
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
    updateBookmarkDep = async () => {
      throw new Error('server boom')
    }
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
