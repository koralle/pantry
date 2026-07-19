import * as v from 'valibot'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { ensureSession, fetchPageTitle } = vi.hoisted(() => ({
  ensureSession: vi.fn(),
  fetchPageTitle: vi.fn()
}))

vi.mock('@tanstack/react-start', async () => {
  const valibot = await import('valibot')

  return {
    createServerFn: () => ({
      validator: (schema: Parameters<typeof valibot.parseAsync>[0]) => ({
        handler: (handler: (ctx: { data: unknown }) => unknown) => async (ctx: { data: unknown }) =>
          handler({ data: await valibot.parseAsync(schema, ctx.data) })
      })
    })
  }
})

vi.mock('../auth/auth.function', () => ({ ensureSession }))
vi.mock('./title-fetcher.server', () => ({ fetchPageTitle }))
vi.mock('../../db/index.server', () => ({ getDB: vi.fn() }))

import { fetchBookmarkTitle } from './bookmark.function'

describe('fetchBookmarkTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('does not fetch a page without a valid session', async () => {
    ensureSession.mockRejectedValueOnce(new Error('Unauthorized'))
    fetchPageTitle.mockResolvedValueOnce('Pantry')

    await expect(fetchBookmarkTitle({ data: { url: 'https://example.com' } })).rejects.toThrow(
      'Unauthorized'
    )
    expect(fetchPageTitle).not.toHaveBeenCalled()
  })

  test.each(['ftp://example.com', 'file:///etc/passwd'])(
    'rejects %s at the Server Function validation boundary',
    async (url) => {
      await expect(fetchBookmarkTitle({ data: { url } })).rejects.toBeInstanceOf(v.ValiError)
      expect(ensureSession).not.toHaveBeenCalled()
      expect(fetchPageTitle).not.toHaveBeenCalled()
    }
  )
})
