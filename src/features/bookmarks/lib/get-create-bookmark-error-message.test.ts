import { ORPCError } from '@orpc/client'
import { describe, expect, test } from 'vitest'

import { getCreateBookmarkErrorMessage } from './get-create-bookmark-error-message'

describe('getCreateBookmarkErrorMessage', () => {
  test('Error の class 名では判定しない', () => {
    const error = new Error('duplicate')
    error.name = 'DuplicateUrlError'
    expect(getCreateBookmarkErrorMessage(error)).toBe('ブックマークの保存に失敗しました')
  })

  test('UNAUTHORIZED は null を返し、redirect とフォームエラーを重ねない', () => {
    const error = new ORPCError('UNAUTHORIZED', { defined: true })
    expect(getCreateBookmarkErrorMessage(error)).toBeNull()
  })

  test('duplicate-url を表示用メッセージへ写す', () => {
    const error = new ORPCError('duplicate-url', { defined: true, status: 409 })
    expect(getCreateBookmarkErrorMessage(error)).toBe('同じURLのブックマークが既にあります')
  })

  test('invalid-tag を表示用メッセージへ写す', () => {
    const error = new ORPCError('invalid-tag', { defined: true, status: 409 })
    expect(getCreateBookmarkErrorMessage(error)).toBe('保存できないタグ情報が含まれています')
  })

  test('未知のエラーは汎用メッセージへ写す', () => {
    expect(getCreateBookmarkErrorMessage(new Error('internal detail'))).toBe(
      'ブックマークの保存に失敗しました'
    )
    expect(getCreateBookmarkErrorMessage(null)).toBe('ブックマークの保存に失敗しました')
  })
})
