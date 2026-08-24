import { describe, expect, test } from 'vitest'

import { isInternalPath } from './is-internal-path'

describe('isInternalPath', () => {
  test('アプリ内 path だけを許す', () => {
    expect(isInternalPath('/')).toBe(true)
    expect(isInternalPath('/bookmarks?tags=work#top')).toBe(true)
    expect(isInternalPath('//example.com')).toBe(false)
    expect(isInternalPath('https://example.com/path')).toBe(false)
    expect(isInternalPath('bookmarks')).toBe(false)
  })
})
