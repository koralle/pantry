import { mocked } from 'storybook/test'

import { getBookmark } from '../../../../features/bookmarks/functions/get-bookmark'
import { fetchTags } from '../../../../features/tags/functions/fetch-tags'
import preview from '../../../../storybook/preview'
import { Route } from './edit'

const meta = preview.meta({
  title: 'Pages / ブックマーク編集画面',
  parameters: {
    layout: 'fullscreen',
    tanstack: {
      router: {
        route: Route,
        params: {
          id: '019fae92-3bb0-78cd-b488-65ce0e26a939'
        },
        routeOverrides: {
          '/_protected': {}
        }
      }
    }
  },
  beforeEach: async () => {
    mocked(getBookmark).mockResolvedValue({
      id: '019fae92-3bb0-78cd-b488-65ce0e26a939',
      userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
      url: 'https://zenn.dev/mizchi/books/0c55c230f5cc754c38b9',
      title: '2020年版: なぜ仮想 DOM / 宣言的 UI という概念が、あのときの俺達の魂を震えさせたのか',
      note: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      tagIds: []
    })

    mocked(fetchTags).mockResolvedValue([
      {
        id: 1,
        userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
        name: 'react',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        pinned: false,
        sortOrder: 0,
        color: null,
        version: 0
      },
      {
        id: 2,
        userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
        name: 'typescript',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        pinned: false,
        sortOrder: 0,
        color: null,
        version: 0
      },
      {
        id: 3,
        userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
        name: 'uiux',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        pinned: false,
        sortOrder: 0,
        color: null,
        version: 0
      },
      {
        id: 4,
        userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
        name: 'フロントエンド',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        pinned: false,
        sortOrder: 0,
        color: null,
        version: 0
      },
      {
        id: 5,
        userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
        name: 'rust',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        pinned: false,
        sortOrder: 0,
        color: null,
        version: 0
      },
      {
        id: 6,
        userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
        name: 'css',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        pinned: false,
        sortOrder: 0,
        color: null,
        version: 0
      },
      {
        id: 7,
        userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
        name: 'ネットワーク',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        pinned: false,
        sortOrder: 0,
        color: null,
        version: 0
      },
      {
        id: 8,
        userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
        name: 'linux',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        pinned: false,
        sortOrder: 0,
        color: null,
        version: 0
      },
      {
        id: 9,
        userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
        name: 'cloudflare',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        pinned: false,
        sortOrder: 0,
        color: null,
        version: 0
      },
      {
        id: 10,
        userId: '019faea2-5db0-7f76-9a93-ad8d922c2586',
        name: 'ai',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUsedAt: null,
        pinned: false,
        sortOrder: 0,
        color: null,
        version: 0
      }
    ])
  }
})

export const Default = meta.story({})

export const BookmarkIsNotFound = meta.story({
  beforeEach: async () => {
    mocked(fetchTags).mockRejectedValue(new Error('Bookmark not found'))
  }
})

export const TagListIsEmpty = meta.story({
  beforeEach: async () => {
    mocked(fetchTags).mockResolvedValue([])
  }
})
