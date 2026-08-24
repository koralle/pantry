import { describe, expect, test, vi } from 'vitest'

import { refreshAfterUpdateTag } from './refresh-after-update-tag'

describe('refreshAfterUpdateTag', () => {
  test('routeの再取得が失敗してもrejectしない', async () => {
    const invalidate = vi.fn(() => Promise.reject(new Error('loader failed')))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      refreshAfterUpdateTag({ invalidate })
    }).not.toThrow()

    await vi.waitFor(() => {
      expect(invalidate).toHaveBeenCalledOnce()
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to refresh route data after UpdateTag',
        expect.any(Error)
      )
    })

    consoleError.mockRestore()
  })
})
