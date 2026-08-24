import { describe, expect, test } from 'vitest'

describe('server direct RPC client', () => {
  // Client.server 経由の初回は react-start/server の graph ごと読むため、
  // Workerd 上の初回呼び出しは既定の 5 秒に収まらないことがある。
  test('request headers の Cookie が procedure の getSession へ届く', async () => {
    const { createAppRouter } = await import('./create-app-router')
    const { createServerRpcClient } = await import('./client.server')

    let receivedCookie: string | null = null
    const router = createAppRouter({
      getSession: async (headers) => {
        receivedCookie = headers.get('cookie')
        return { id: 'user-1', name: 'koralle', email: 'koralle@example.com' }
      },
      insertTag: async () => ({ kind: 'created', id: 1 as never }),
      updateTag: async () => ({ kind: 'not-found' }),
      touchTag: async () => ({ kind: 'touched' }),
      listShelfTags: async () => [],
      listTags: async () => [],
      findTagById: async () => null,
      insertBookmark: async () => ({ kind: 'duplicate-url' }),
      fetchPageTitle: async () => ({ kind: 'unavailable' })
    })

    const client = createServerRpcClient(
      () => new Headers({ cookie: 'better-auth.session_token=ssr-cookie-value' }),
      router
    )

    await client.auth.session()

    expect(receivedCookie).toBe('better-auth.session_token=ssr-cookie-value')
  }, 30_000)
})
