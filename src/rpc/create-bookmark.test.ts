import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import type { InsertBookmark } from '../features/bookmarks/application/create-bookmark'
import type { BookmarkId } from '../features/bookmarks/domain/bookmark-values'
import { createAppRouter } from './create-app-router'
import type { AppRouter } from './create-app-router'
import { handleRpcRequest } from './handle-request.server'

const userId = 'user-1'

const validInput = {
  url: 'https://example.com/article',
  title: 'Example Article',
  note: null,
  tags: []
}

function authenticatedRouter(insertBookmark: InsertBookmark, getSession = vi.fn()) {
  getSession.mockResolvedValue({ user: { id: userId } })
  return createAppRouter({
    getSession,
    insertTag: async () => ({ kind: 'created', id: 1 as never }),
    insertBookmark
  })
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
      lastResponse = response.clone()
      return response
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

describe('CreateBookmark RPC', () => {
  test('create の戻り値 id は BookmarkId ではなく plain string である', () => {
    type CreateOutput = Awaited<ReturnType<RouterClient<AppRouter>['bookmarks']['create']>>

    expectTypeOf<CreateOutput['id']>().toEqualTypeOf<string>()
    expectTypeOf<CreateOutput['id']>().not.toEqualTypeOf<BookmarkId>()
  })

  test('不正な入力は 4xx を返し、port を呼ばない', async () => {
    const insertBookmark = vi.fn(async () => ({ kind: 'duplicate-url' }) as const)
    const router = authenticatedRouter(insertBookmark)
    const { client, getResponse } = createTestClient(router)

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client.bookmarks.create({ ...validInput, url: 'not-a-url' } as any)
    ).rejects.toBeInstanceOf(Error)

    expect(getResponse().status).toBeGreaterThanOrEqual(400)
    expect(getResponse().status).toBeLessThan(500)
    expect(insertBookmark).not.toHaveBeenCalled()
  })

  test('未認証のリクエストは 401 UNAUTHORIZED を返す', async () => {
    const router = createAppRouter({
      getSession: async () => null,
      insertTag: async () => ({ kind: 'created', id: 1 as never }),
      insertBookmark: async () => ({ kind: 'duplicate-url' })
    })
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.bookmarks.create(validInput).then(
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
      return { user: { id: userId } }
    })
    const router = createAppRouter({
      getSession,
      insertTag: async () => ({ kind: 'created', id: 1 as never }),
      insertBookmark: async () => ({
        kind: 'created',
        id: '01900000-0000-7000-8000-000000000000' as never
      })
    })
    const { client } = createTestClient(router, { cookie: 'better-auth.session_token=abc' })

    await client.bookmarks.create(validInput)

    expect(getSession).toHaveBeenCalledOnce()
  })

  test('URL 重複は 409 duplicate-url を返す', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'duplicate-url' }))
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.bookmarks.create(validInput).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(409)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('duplicate-url')
  })

  test('タグ不備は 409 invalid-tag を返す', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'invalid-tag' }))
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.bookmarks.create({ ...validInput, tags: [1] }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(409)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('invalid-tag')
  })

  test('想定外の例外は内部 message を漏らさず 500 を返す', async () => {
    const router = authenticatedRouter(async () => {
      throw new Error('disk exploded with secret detail')
    })
    const { client, getResponse } = createTestClient(router)

    await expect(client.bookmarks.create(validInput)).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBe(500)

    const body = await getResponse().text()
    expect(body).not.toContain('disk exploded with secret detail')
  })

  test('成功は port が返した id を plain string で返す', async () => {
    const id = '01900000-0000-7000-8000-000000000001'
    const router = authenticatedRouter(async (input) => {
      expect(input.userId).toBeDefined()
      return { kind: 'created', id: id as never }
    })
    const { client, getResponse } = createTestClient(router)

    await expect(client.bookmarks.create(validInput)).resolves.toEqual({ id })
    expect(getResponse().status).toBe(200)
  })
})
