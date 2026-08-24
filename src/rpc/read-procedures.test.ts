import { createORPCClient, ORPCError } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import type { SessionUser } from '../features/auth/domain/auth-values'
import type { InsertBookmarkOutput } from '../features/bookmarks/application/create-bookmark'
import type { FetchPageTitleOutput } from '../features/bookmarks/application/fetch-page-title'
import type { InsertTagOutput } from '../features/tags/application/create-tag'
import type { TouchTagOutput } from '../features/tags/application/touch-tag'
import type { UpdateTagOutput } from '../features/tags/application/update-tag'
import type { TagId } from '../features/tags/domain/tag-values'
import type { ShelfTag } from '../features/tags/lib/tag-shelf'
import { createAppRouter } from './create-app-router'
import type { AppRouter } from './create-app-router'
import { handleRpcRequest } from './handle-request.server'

const userId = 'user-1'

const sessionUser: SessionUser = {
  id: userId,
  name: 'koralle',
  email: 'koralle@example.com'
}

type ReadDeps = Parameters<typeof createAppRouter>[0]

function baseDeps(): ReadDeps {
  return {
    getSession: vi.fn(async () => sessionUser),
    insertTag: vi.fn(async (): Promise<InsertTagOutput> => ({ kind: 'created', id: 1 as never })),
    updateTag: vi.fn(async (): Promise<UpdateTagOutput> => ({ kind: 'not-found' })),
    touchTag: vi.fn(async (): Promise<TouchTagOutput> => ({ kind: 'touched' })),
    listShelfTags: vi.fn(async () => [] satisfies ShelfTag[]),
    listTags: vi.fn(async () => []),
    findTagById: vi.fn(async () => null),
    insertBookmark: vi.fn(async (): Promise<InsertBookmarkOutput> => ({ kind: 'duplicate-url' })),
    fetchPageTitle: vi.fn(async (): Promise<FetchPageTitleOutput> => ({ kind: 'unavailable' }))
  }
}

function authenticatedRouter(deps: Partial<ReadDeps> = {}) {
  const merged = { ...baseDeps(), ...deps }
  return createAppRouter(merged)
}

/**
 * 本物の RPCLink を、process 内の handleRpcRequest へ繋ぐ。
 * HTTP サーバーや Turso を立てず、クライアント契約とステータスだけを見るため。
 */
function createTestClient(router: AppRouter, headers?: HeadersInit) {
  let lastResponse: Response | undefined
  let lastBodyText: string | undefined
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
    getBodyText: () => {
      if (lastResponse === undefined) {
        throw new Error('RPC client did not perform a request')
      }
      return Promise.resolve(lastBodyText ?? '')
    }
  }
}

async function rejection(promise: Promise<unknown>): Promise<ORPCError<string, unknown>> {
  const caught = await promise.then(
    () => null,
    (error: unknown) => error
  )
  expect(caught).toBeInstanceOf(Error)
  return caught as ORPCError<string, unknown>
}

describe('auth.session RPC', () => {
  test('未認証は null を返す（401 にしない）', async () => {
    const router = authenticatedRouter({ getSession: async () => null })
    const { client, getResponse } = createTestClient(router)

    await expect(client.auth.session()).resolves.toBeNull()
    expect(getResponse().status).toBe(200)
  })

  test('user の projection は id・name・email のみ', async () => {
    const router = authenticatedRouter()
    const { client } = createTestClient(router)

    await expect(client.auth.session()).resolves.toEqual({
      user: {
        id: userId,
        name: 'koralle',
        email: 'koralle@example.com'
      }
    })
  })

  test('Cookie ヘッダーが public procedure の getSession へ届く', async () => {
    const getSession = vi.fn(async (headers: Headers) => {
      expect(headers.get('cookie')).toBe('better-auth.session_token=abc')
      return sessionUser
    })
    const router = authenticatedRouter({ getSession })
    const { client } = createTestClient(router, { cookie: 'better-auth.session_token=abc' })

    await client.auth.session()

    expect(getSession).toHaveBeenCalledOnce()
  })
})

describe('tags.shelf RPC', () => {
  test('未認証は 401 UNAUTHORIZED を返す', async () => {
    const router = authenticatedRouter({ getSession: async () => null })
    const { client, getResponse } = createTestClient(router)

    const rejected = await rejection(client.tags.shelf())

    expect(getResponse().status).toBe(401)
    expect(rejected.code).toBe('UNAUTHORIZED')
  })

  test('認証済みは query service の棚行を返し、UserId を渡す', async () => {
    const shelfTags: ShelfTag[] = [
      {
        id: 3,
        name: 'typescript',
        pinned: false,
        sortOrder: 0,
        color: null,
        lastUsedAt: null,
        bookmarkCount: 5
      }
    ]
    const listShelfTags = vi.fn(async () => shelfTags)
    const router = authenticatedRouter({ listShelfTags })
    const { client } = createTestClient(router)

    await expect(client.tags.shelf()).resolves.toEqual(shelfTags)
    expect(listShelfTags).toHaveBeenCalledWith(userId)
  })

  test('wire 出力の id は number であり TagId ではない', () => {
    type ShelfOutput = Awaited<ReturnType<RouterClient<AppRouter>['tags']['shelf']>>

    expectTypeOf<ShelfOutput[number]['id']>().toEqualTypeOf<number>()
    expectTypeOf<ShelfOutput[number]['id']>().not.toEqualTypeOf<TagId>()
  })
})

describe('tags.list RPC', () => {
  test('pagination 入力を検証して query service へ渡す', async () => {
    const listTags = vi.fn(async () => [{ id: 1, name: 'work' }])
    const router = authenticatedRouter({ listTags })
    const { client } = createTestClient(router)

    await expect(client.tags.list({ limit: 20, offset: 40 })).resolves.toEqual([
      { id: 1, name: 'work' }
    ])
    expect(listTags).toHaveBeenCalledWith(userId, { limit: 20, offset: 40 })
  })

  test('不正な入力は 4xx を返す', async () => {
    const router = authenticatedRouter()
    const { client, getResponse } = createTestClient(router)

    await expect(client.tags.list({ limit: -1 })).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBeGreaterThanOrEqual(400)
    expect(getResponse().status).toBeLessThan(500)
  })

  test('上限 50 を超える limit は 4xx を返す', async () => {
    const router = authenticatedRouter()
    const { client, getResponse } = createTestClient(router)

    await expect(client.tags.list({ limit: 51 })).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBeGreaterThanOrEqual(400)
    expect(getResponse().status).toBeLessThan(500)
  })
})

describe('tags.byId RPC', () => {
  const record = {
    id: 7,
    name: 'reading',
    pinned: true,
    sortOrder: 2,
    color: '#c45c26'
  }

  test('見つかった場合は画面 projection だけを返す', async () => {
    const findTagById = vi.fn(async () => record)
    const router = authenticatedRouter({ findTagById })
    const { client } = createTestClient(router)

    await expect(client.tags.byId({ id: 7 })).resolves.toEqual(record)
    expect(findTagById).toHaveBeenCalledWith(userId, 7)
  })

  test('対象なしは 404 tag-not-found を返す', async () => {
    const router = authenticatedRouter({ findTagById: async () => null })
    const { client, getResponse } = createTestClient(router)

    const rejected = await rejection(client.tags.byId({ id: 999 }))

    expect(getResponse().status).toBe(404)
    expect(rejected.code).toBe('tag-not-found')
  })

  test('不正な id は 4xx を返す', async () => {
    const router = authenticatedRouter()
    const { client, getResponse } = createTestClient(router)

    await expect(client.tags.byId({ id: 0 })).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBeGreaterThanOrEqual(400)
    expect(getResponse().status).toBeLessThan(500)
  })

  test('未知障害は 500 で内部 message を漏らさない', async () => {
    const router = authenticatedRouter({
      findTagById: async () => {
        throw new Error('disk exploded')
      }
    })
    const { client, getResponse, getBodyText } = createTestClient(router)

    await expect(client.tags.byId({ id: 7 })).rejects.toBeInstanceOf(Error)
    expect(getResponse().status).toBe(500)

    const body = await getBodyText()
    expect(body).not.toContain('disk exploded')
  })

  test('wire 出力は projection 型であり brand や DB 行を載せない', () => {
    type ByIdOutput = Awaited<ReturnType<RouterClient<AppRouter>['tags']['byId']>>

    expectTypeOf<ByIdOutput['id']>().toEqualTypeOf<number>()
    expectTypeOf<ByIdOutput['id']>().not.toEqualTypeOf<TagId>()
    expectTypeOf<ByIdOutput>().toEqualTypeOf<{
      id: number
      name: string
      pinned: boolean
      sortOrder: number
      color: string | null
    }>()
  })
})
