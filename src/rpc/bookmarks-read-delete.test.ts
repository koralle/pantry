import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import type { SoftDeleteBookmark } from '../features/bookmarks/application/delete-bookmark'
import type { BookmarkId } from '../features/bookmarks/domain/bookmark-values'
import type { BookmarkDetail } from '../features/bookmarks/persistence/get-bookmark-detail'
import type { BookmarkListItem } from '../features/bookmarks/persistence/list-bookmarks'
import type { TagId } from '../features/tags/domain/tag-values'
import { createAppRouter } from './create-app-router'
import type { AppRouter } from './create-app-router'
import { handleRpcRequest } from './handle-request.server'

const userId = 'user-1'

type RouterDeps = Parameters<typeof createAppRouter>[0]

type MutableDeps = { -readonly [K in keyof RouterDeps]: RouterDeps[K] }

function baseDeps(): MutableDeps {
  return {
    getSession: vi.fn(async () => ({ user: { id: userId } })),
    insertTag: vi.fn(async (): Promise<{ kind: 'created'; id: TagId }> => ({
      kind: 'created',
      id: 1 as TagId
    })),
    listBookmarks: vi.fn(async (): Promise<BookmarkListItem[]> => []),
    getBookmarkDetail: vi.fn(async (): Promise<BookmarkDetail | null> => null),
    softDeleteBookmark: vi.fn(async (): Promise<{ kind: 'bookmark-not-found' }> => ({
      kind: 'bookmark-not-found'
    }))
  }
}

/**
 * 本物の RPCLink を、process 内の handleRpcRequest へ繋ぐ。
 * HTTP サーバーや Turso を立てず、クライアント契約とステータスだけを見るため。
 */
function createTestClient(router: AppRouter, headers?: HeadersInit) {
  let lastResponse: Response | undefined
  const link = new RPCLink({
    url: 'https://pantry.test/api/rpc',
    headers: () => new Headers(headers),
    fetch: async (request) => {
      const response = await handleRpcRequest(request, router)
      lastResponse = response
      // Link 側が body を消費するため、検査用に clone を渡す
      return response.clone()
    }
  })
  const client: RouterClient<AppRouter> = createORPCClient(link)
  return {
    client,
    getResponse: () => {
      if (lastResponse === undefined) {
        throw new Error('RPC client did not perform a request')
      }
      return lastResponse
    }
  }
}

async function rejection(promise: Promise<unknown>): Promise<ORPCError<string, unknown>> {
  const error = await promise.then(
    () => null,
    (error: unknown) => error
  )
  expect(error).toBeInstanceOf(ORPCError)
  return error as ORPCError<string, unknown>
}

describe('bookmarks RPC 契約', () => {
  test('wire 出力に Domain の型を残さない', () => {
    type ListOutput = Awaited<ReturnType<RouterClient<AppRouter>['bookmarks']['list']>>
    type DetailOutput = Awaited<ReturnType<RouterClient<AppRouter>['bookmarks']['detail']>>
    type DeleteOutput = Awaited<ReturnType<RouterClient<AppRouter>['bookmarks']['delete']>>

    expectTypeOf<ListOutput[number]['updatedAt']>().toEqualTypeOf<string>()
    expectTypeOf<ListOutput[number]['tags'][number]['id']>().toEqualTypeOf<number>()
    expectTypeOf<DetailOutput['tagNames']>().toEqualTypeOf<string[]>()
    expectTypeOf<DeleteOutput['id']>().toEqualTypeOf<string>()
    expectTypeOf<DeleteOutput['id']>().not.toEqualTypeOf<BookmarkId>()
  })

  test('未認証のリクエストは 401 UNAUTHORIZED を返す', async () => {
    for (const call of [
      (client: RouterClient<AppRouter>) =>
        client.bookmarks.list({ tagMode: 'and', sort: 'newest', limit: 50, offset: 0 }),
      (client: RouterClient<AppRouter>) => client.bookmarks.detail({ id: 'b-1' }),
      (client: RouterClient<AppRouter>) => client.bookmarks.delete({ id: 'b-1' })
    ]) {
      const deps = baseDeps()
      deps.getSession = vi.fn(async () => null)
      const { client, getResponse } = createTestClient(createAppRouter(deps))

      const error = await rejection(call(client))

      expect(error.code).toBe('UNAUTHORIZED')
      expect(getResponse().status).toBe(401)
    }
  })

  test('Cookie ヘッダーが認証 middleware に届く', async () => {
    const getSession = vi.fn(async (headers: Headers) => {
      expect(headers.get('cookie')).toBe('better-auth.session_token=abc')
      return { user: { id: userId } }
    })
    const deps = baseDeps()
    deps.getSession = getSession
    const { client } = createTestClient(createAppRouter(deps), {
      cookie: 'better-auth.session_token=abc'
    })

    await client.bookmarks.list({ tagMode: 'and', sort: 'newest', limit: 50, offset: 0 })

    expect(getSession).toHaveBeenCalledOnce()
  })
})

describe('bookmarks.list', () => {
  test('一覧 projection を返す', async () => {
    const items: BookmarkListItem[] = [
      {
        id: 'b-1',
        url: 'https://example.com/b-1',
        title: '最初',
        note: null,
        updatedAt: '2026-08-01T00:00:00.000Z',
        tags: [{ id: 3, name: 'typescript' }]
      }
    ]
    const deps = baseDeps()
    deps.listBookmarks = vi.fn(async () => items)
    const { client } = createTestClient(createAppRouter(deps))

    const result = await client.bookmarks.list({
      tagMode: 'and',
      sort: 'newest',
      limit: 50,
      offset: 0,
      q: 'React'
    })

    expect(result).toEqual(items)
    expect(deps.listBookmarks).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.any(String),
        tagMode: 'and',
        sort: 'newest',
        limit: 50,
        offset: 0,
        q: 'React'
      })
    )
  })

  test('不正な入力は 4xx を返す', async () => {
    const deps = baseDeps()
    const { client, getResponse } = createTestClient(createAppRouter(deps))

    await expect(
      // @ts-expect-error 不正な sort 値
      client.bookmarks.list({ tagMode: 'and', sort: 'bogus', limit: 50, offset: 0 })
    ).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBeGreaterThanOrEqual(400)
    expect(getResponse().status).toBeLessThan(500)
  })

  test('DB 障害は内部メッセージを漏らさず 500 を返す', async () => {
    const deps = baseDeps()
    deps.listBookmarks = vi.fn(async () => {
      throw new Error('disk exploded')
    })
    const { client, getResponse } = createTestClient(createAppRouter(deps))

    await expect(
      client.bookmarks.list({ tagMode: 'and', sort: 'newest', limit: 50, offset: 0 })
    ).rejects.toBeInstanceOf(Error)

    expect(getResponse().status).toBe(500)
    expect(await getResponse().text()).not.toContain('disk exploded')
  })
})

describe('bookmarks.detail', () => {
  const detailInput = { id: '019fae92-3bb0-78cd-b488-65ce0e26a001' }

  test('詳細 projection を返す', async () => {
    const detail: BookmarkDetail = {
      id: detailInput.id,
      url: 'https://example.com/b-1',
      title: '詳細',
      note: null,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-02T00:00:00.000Z',
      tagNames: ['reading']
    }
    const deps = baseDeps()
    deps.getBookmarkDetail = vi.fn(async () => detail)
    const { client } = createTestClient(createAppRouter(deps))

    const result = await client.bookmarks.detail(detailInput)

    expect(result).toEqual(detail)
    expect(deps.getBookmarkDetail).toHaveBeenCalledWith(expect.any(String), {
      id: detailInput.id
    })
  })

  test('対象なしは 404 bookmark-not-found を返す', async () => {
    const deps = baseDeps()
    const { client, getResponse } = createTestClient(createAppRouter(deps))

    const error = await rejection(client.bookmarks.detail(detailInput))

    expect(error.code).toBe('bookmark-not-found')
    expect(getResponse().status).toBe(404)
  })
})

describe('bookmarks.delete', () => {
  const deleteTarget = { id: '019fae92-3bb0-78cd-b488-65ce0e26a001' }

  test('削除成功は plain string の id を返す', async () => {
    const softDeleteBookmark: SoftDeleteBookmark = vi.fn(async () => ({
      kind: 'deleted' as const,
      id: deleteTarget.id
    }))
    const deps = baseDeps()
    const { client, getResponse } = createTestClient(
      createAppRouter({ ...deps, softDeleteBookmark })
    )

    const result = await client.bookmarks.delete(deleteTarget)

    expect(result).toEqual({ id: deleteTarget.id })
    expect(softDeleteBookmark).toHaveBeenCalledWith({
      userId: expect.any(String),
      id: deleteTarget.id
    })
    expect(getResponse().status).toBe(200)
  })

  test('対象なしは 404 bookmark-not-found を返す', async () => {
    const deps = baseDeps()
    const { client, getResponse } = createTestClient(createAppRouter(deps))

    const error = await rejection(client.bookmarks.delete(deleteTarget))

    expect(error.code).toBe('bookmark-not-found')
    expect(getResponse().status).toBe(404)
  })

  test('不正な入力は 400 BAD_REQUEST で port を呼ばない', async () => {
    const softDeleteBookmark: SoftDeleteBookmark = vi.fn(async () => ({
      kind: 'deleted' as const,
      id: 'x'
    }))
    const deps = baseDeps()
    const { client, getResponse } = createTestClient(
      createAppRouter({ ...deps, softDeleteBookmark })
    )

    const error = await rejection(
      // @ts-expect-error 不正な入力
      client.bookmarks.delete({ id: 42 })
    )

    expect(error.code).toBe('BAD_REQUEST')
    expect(getResponse().status).toBe(400)
    expect(softDeleteBookmark).not.toHaveBeenCalled()
  })

  test('未知の障害は内部メッセージを漏らさず 500 を返す', async () => {
    const softDeleteBookmark: SoftDeleteBookmark = vi.fn(async () => {
      throw new Error('disk exploded')
    })
    const deps = baseDeps()
    const { client, getResponse } = createTestClient(
      createAppRouter({ ...deps, softDeleteBookmark })
    )

    await expect(client.bookmarks.delete(deleteTarget)).rejects.toBeInstanceOf(Error)

    expect(getResponse().status).toBe(500)
    expect(await getResponse().text()).not.toContain('disk exploded')
  })
})
