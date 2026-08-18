import { describe, expect, test } from 'vitest'

import { sortTagsForNav } from './tag-shelf'
import type { ShelfTag } from './tag-shelf'

const base = (partial: Partial<ShelfTag> & Pick<ShelfTag, 'id' | 'name'>): ShelfTag => ({
  pinned: false,
  sortOrder: 0,
  color: null,
  lastUsedAt: null,
  bookmarkCount: 0,
  ...partial
})

describe('sortTagsForNav', () => {
  test('pinned first then sortOrder then name', () => {
    const sorted = sortTagsForNav([
      base({ id: 1, name: 'b', pinned: false, sortOrder: 0 }),
      base({ id: 2, name: 'a', pinned: true, sortOrder: 2 }),
      base({ id: 3, name: 'c', pinned: true, sortOrder: 1 })
    ])
    expect(sorted.map((t) => t.id)).toEqual([3, 2, 1])
  })
})
