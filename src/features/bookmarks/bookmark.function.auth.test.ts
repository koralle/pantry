import { beforeEach, describe, expect, test, vi } from 'vitest'

const { ensureSession, fetchPageTitle } = vi.hoisted(() => ({
  ensureSession: vi.fn(),
  fetchPageTitle: vi.fn()
}))

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const builder = {
      validator: () => builder,
      handler: <T>(handler: T) => handler
    }

    return builder
  }
}))

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
})
