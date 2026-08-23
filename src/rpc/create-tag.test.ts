import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import type { SessionUser } from '../features/auth/domain/auth-values'
import type { InsertTag } from '../features/tags/application/create-tag'
import type { UpdateTag } from '../features/tags/application/update-tag'
import type { TagId } from '../features/tags/domain/tag-values'
import { createAppRouter } from './create-app-router'
import type { AppRouter } from './create-app-router'
import { handleRpcRequest } from './handle-request.server'

const userId = 'user-1'
const updateTag: UpdateTag = async () => ({ kind: 'not-found' })

const sessionUser: SessionUser = {
  id: userId,
  name: 'koralle',
  email: 'koralle@example.com'
}

function authenticatedRouter(insertTag: InsertTag, getSession = vi.fn()) {
  getSession.mockResolvedValue(sessionUser)
  return createAppRouter({
    getSession,
    insertTag,
    updateTag,
    touchTag: async () => ({ kind: 'touched' }),
    listShelfTags: async () => [],
    listTags: async () => [],
    findTagById: async () => null
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

describe('CreateTag RPC', () => {
  test('create の戻り値 id は TagId ではなく number である', () => {
    type CreateOutput = Awaited<ReturnType<RouterClient<AppRouter>['tags']['create']>>

    expectTypeOf<CreateOutput['id']>().toEqualTypeOf<number>()
    expectTypeOf<CreateOutput['id']>().not.toEqualTypeOf<TagId>()
  })

  test('不正な入力は persistence を呼ばず 400 BAD_REQUEST を返す', async () => {
    const insertTag = vi.fn<InsertTag>(async () => ({ kind: 'name-conflict' }))
    const router = authenticatedRouter(insertTag)
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.tags.create({ name: '' }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(400)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect(insertTag).not.toHaveBeenCalled()
    expect((rejected as ORPCError<string, unknown>).code).toBe('BAD_REQUEST')
  })

  test('未認証のリクエストは 401 UNAUTHORIZED を返す', async () => {
    const router = createAppRouter({
      getSession: async () => null,
      insertTag: async () => ({ kind: 'name-conflict' }),
      updateTag,
      touchTag: async () => ({ kind: 'touched' }),
      listShelfTags: async () => [],
      listTags: async () => [],
      findTagById: async () => null
    })
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.tags.create({ name: 'Work' }).then(
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
      return sessionUser
    })
    const router = createAppRouter({
      getSession,
      insertTag: async () => ({ kind: 'created', id: 1 as never }),
      updateTag,
      touchTag: async () => ({ kind: 'touched' }),
      listShelfTags: async () => [],
      listTags: async () => [],
      findTagById: async () => null
    })
    const { client } = createTestClient(router, { cookie: 'better-auth.session_token=abc' })

    await client.tags.create({ name: 'Work' })

    expect(getSession).toHaveBeenCalledOnce()
  })

  test('同名は 409 tag-name-already-exists を返す', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'name-conflict' }))
    const { client, getResponse } = createTestClient(router)
    const rejected = await client.tags.create({ name: 'Work' }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(409)
    expect(rejected).toBeInstanceOf(ORPCError)
    expect((rejected as ORPCError<string, unknown>).code).toBe('tag-name-already-exists')
  })

  test('想定外の例外は 500 を返す', async () => {
    const router = authenticatedRouter(async () => {
      throw new Error('disk exploded')
    })
    const { client, getResponse } = createTestClient(router)

    await expect(client.tags.create({ name: 'Work' })).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBe(500)
  })

  test('handleRpcRequest は handler.handle() の Response を返す', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'created', id: 7 as never }))
    const { client, getResponse } = createTestClient(router)

    await expect(client.tags.create({ name: 'Work' })).resolves.toEqual({ id: 7 })
    expect(getResponse()).toBeInstanceOf(Response)
    expect(getResponse().status).toBe(200)
  })
})
