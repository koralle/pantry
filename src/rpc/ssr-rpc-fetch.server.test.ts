import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getRequestHeaders: vi.fn<() => Headers>()
}))

// SSR の request scope を差し替える。実環境では loader 実行中の元リクエストが来る。
vi.mock('@tanstack/react-start/server', () => ({
  getRequestHeaders: () => mocks.getRequestHeaders()
}))

import type { TagId } from '../features/tags/domain/tag-values'
import { createAppRouter } from './create-app-router'
import type { AppRouter } from './create-app-router'
import { ssrRpcFetch } from './ssr-rpc-fetch.server'

function capturingSessionRouter() {
  const capturedCookies: Array<string | null> = []
  const getSession = vi.fn(async (headers: Headers) => {
    capturedCookies.push(headers.get('cookie'))
    return {
      id: 'user-1',
      name: 'koralle',
      email: 'user-1@example.com'
    }
  })
  const router = createAppRouter({
    getSession,
    insertTag: async () => ({ kind: 'created', id: 1 as TagId }),
    updateTag: async () => ({ kind: 'not-found' }),
    touchTag: async () => ({ kind: 'touched' }),
    listShelfTags: async () => [],
    listTags: async () => [],
    findTagById: async () => null,
    insertBookmark: async () => ({ kind: 'duplicate-url' }),
    fetchPageTitle: async () => ({ kind: 'unavailable' }),
    updateBookmark: async () => ({ kind: 'bookmark-not-found' }),
    findBookmarkEditor: async () => null,
    listBookmarks: async () => ({ items: [], nextCursor: null }),
    getBookmarkDetail: async () => null,
    softDeleteBookmark: async () => ({ kind: 'bookmark-not-found' })
  })

  return { router, capturedCookies }
}

/**
 * RPCLink から ssrRpcFetch へ繋ぎ、SSR 中の Cookie 転送だけを見る。
 * HTTP サーバーは立てず、process 内の handler へ流す。
 */
function clientThroughSsr(router: AppRouter, linkHeaders?: HeadersInit) {
  const link = new RPCLink({
    url: 'https://pantry.test/api/rpc',
    headers: () => new Headers(linkHeaders),
    fetch: async (request) => ssrRpcFetch(request, router)
  })
  const client: RouterClient<AppRouter> = createORPCClient(link)

  return client
}

describe('ssrRpcFetch', () => {
  test('元リクエストの cookie を handler へ転送する', async () => {
    mocks.getRequestHeaders.mockReturnValue(
      new Headers({ cookie: 'better-auth.session_token=ssr-cookie' })
    )
    const { router, capturedCookies } = capturingSessionRouter()
    const client = clientThroughSsr(router)

    const result = await client.bookmarks.list({
      tagMode: 'and',
      sort: 'newest'
    })

    expect(result).toEqual({ items: [], nextCursor: null })
    expect(capturedCookies).toEqual(['better-auth.session_token=ssr-cookie'])
  })

  test('link が明示的に載せた cookie は上書きしない', async () => {
    mocks.getRequestHeaders.mockReturnValue(
      new Headers({ cookie: 'better-auth.session_token=server-cookie' })
    )
    const { router, capturedCookies } = capturingSessionRouter()
    const client = clientThroughSsr(router, { cookie: 'link-cookie=explicit' })

    await client.bookmarks.list({ tagMode: 'and', sort: 'newest' })

    expect(capturedCookies).toEqual(['link-cookie=explicit'])
  })
})
