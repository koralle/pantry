import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { describe, expect, test, vi } from 'vitest'

import type { InsertTag } from '../features/tags/application/create-tag'
import { createAppRouter } from './create-app-router'
import type { AppRouter } from './create-app-router'
import { handleRpcRequest } from './handle-request.server'

const userId = 'user-1'

function authenticatedRouter(insertTag: InsertTag, getSession = vi.fn()) {
  getSession.mockResolvedValue({ user: { id: userId } })
  return createAppRouter({
    getSession,
    insertTag
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
      lastResponse = await handleRpcRequest(request, router)
      return lastResponse
    }
  }),
   client: RouterClient<AppRouter> = createORPCClient(link)
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
  test('invalid input returns 4xx', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'name-conflict' })),
     { client, getResponse } = createTestClient(router)

    await expect(client.tags.create({ name: '' })).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBeGreaterThanOrEqual(400)
    expect(getResponse().status).toBeLessThan(500)
  })

  test('unauthenticated request returns 401 UNAUTHORIZED', async () => {
    const router = createAppRouter({
      getSession: async () => null,
      insertTag: async () => ({ kind: 'name-conflict' })
    }),
     { client, getResponse } = createTestClient(router),

     error = await client.tags.create({ name: 'Work' }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(401)
    expect(error).toBeInstanceOf(ORPCError)
    expect((error as ORPCError<string, unknown>).code).toBe('UNAUTHORIZED')
  })

  test('Cookie headers reach the auth middleware', async () => {
    const getSession = vi.fn(async (headers: Headers) => {
      expect(headers.get('cookie')).toBe('better-auth.session_token=abc')
      return { user: { id: userId } }
    }),
     router = createAppRouter({
      getSession,
      insertTag: async () => ({ kind: 'created', id: 1 as never })
    }),
     { client } = createTestClient(router, { cookie: 'better-auth.session_token=abc' })

    await client.tags.create({ name: 'Work' })

    expect(getSession).toHaveBeenCalledOnce()
  })

  test('duplicate name returns 409 tag-name-already-exists', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'name-conflict' })),
     { client, getResponse } = createTestClient(router),

     error = await client.tags.create({ name: 'Work' }).then(
      () => null,
      (error: unknown) => error
    )

    expect(getResponse().status).toBe(409)
    expect(error).toBeInstanceOf(ORPCError)
    expect((error as ORPCError<string, unknown>).code).toBe('tag-name-already-exists')
  })

  test('unknown exception returns 500', async () => {
    const router = authenticatedRouter(async () => {
      throw new Error('disk exploded')
    }),
     { client, getResponse } = createTestClient(router)

    await expect(client.tags.create({ name: 'Work' })).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBe(500)
  })

  test('handleRpcRequest returns the handler.handle() Response', async () => {
    const router = authenticatedRouter(async () => ({ kind: 'created', id: 7 as never })),
     { client, getResponse } = createTestClient(router)

    await expect(client.tags.create({ name: 'Work' })).resolves.toEqual({ id: 7 })
    expect(getResponse()).toBeInstanceOf(Response)
    expect(getResponse().status).toBe(200)
  })
})
