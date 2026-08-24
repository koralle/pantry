import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import * as v from 'valibot'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import type { UserId, SessionUser } from '../features/auth/domain/auth-values'
import type { UpdateBookmark } from '../features/bookmarks/application/update-bookmark'
import { bookmarkIdSchema } from '../features/bookmarks/domain/bookmark-values'
import type { AppRouter } from './create-app-router'
import { createAppRouter } from './create-app-router'
import { handleRpcRequest } from './handle-request.server'

const userId = 'user-1'
const bookmarkId = v.parse(bookmarkIdSchema, '019fae92-3bb0-78cd-b488-65ce0e26a939')

function validUpdateInput() {
  return {
    id: bookmarkId,
    url: 'https://example.com/updated',
    title: 'Updated Title',
    note: null,
    tags: [1]
  }
}

function updatedPortOutput() {
  return { kind: 'updated', id: bookmarkId } as const
}

type GetSessionFn = (headers: Headers) => Promise<SessionUser | null>
type FindBookmarkEditorFn = (
  userId: UserId,
  id: string
) => Promise<{
  id: string
  url: string
  title: string
  note: string | null
  tagIds: number[]
} | null>

function authenticatedRouter(overrides?: {
  updateBookmark?: UpdateBookmark
  findBookmarkEditor?: FindBookmarkEditorFn
  getSession?: GetSessionFn
}) {
  const getSession =
    overrides?.getSession ??
    (async (): Promise<SessionUser | null> => ({
      id: userId,
      name: 'koralle',
      email: `${userId}@example.com`
    }))
  const updateBookmark =
    overrides?.updateBookmark ?? ((async () => updatedPortOutput()) satisfies UpdateBookmark)
  const findBookmarkEditor: FindBookmarkEditorFn =
    overrides?.findBookmarkEditor ??
    (async () => ({
      id: bookmarkId,
      url: 'https://example.com/article',
      title: 'Article',
      note: null,
      tagIds: [1]
    }))
  return createAppRouter({
    getSession,
    insertTag: async () => ({ kind: 'created', id: 1 as never }),
    updateTag: async () => ({ kind: 'not-found' }),
    touchTag: async () => ({ kind: 'touched' }),
    listShelfTags: async () => [],
    listTags: async () => [],
    findTagById: async () => null,
    insertBookmark: async () => ({ kind: 'duplicate-url' }),
    fetchPageTitle: async () => ({ kind: 'unavailable' }),
    updateBookmark,
    findBookmarkEditor,
    listBookmarks: async () => [],
    getBookmarkDetail: async (): Promise<null> => null,
    softDeleteBookmark: async () => ({ kind: 'bookmark-not-found', id: '' }) as const
  })
}

/**
 * 本物の RPCLink を、process 内の handleRpcRequest へ繋ぐ。
 * HTTP サーバーや Turso を立てず、クライアント契約とステータスだけを見るため。
 */
function createTestClient(router: AppRouter, headers?: HeadersInit) {
  let lastResponse: Response | undefined = undefined
  const link = new RPCLink({
    url: 'https://pantry.test/api/rpc',
    headers: () => new Headers(headers),
    fetch: async (request) => {
      const response = await handleRpcRequest(request, router)
      lastResponse = response
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

describe('UpdateBookmark RPC', () => {
  test('update の戻り値 id は BookmarkId ではなく string である', () => {
    type UpdateOutput = Awaited<ReturnType<RouterClient<AppRouter>['bookmarks']['update']>>

    expectTypeOf<UpdateOutput['id']>().toEqualTypeOf<string>()
    expectTypeOf<UpdateOutput['id']>().not.toEqualTypeOf<typeof bookmarkId>()
  })

  test('不正な入力は 400 BAD_REQUEST を返し、port を呼ばない', async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () => updatedPortOutput())
    const router = authenticatedRouter({ updateBookmark })
    const { client, getResponse } = createTestClient(router)

    const rejected = await client.bookmarks.update({ ...validUpdateInput(), title: '' }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(400)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('BAD_REQUEST')
    expect(updateBookmark).not.toHaveBeenCalled()
  })

  test('未認証の update は 401 UNAUTHORIZED を返す', async () => {
    const router = authenticatedRouter({
      getSession: vi.fn(async () => null)
    })
    const { client, getResponse } = createTestClient(router)

    const rejected = await client.bookmarks.update(validUpdateInput()).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(401)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('UNAUTHORIZED')
  })

  test('Cookie ヘッダーが認証 middleware に届く', async () => {
    const getSession = vi.fn(async (headers: Headers) => {
      expect(headers.get('cookie')).toBe('better-auth.session_token=abc')
      return {
        id: userId,
        name: 'koralle',
        email: `${userId}@example.com`
      }
    })
    const router = authenticatedRouter({ getSession })
    const { client } = createTestClient(router, { cookie: 'better-auth.session_token=abc' })

    await client.bookmarks.update(validUpdateInput())

    expect(getSession).toHaveBeenCalledOnce()
  })

  test('URL 重複は 409 duplicate-url を返す', async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () => ({ kind: 'duplicate-url' }))
    const router = authenticatedRouter({ updateBookmark })
    const { client, getResponse } = createTestClient(router)

    const rejected = await client.bookmarks.update(validUpdateInput()).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(409)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('duplicate-url')
  })

  test('tag 集合の不備は 409 invalid-tag を返す', async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () => ({ kind: 'invalid-tag' }))
    const router = authenticatedRouter({ updateBookmark })
    const { client, getResponse } = createTestClient(router)

    const rejected = await client.bookmarks.update(validUpdateInput()).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(409)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('invalid-tag')
  })

  test('対象なしは 404 bookmark-not-found を返す', async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () => ({ kind: 'bookmark-not-found' }))
    const router = authenticatedRouter({ updateBookmark })
    const { client, getResponse } = createTestClient(router)

    const rejected = await client.bookmarks.update(validUpdateInput()).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(404)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('bookmark-not-found')
  })

  test('想定外の例外は内部 message を漏らさず 500 を返す', async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () => {
      throw new Error('disk exploded')
    })
    const router = authenticatedRouter({ updateBookmark })
    const { client, getResponse } = createTestClient(router)

    await expect(client.bookmarks.update(validUpdateInput())).rejects.toBeInstanceOf(Error)

    expect(getResponse().status).toBe(500)
    expect(await getResponse().text()).not.toContain('disk exploded')
  })

  test('成功時は plain string の id を返す', async () => {
    const router = authenticatedRouter()
    const { client } = createTestClient(router)

    await expect(client.bookmarks.update(validUpdateInput())).resolves.toStrictEqual({
      id: bookmarkId
    })
  })

  test('Application へ actor 付き command が渡る', async () => {
    const updateBookmark = vi.fn<UpdateBookmark>(async () => updatedPortOutput())
    const router = authenticatedRouter({ updateBookmark })
    const { client } = createTestClient(router)

    await client.bookmarks.update(validUpdateInput())

    expect(updateBookmark).toHaveBeenCalledWith({
      userId: userId as UserId,
      bookmarkId,
      url: 'https://example.com/updated',
      title: 'Updated Title',
      note: null,
      tagIds: [1]
    })
  })
})

describe('BookmarkEditor read RPC', () => {
  test('editor の出力 id は string、tagIds は number 配列である', () => {
    type EditorOutput = Awaited<ReturnType<RouterClient<AppRouter>['bookmarks']['editor']>>

    expectTypeOf<EditorOutput['id']>().toEqualTypeOf<string>()
    expectTypeOf<EditorOutput['tagIds']>().toEqualTypeOf<number[]>()
  })

  test('編集データを返し、Cookie ヘッダーが認証に使われる', async () => {
    const getSession = vi.fn(async (headers: Headers) => {
      expect(headers.get('cookie')).toBe('better-auth.session_token=abc')
      return {
        id: userId,
        name: 'koralle',
        email: `${userId}@example.com`
      }
    })
    const router = authenticatedRouter({ getSession })
    const { client } = createTestClient(router, { cookie: 'better-auth.session_token=abc' })

    await expect(client.bookmarks.editor({ id: bookmarkId })).resolves.toStrictEqual({
      id: bookmarkId,
      url: 'https://example.com/article',
      title: 'Article',
      note: null,
      tagIds: [1]
    })
    expect(getSession).toHaveBeenCalledOnce()
  })

  test('対象なしの editor は 404 bookmark-not-found を返す', async () => {
    const router = authenticatedRouter({
      findBookmarkEditor: vi.fn(async () => null)
    })
    const { client, getResponse } = createTestClient(router)

    const rejected = await client.bookmarks.editor({ id: bookmarkId }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(404)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('bookmark-not-found')
  })

  test('未認証の editor は 401 UNAUTHORIZED を返す', async () => {
    const router = authenticatedRouter({
      getSession: vi.fn(async () => null)
    })
    const { client, getResponse } = createTestClient(router)

    const rejected = await client.bookmarks.editor({ id: bookmarkId }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(401)
    expect((rejected as ORPCError<string, unknown>).code).toBe('UNAUTHORIZED')
  })
})
