import { describe, expect, test, vi } from 'vitest'

import type { AppDb } from '../../../db/app-db'
import { loadSelectableTags } from './load-selectable-tags'
import { createThenableChain, tagName, userId } from './test-helpers'

describe('loadSelectableTags', () => {
  test('returns Ok(SelectableTag[]) for the actor', async () => {
    const select = vi.fn().mockReturnValue(
      createThenableChain([
        { id: 1, name: 'alpha' },
        { id: 2, name: 'beta' }
      ])
    )

    const result = await loadSelectableTags({
      db: { select } as unknown as AppDb,
      actorId: userId('user-1')
    })

    expect(result).toStrictEqual({
      ok: true,
      value: [
        { id: 1, name: tagName('alpha') },
        { id: 2, name: tagName('beta') }
      ]
    })
  })

  test('returns Ok([]) when the actor has no tags', async () => {
    const select = vi.fn().mockReturnValue(createThenableChain([]))

    const result = await loadSelectableTags({
      db: { select } as unknown as AppDb,
      actorId: userId('user-1')
    })

    expect(result).toStrictEqual({ ok: true, value: [] })
  })

  test('returns Err(unexpected-error) when the query fails', async () => {
    const select = vi.fn().mockReturnValue({
      from: () => ({
        where: () => ({
          orderBy: () => Promise.reject(new Error('db down'))
        })
      })
    })

    const result = await loadSelectableTags({
      db: { select } as unknown as AppDb,
      actorId: userId('user-1')
    })

    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'unexpected-error' }
    })
  })
})
