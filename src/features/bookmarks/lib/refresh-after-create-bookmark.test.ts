import { describe, expect, test, vi } from 'vitest'

import { refreshAfterCreateBookmark } from './refresh-after-create-bookmark'

describe('refreshAfterCreateBookmark', () => {
  test('route の再取得が失敗しても reject しない', async () => {
    const invalidate = vi.fn(() => Promise.reject(new Error('loader failed')))
    const removeQueries = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      refreshAfterCreateBookmark({ invalidate }, { removeQueries } as never)
    }).not.toThrow()

    await vi.waitFor(() => {
      expect(removeQueries).toHaveBeenCalledOnce()
      expect(invalidate).toHaveBeenCalledOnce()
      expect(consoleError).toHaveBeenCalled()
    })

    consoleError.mockRestore()
  })
})
