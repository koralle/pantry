import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import type { TouchTag } from '../features/tags/application/touch-tag'
import { createAppRouter } from './create-app-router'
import type { AppRouter } from './create-app-router'
import { handleRpcRequest } from './handle-request.server'

const userId = 'user-1'

const readDeps = {
  updateTag: async () => ({ kind: 'not-found' }) as const,
  insertBookmark: async () => ({ kind: 'duplicate-url' }) as const,
  fetchPageTitle: async () => ({ kind: 'unavailable' }) as const,
  listShelfTags: async () => [] as never[],
  listTags: async () => [] as never[],
  findTagById: async () => null,
  updateBookmark: async () => ({ kind: 'bookmark-not-found' }) as const,
  findBookmarkEditor: async (): Promise<null> => null,
  listBookmarks: async () => [],
  getBookmarkDetail: async (): Promise<null> => null,
  softDeleteBookmark: async () => ({ kind: 'bookmark-not-found', id: '' }) as const
}

function authenticatedRouter(touchTag: TouchTag, getSession = vi.fn()) {
  getSession.mockResolvedValue({
    id: userId,
    name: 'koralle',
    email: `${userId}@example.com`
  })
  return createAppRouter({
    getSession,
    insertTag: async () => ({ kind: 'name-conflict' }),
    touchTag,
    ...readDeps
  })
}

/**
 * 本物の RPCLink を、process 内の handleRpcRequest へ繋ぐ。
 * HTTP サーバーや Turso を立てず、クライアント契約とステータスだけを見るため。
 */
function createTestClient(router: AppRouter, headers?: HeadersInit) {
  let lastResponse: Response | undefined
  let lastBodyText = ''
  const link = new RPCLink({
    url: 'https://pantry.test/api/rpc',
    headers: () => new Headers(headers),
    fetch: async (request) => {
      lastResponse = await handleRpcRequest(request, router)
      lastBodyText = await lastResponse.clone().text()
      return lastResponse
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
    },
    getBodyText: () => lastBodyText
  }
}

describe('TouchTag RPC', () => {
  test('touch の wire 出力は brand を載せない plain な { ok: true } である', () => {
    type TouchOutput = Awaited<ReturnType<RouterClient<AppRouter>['tags']['touch']>>

    expectTypeOf<TouchOutput>().toEqualTypeOf<{ readonly ok: true }>()
  })

  test('不正な入力は 400 BAD_REQUEST を返し、port を呼ばない', async () => {
    const touchTag = vi.fn(async () => ({ kind: 'touched' as const }))
    const router = authenticatedRouter(touchTag)
    const { client, getResponse } = createTestClient(router)

    const rejected = await client.tags.touch({ id: 0 }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(400)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('BAD_REQUEST')
    expect(touchTag).not.toHaveBeenCalled()
  })

  test('未認証のリクエストは 401 UNAUTHORIZED を返す', async () => {
    const router = createAppRouter({
      getSession: async () => null,
      insertTag: async () => ({ kind: 'name-conflict' }),
      touchTag: async () => ({ kind: 'touched' }),
      ...readDeps
    })
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.tags.touch({ id: 1 }).then(
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
    const router = authenticatedRouter(async () => ({ kind: 'touched' }), getSession)
    const { client } = createTestClient(router, { cookie: 'better-auth.session_token=abc' })

    await client.tags.touch({ id: 1 })

    expect(getSession).toHaveBeenCalledOnce()
  })

  test('対象なしは defined な 404 tag-not-found を返す', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'not-found' }))
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.tags.touch({ id: 1 }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(404)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('tag-not-found')
    expect((rejected as ORPCError<string, unknown>).defined).toBe(true)
  })

  test('想定外の例外は 500 を返し、内部 message を漏らさない', async () => {
    const router = authenticatedRouter(async () => {
      throw new Error('disk exploded')
    })
    const { client, getResponse, getBodyText } = createTestClient(router)

    await expect(client.tags.touch({ id: 1 })).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBe(500)
    expect(getBodyText()).not.toContain('disk exploded')
  })

  test('成功は 200 で { ok: true } を返す', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'touched' }))
    const { client, getResponse } = createTestClient(router)

    await expect(client.tags.touch({ id: 1 })).resolves.toEqual({ ok: true })
    expect(getResponse().status).toBe(200)
  })
})
