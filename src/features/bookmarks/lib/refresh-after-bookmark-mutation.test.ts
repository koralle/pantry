import { describe, expect, test, vi } from 'vitest'

import { refreshAfterBookmarkMutation } from './refresh-after-bookmark-mutation'

describe('refreshAfterBookmarkMutation', () => {
  test('route の再取得が失敗しても reject せず、操作名をログに残す', async () => {
    const invalidate = vi.fn(() => Promise.reject(new Error('loader failed')))
    const removeQueries = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      refreshAfterBookmarkMutation({ invalidate }, { removeQueries } as never, 'UpdateBookmark')
    }).not.toThrow()

    await vi.waitFor(() => {
      expect(removeQueries).toHaveBeenCalledOnce()
      expect(invalidate).toHaveBeenCalledOnce()
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to refresh route data after UpdateBookmark',
        expect.any(Error)
      )
    })

    consoleError.mockRestore()
  })
})
