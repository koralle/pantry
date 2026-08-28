import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import type { InsertTag } from '../features/tags/application/create-tag'
import type { UpdateTag } from '../features/tags/application/update-tag'
import type { TagId } from '../features/tags/domain/tag-values'
import { createAppRouter } from './create-app-router'
import type { AppRouter } from './create-app-router'
import { handleRpcRequest } from './handle-request.server'

const userId = 'user-1'
const input = { id: 7, name: 'Work', pinned: false, sortOrder: 0, color: null }
const insertTag: InsertTag = async () => ({ kind: 'name-conflict' })

const readDeps = {
  touchTag: async () => ({ kind: 'touched' }) as const,
  insertBookmark: async () => ({ kind: 'duplicate-url' }) as const,
  fetchPageTitle: async () => ({ kind: 'unavailable' }) as const,
  listShelfTags: async () => [],
  listTags: async () => [],
  findTagById: async () => null,
  updateBookmark: async () => ({ kind: 'bookmark-not-found' }) as const,
  findBookmarkEditor: async (): Promise<null> => null,
  listBookmarks: async () => ({ items: [], nextCursor: null }),
  getBookmarkDetail: async (): Promise<null> => null,
  softDeleteBookmark: async () => ({ kind: 'bookmark-not-found', id: '' }) as const
}

function authenticatedRouter(updateTag: UpdateTag, getSession = vi.fn()) {
  getSession.mockResolvedValue({
    id: userId,
    name: 'koralle',
    email: `${userId}@example.com`
  })
  return createAppRouter({
    getSession,
    insertTag,
    updateTag,
    ...readDeps
  })
}

function createTestClient(router: AppRouter, headers?: HeadersInit) {
  let lastResponse: Response | undefined = undefined
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

describe('UpdateTag RPC', () => {
  test('update の戻り値 id は TagId ではなく number である', () => {
    type UpdateOutput = Awaited<ReturnType<RouterClient<AppRouter>['tags']['update']>>

    expectTypeOf<UpdateOutput['id']>().toEqualTypeOf<number>()
    expectTypeOf<UpdateOutput['id']>().not.toEqualTypeOf<TagId>()
  })

  test('空の name は persistence を呼ばず 400 BAD_REQUEST を返す', async () => {
    const updateTag = vi.fn<UpdateTag>(async () => ({ kind: 'not-found' }))
    const router = authenticatedRouter(updateTag)
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.tags.update({ ...input, name: '' }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(400)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect(updateTag).not.toHaveBeenCalled()
    expect((rejected as ORPCError<string, unknown>).code).toBe('BAD_REQUEST')
  })

  test('未認証のリクエストは 401 UNAUTHORIZED を返す', async () => {
    const router = createAppRouter({
      getSession: async () => null,
      insertTag,
      updateTag: async () => ({ kind: 'not-found' }),
      ...readDeps
    })
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.tags.update(input).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(401)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('UNAUTHORIZED')
  })

  test('Cookie ヘッダーが認証 middleware に一度だけ届く', async () => {
    const getSession = vi.fn(async (headers: Headers) => {
      expect(headers.get('cookie')).toBe('better-auth.session_token=abc')
      return {
        id: userId,
        name: 'koralle',
        email: `${userId}@example.com`
      }
    })
    const router = createAppRouter({
      getSession,
      insertTag,
      updateTag: async () => ({ kind: 'updated', id: 7 as never }),
      ...readDeps
    })
    const { client } = createTestClient(router, { cookie: 'better-auth.session_token=abc' })

    await client.tags.update(input)

    expect(getSession).toHaveBeenCalledOnce()
  })

  test('同名は 409 tag-name-already-exists を返す', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'name-conflict' }))
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.tags.update(input).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(409)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('tag-name-already-exists')
  })

  test('存在しないタグは 404 tag-not-found を返す', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'not-found' }))
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.tags.update(input).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(404)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('tag-not-found')
  })

  test('想定外の例外は 500 を返し秘密のメッセージを漏らさない', async () => {
    const secret = 'do-not-leak-update-secret'
    const router = authenticatedRouter(async () => {
      throw new Error(secret)
    })
    const { client, getResponse } = createTestClient(router)

    await expect(client.tags.update(input)).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBe(500)
    await expect(getResponse().text()).resolves.not.toContain(secret)
  })

  test('成功時は plain な id を返す', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'updated', id: 7 as never }))
    const { client } = createTestClient(router)

    await expect(client.tags.update(input)).resolves.toEqual({ id: 7 })
  })
})
