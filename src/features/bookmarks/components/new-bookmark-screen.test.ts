import { describe, expect, test } from 'vitest'

import { buildNewBookmarkCommand } from './new-bookmark-command'

describe('buildNewBookmarkCommand', () => {
  test('新規ブックマークではタグを空配列で送る', () => {
    expect(
      buildNewBookmarkCommand({
        url: 'https://example.com/article',
        title: 'Example Article',
        note: 'メモ'
      })
    ).toStrictEqual({
      url: 'https://example.com/article',
      title: 'Example Article',
      note: 'メモ',
      tags: []
    })
  })
})
