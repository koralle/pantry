import { ORPCError } from '@orpc/client'
import { describe, expect, test } from 'vitest'

import { toUpdateBookmarkFailureCode } from './update-bookmark-failure'

describe('toUpdateBookmarkFailureCode', () => {
  test('UNAUTHORIZED は null を返し、redirect とフォームエラーを重ねない', () => {
    expect(toUpdateBookmarkFailureCode(new ORPCError('UNAUTHORIZED', { defined: true }))).toBeNull()
  })

  test('既知の code はそのまま写す', () => {
    for (const code of ['duplicate-url', 'bookmark-not-found', 'invalid-tag'] as const) {
      expect(toUpdateBookmarkFailureCode(new ORPCError(code, { defined: true }))).toBe(code)
    }
  })

  test('未知の defined code は unexpected へ写す', () => {
    expect(
      toUpdateBookmarkFailureCode(new ORPCError('tag-name-already-exists', { defined: true }))
    ).toBe('unexpected')
  })

  test('非 defined な ORPCError（500 系）は unexpected へ写す', () => {
    expect(toUpdateBookmarkFailureCode(new ORPCError('INTERNAL_SERVER_ERROR'))).toBe('unexpected')
  })

  test('ORPCError 以外は unexpected へ写す', () => {
    expect(toUpdateBookmarkFailureCode(new Error('network down'))).toBe('unexpected')
  })
})
