import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext, createRoute } from '@tanstack/react-router'
import { expect, mocked, userEvent, waitFor, within } from 'storybook/test'

<<<<<<< HEAD
import { fetchBookmarks } from '../../features/bookmarks/functions/fetch-bookmarks'
import type { BookmarkListItem } from '../../features/bookmarks/lib/attach-bookmark-tags'
=======
import { ensureSession } from '../../features/auth/functions/ensure-session'
import { getSession } from '../../features/auth/functions/get-session'
>>>>>>> 85739b2 (feat(bookmarks): route list/detail reads and delete dialog through oRPC queries)
import { writeListLayout } from '../../features/bookmarks/lib/list-layout-preference'
import type { BookmarkListItem } from '../../features/bookmarks/persistence/list-bookmarks'
import type { BookmarkSearchSchema } from '../../features/navigation/lib/bookmark-search'
import type { ShelfTag } from '../../features/tags/lib/tag-shelf'
import { orpc } from '../../rpc/query'
import preview from '../../storybook/preview'
import { Route as ProtectedLayoutRoute } from '../_protected'
import { Route as ListFileRoute } from './index'

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
})

/**
 * 一覧 read の実 network を止めず、queryFn だけを差し替える。
 * loader の prefetch も load-more も本物の query options / key を通る。
 */
type ListFixtureInput = { readonly offset?: number }

type ListFixture = (
  input: ListFixtureInput
) => BookmarkListItem[] | Promise<BookmarkListItem[]> | Promise<never>

let listFixture: ListFixture

storyQueryClient.setQueryDefaults(orpc.bookmarks.list.key(), {
  queryFn: async ({ queryKey }) => {
    const state = queryKey[1] as { input?: ListFixtureInput }
    const result = listFixture(state?.input ?? {})
    return result
  }
})

function StoryRoot() {
  return (
    <QueryClientProvider client={storyQueryClient}>
      <Outlet />
    </QueryClientProvider>
  )
}

// Storybook's createFileRoute mock treats `/_protected/` as a pathless layout
// (last segment is `_protected`), so binding that file Route duplicates id
// `/_protected/`. Rebuild the layout + index as an explicit pathful tree.
const storyRoot = createRootRouteWithContext<{ readonly queryClient: QueryClient }>()({
  component: StoryRoot
})

const storyProtectedLayout = createRoute({
  id: '/_protected',
  getParentRoute: () => storyRoot,
  // Storybook では oRPC client を立てない。認証済み user context だけを再現する。
  beforeLoad: () => ({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email
    }
  }),
  loader: async () => ({
    shelfTagsPromise: Promise.resolve(shelfTags)
  }),
  component: ProtectedLayoutRoute.options.component!
})

const storyListRoute = createRoute({
  getParentRoute: () => storyProtectedLayout as never,
  path: '/',
  validateSearch: ListFileRoute.options.validateSearch!,
  loaderDeps: ListFileRoute.options.loaderDeps!,
  loader: ListFileRoute.options.loader!,
  component: ListFileRoute.options.component!
})

storyProtectedLayout.addChildren([storyListRoute])
storyRoot.addChildren([storyProtectedLayout])

const now = new Date('2026-08-01T03:00:00.000Z')
const later = new Date('2026-08-10T06:30:00.000Z')

const session = {
  user: {
    id: 'user-1',
    email: 'koralle@example.com',
    name: 'koralle',
    image: null,
    emailVerified: true,
    banned: false,
    createdAt: now,
    updatedAt: now
  },
  session: {
    id: 'session-1',
    userId: 'user-1',
    token: 'story-token',
    expiresAt: new Date('2026-09-01T00:00:00.000Z'),
    createdAt: now,
    updatedAt: now
  }
}

const shelfTags: ShelfTag[] = [
  {
    id: 1,
    name: 'reading',
    pinned: true,
    sortOrder: 0,
    color: '#c45c26',
    lastUsedAt: now,
    bookmarkCount: 12
  },
  {
    id: 2,
    name: 'work',
    pinned: true,
    sortOrder: 1,
    color: '#2f6fed',
    lastUsedAt: later,
    bookmarkCount: 8
  },
  {
    id: 3,
    name: 'typescript',
    pinned: false,
    sortOrder: 0,
    color: null,
    lastUsedAt: now,
    bookmarkCount: 5
  },
  {
    id: 4,
    name: 'cloudflare',
    pinned: false,
    sortOrder: 1,
    color: '#f6821f',
    lastUsedAt: null,
    bookmarkCount: 3
  },
  {
    id: 5,
    name: 'recipe',
    pinned: false,
    sortOrder: 2,
    color: null,
    lastUsedAt: null,
    bookmarkCount: 1
  }
]

function makeBookmark(
  bookmark: Pick<BookmarkListItem, 'id' | 'title' | 'url'> & Partial<BookmarkListItem>
): BookmarkListItem {
  return {
    note: null,
    updatedAt: now.toISOString(),
    tags: [],
    ...bookmark
  }
}

const shortBookmark = makeBookmark({
  id: '019fae92-3bb0-78cd-b488-65ce0e26a001',
  title: '短いタイトル',
  url: 'https://example.com/short'
})

const longBookmark = makeBookmark({
  id: '019fae92-3bb0-78cd-b488-65ce0e26a002',
  title: '2020年版: なぜ仮想 DOM / 宣言的 UI という概念が、あのときの俺達の魂を震えさせたのか',
  url: 'https://zenn.dev/mizchi/books/0c55c230f5cc754c38b9',
  note: '当時の空気感と、今のコンポーネント設計を見比べるためのメモ。カード表示では2行までに収まるはず。',
  updatedAt: later.toISOString(),
  tags: [
    { id: 1, name: 'reading' },
    { id: 2, name: 'work' },
    { id: 3, name: 'typescript' },
    { id: 4, name: 'cloudflare' }
  ]
})

const reactBookmark = makeBookmark({
  id: '019fae92-3bb0-78cd-b488-65ce0e26a003',
  title: 'React 19 の use()',
  url: 'https://react.dev/reference/react/use',
  tags: [{ id: 3, name: 'typescript' }]
})

const noteOnlyBookmark = makeBookmark({
  id: '019fae92-3bb0-78cd-b488-65ce0e26a004',
  title: 'メモ付きの記事',
  url: 'https://example.com/notes',
  note: 'タグなし。本文だけ残している。'
})

const bookmarks = [shortBookmark, longBookmark, reactBookmark, noteOnlyBookmark]
const firstPage = [shortBookmark, longBookmark]
const nextPage = [reactBookmark, noteOnlyBookmark]
const pageLimit = 2

function neverPromise<T>(): Promise<T> {
  // oxlint-disable-next-line promise/avoid-new -- hang the request so loading UI stays visible
  return new Promise(() => undefined)
}

function stubListApis() {
<<<<<<< HEAD
  mocked(fetchBookmarks).mockReset()

  mocked(fetchBookmarks).mockResolvedValue(bookmarks)
=======
  mocked(getSession).mockReset()
  mocked(ensureSession).mockReset()
  mocked(fetchShelfTags).mockReset()
  mocked(touchTagLastUsed).mockReset()

  mocked(getSession).mockResolvedValue(session)
  mocked(ensureSession).mockResolvedValue(session)
  mocked(fetchShelfTags).mockResolvedValue(shelfTags)
  mocked(touchTagLastUsed).mockResolvedValue({ ok: true as const })

  storyQueryClient.clear()
  listFixture = () => bookmarks
>>>>>>> 85739b2 (feat(bookmarks): route list/detail reads and delete dialog through oRPC queries)
}

function stubPagedBookmarks(next: BookmarkListItem[] | Promise<BookmarkListItem[]> | Error) {
  listFixture = (input) => {
    if ((input.offset ?? 0) === 0) {
      return firstPage
    }
    if (next instanceof Error) {
      return Promise.reject(next)
    }
    return next
  }
}

function listQuery(query: Partial<BookmarkSearchSchema>) {
  return {
    tanstack: {
      router: {
        route: storyListRoute,
        path: '/' as const,
        query,
        context: {
          queryClient: storyQueryClient
        }
      }
    }
  }
}

const meta = preview.meta({
  title: 'Pages / ブックマーク一覧画面',
  parameters: {
    layout: 'fullscreen',
    tanstack: {
      router: {
        route: storyListRoute,
        path: '/' as const,
        context: {
          queryClient: storyQueryClient
        }
      }
    }
  },
  beforeEach: async () => {
    writeListLayout('table')
    stubListApis()
  }
})

export const Default = meta.story({
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('table', { name: 'ブックマーク' })).toBeInTheDocument()
    })
    await expect(canvas.getByRole('heading', { name: 'ブックマーク' })).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: shortBookmark.title })).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: longBookmark.title })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'AND' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(canvas.getByRole('button', { name: 'テーブル' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(canvas.getByPlaceholderText('タイトル・URL・メモ')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'さらに読み込む' })).not.toBeInTheDocument()
  }
})

export const Cards = meta.story({
  beforeEach: async () => {
    writeListLayout('card')
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByText(shortBookmark.title)).toBeInTheDocument()
    })
    await expect(canvas.getByText(longBookmark.title)).toBeInTheDocument()
    await expect(canvas.getByText(noteOnlyBookmark.note ?? '')).toBeInTheDocument()
    await expect(canvas.queryByRole('table', { name: 'ブックマーク' })).not.toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'カード' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  }
})

export const Empty = meta.story({
  beforeEach: async () => {
    listFixture = () => []
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByText('まだブックマークがありません')).toBeInTheDocument()
    })
    await expect(canvas.getAllByRole('link', { name: '新規' }).length).toBeGreaterThan(0)
  }
})

export const EmptyBySearch = meta.story({
  parameters: listQuery({ q: '存在しないキーワード' }),
  beforeEach: async () => {
    listFixture = () => []
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(
        canvas.getByRole('heading', { name: '「存在しないキーワード」の検索結果' })
      ).toBeInTheDocument()
    })
    await expect(canvas.getByText('条件に合うブックマークがありません')).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: '条件をクリア' })).toBeInTheDocument()
    await expect(canvas.getByPlaceholderText('タイトル・URL・メモ')).toHaveValue(
      '存在しないキーワード'
    )
  }
})

export const EmptyByTags = meta.story({
  parameters: listQuery({ tags: ['reading'] }),
  beforeEach: async () => {
    listFixture = () => []
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'reading' })).toBeInTheDocument()
    })
    await expect(canvas.getByRole('button', { name: 'readingを外す' })).toBeInTheDocument()
    await expect(canvas.getByText('条件に合うブックマークがありません')).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: '条件をクリア' })).toBeInTheDocument()
  }
})

export const SearchResults = meta.story({
  parameters: listQuery({ q: 'React' }),
  beforeEach: async () => {
    listFixture = () => [reactBookmark]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: '「React」の検索結果' })).toBeInTheDocument()
    })
    await expect(canvas.getByRole('link', { name: reactBookmark.title })).toBeInTheDocument()
    await expect(canvas.queryByRole('link', { name: shortBookmark.title })).not.toBeInTheDocument()
  }
})

export const TagFilterAnd = meta.story({
  parameters: listQuery({ tags: ['reading', 'work'], tagMode: 'and' }),
  beforeEach: async () => {
    listFixture = () => [longBookmark]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'reading / work' })).toBeInTheDocument()
    })
    await expect(canvas.getByRole('button', { name: 'AND' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(canvas.getByRole('button', { name: 'readingを外す' })).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'workを外す' })).toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: longBookmark.title })).toBeInTheDocument()
  }
})

export const TagFilterOr = meta.story({
  parameters: listQuery({ tags: ['reading'], tagMode: 'or' }),
  beforeEach: async () => {
    listFixture = () => [longBookmark]
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'OR' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    })
    await expect(canvas.getByRole('button', { name: 'AND' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    await expect(canvas.getByRole('button', { name: 'readingを外す' })).toBeInTheDocument()
  }
})

export const SortUpdated = meta.story({
  parameters: listQuery({ sort: 'updated' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('table', { name: 'ブックマーク' })).toBeInTheDocument()
    })
    await expect(canvas.getByRole('button', { name: /更新順/ })).toBeInTheDocument()
  }
})

export const InitialLoading = meta.story({
  beforeEach: async () => {
    listFixture = () => neverPromise()
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'ブックマーク' })).toBeInTheDocument()
    })
    await expect(canvas.getAllByText('一覧を読み込み中')).toHaveLength(1)
    await expect(canvas.queryByRole('table', { name: 'ブックマーク' })).not.toBeInTheDocument()
    const skeletonTable = canvasElement.querySelector('[aria-busy="true"] table')
    await expect(skeletonTable).not.toBeNull()
    await expect(skeletonTable).toHaveAttribute('aria-hidden', 'true')
    await expect(skeletonTable?.querySelectorAll('tbody tr')).toHaveLength(5)
    await expect(canvas.getByRole('button', { name: 'テーブル' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  }
})

export const InitialLoadingCards = meta.story({
  beforeEach: async () => {
    writeListLayout('card')
    listFixture = () => neverPromise()
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: 'ブックマーク' })).toBeInTheDocument()
    })
    await expect(canvas.getAllByText('一覧を読み込み中')).toHaveLength(1)
    await expect(canvas.queryByRole('table', { name: 'ブックマーク' })).not.toBeInTheDocument()
    const skeletonList = canvasElement.querySelector('[aria-busy="true"] ul')
    await expect(skeletonList).not.toBeNull()
    await expect(skeletonList).toHaveAttribute('aria-hidden', 'true')
    await expect(skeletonList?.querySelectorAll('li')).toHaveLength(4)
    await expect(canvas.getByRole('button', { name: 'カード' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  }
})

export const LoadError = meta.story({
  beforeEach: async () => {
    listFixture = () => Promise.reject(new Error('一覧の読み込みに失敗しました'))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('alert')).toHaveTextContent('一覧の読み込みに失敗しました')
    })
    await expect(canvas.getByRole('button', { name: '再試行' })).toBeInTheDocument()
    await expect(canvas.getByRole('heading', { name: 'ブックマーク' })).toBeInTheDocument()
  }
})

export const HasMore = meta.story({
  parameters: listQuery({ limit: pageLimit }),
  beforeEach: async () => {
    stubPagedBookmarks(nextPage)
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('link', { name: shortBookmark.title })).toBeInTheDocument()
    })
    await expect(canvas.getByRole('button', { name: 'さらに読み込む' })).toBeEnabled()
    await expect(canvas.queryByRole('link', { name: reactBookmark.title })).not.toBeInTheDocument()
  }
})

export const LoadingMore = meta.story({
  parameters: listQuery({ limit: pageLimit }),
  beforeEach: async () => {
    stubPagedBookmarks(neverPromise())
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'さらに読み込む' })).toBeEnabled()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'さらに読み込む' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: '読み込み中…' })).toBeDisabled()
    })
  }
})

export const LoadMoreError = meta.story({
  parameters: listQuery({ limit: pageLimit }),
  beforeEach: async () => {
    stubPagedBookmarks(new Error('続きの読み込みに失敗しました'))
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'さらに読み込む' })).toBeEnabled()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'さらに読み込む' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('alert')).toHaveTextContent('続きの読み込みに失敗しました')
    })
    await expect(canvas.getByRole('button', { name: '再試行' })).toBeInTheDocument()
  }
})

export const NoShelfTags = meta.story({
  beforeEach: async () => {
    storyProtectedLayout.options.loader = async () => ({
      shelfTagsPromise: Promise.resolve([])
    })
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(async () => {
      await expect(canvas.getByRole('table', { name: 'ブックマーク' })).toBeInTheDocument()
    })
    await expect(canvas.queryByText('タグを追加')).not.toBeInTheDocument()
    await expect(canvas.getByRole('link', { name: shortBookmark.title })).toBeInTheDocument()
  }
})
