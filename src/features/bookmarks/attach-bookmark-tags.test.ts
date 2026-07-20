import { describe, expect, test } from 'vitest'

import { attachTagsToBookmarks } from './attach-bookmark-tags'

describe('attachTagsToBookmarks', () => {
  test('attaches tags grouped by bookmark id', () => {
    const bookmarks = [
      { id: 'b1', title: 'One' },
      { id: 'b2', title: 'Two' },
      { id: 'b3', title: 'Three' }
    ]

    const result = attachTagsToBookmarks(bookmarks, [
      { bookmarkId: 'b1', id: 1, name: 'alpha' },
      { bookmarkId: 'b2', id: 2, name: 'beta' },
      { bookmarkId: 'b1', id: 3, name: 'gamma' }
    ])

    expect(result).toStrictEqual([
      {
        id: 'b1',
        title: 'One',
        tags: [
          { id: 1, name: 'alpha' },
          { id: 3, name: 'gamma' }
        ]
      },
      {
        id: 'b2',
        title: 'Two',
        tags: [{ id: 2, name: 'beta' }]
      },
      {
        id: 'b3',
        title: 'Three',
        tags: []
      }
    ])
  })

  test('returns empty tags when tag rows are empty', () => {
    const result = attachTagsToBookmarks([{ id: 'b1' }], [])
    expect(result).toStrictEqual([{ id: 'b1', tags: [] }])
  })
})
