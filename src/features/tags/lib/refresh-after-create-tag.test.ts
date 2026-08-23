import { describe, expect, test, vi } from 'vitest'

import { refreshAfterCreateTag } from './refresh-after-create-tag'

describe('refreshAfterCreateTag', () => {
  test('does not reject when route invalidation fails', async () => {
    const invalidate = vi.fn(() => Promise.reject(new Error('loader failed'))),
     consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      refreshAfterCreateTag({ invalidate })
    }).not.toThrow()

    await vi.waitFor(() => {
      expect(invalidate).toHaveBeenCalledOnce()
      expect(consoleError).toHaveBeenCalled()
    })

    consoleError.mockRestore()
  })
})
