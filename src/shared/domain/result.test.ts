import { describe, expect, test } from 'vitest'

import { err, ok } from './result'

describe('Result', () => {
  test('ok wraps a value', () => {
    expect(ok(42)).toStrictEqual({ ok: true, value: 42 })
  })

  test('err wraps an error', () => {
    expect(err({ code: 'bookmark-not-found' })).toStrictEqual({
      ok: false,
      error: { code: 'bookmark-not-found' }
    })
  })
})
