import { describe, expect, test } from 'vitest'

import { formatPasskeyCreatedAt } from './format-created-at'

describe('formatPasskeyCreatedAt', () => {
  test('formats a UTC timestamp in Asia/Tokyo', () => {
    expect(formatPasskeyCreatedAt('2026-08-28T03:00:00.000Z')).toBe('2026/08/28 12:00')
    expect(formatPasskeyCreatedAt(new Date('2026-08-28T03:00:00.000Z'))).toBe('2026/08/28 12:00')
  })
})
