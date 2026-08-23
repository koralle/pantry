import { describe, expect, test, vi } from 'vitest'

import type { UserId } from '../../auth/domain/auth-values'
import { executeDeleteBookmark } from './delete-bookmark'
import type { SoftDeleteBookmark } from './delete-bookmark'

const userId = 'user-1' as UserId
const bookmarkId = '019fae92-3bb0-78cd-b488-65ce0e26a001'

function stubPort(output: Awaited<ReturnType<SoftDeleteBookmark>>) {
  const softDeleteBookmark: SoftDeleteBookmark = vi.fn(async () => output)
  return { softDeleteBookmark }
}

describe('executeDeleteBookmark', () => {
  test('成功時は port の deleted を actor と id 付きで返す', async () => {
    const { softDeleteBookmark } = stubPort({ kind: 'deleted', id: bookmarkId })

    const result = await executeDeleteBookmark({
      softDeleteBookmark,
      userId,
      command: { id: bookmarkId }
    })

    expect(softDeleteBookmark).toHaveBeenCalledWith({ userId, id: bookmarkId })
    expect(result).toEqual({ kind: 'deleted', id: bookmarkId })
  })

  test('port の not-found をそのまま返す', async () => {
    const { softDeleteBookmark } = stubPort({ kind: 'bookmark-not-found' })

    const result = await executeDeleteBookmark({
      softDeleteBookmark,
      userId,
      command: { id: 'missing' }
    })

    expect(result).toEqual({ kind: 'bookmark-not-found' })
  })

  test('未知の障害は包み直さず throw する', async () => {
    const softDeleteBookmark: SoftDeleteBookmark = vi.fn(async () => {
      throw new Error('disk exploded')
    })

    await expect(
      executeDeleteBookmark({
        softDeleteBookmark,
        userId,
        command: { id: bookmarkId }
      })
    ).rejects.toThrow('disk exploded')
  })
})
