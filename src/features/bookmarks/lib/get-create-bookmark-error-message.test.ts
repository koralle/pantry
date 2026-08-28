import { ORPCError } from '@orpc/client'
import { describe, expect, test } from 'vitest'

import {
  getCreateBookmarkErrorMessage,
  mapCreateBookmarkFailure
} from './get-create-bookmark-error-message'

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

  test('invalid-tag をタグを選び直す文言へ写す', () => {
    const error = new ORPCError('invalid-tag', { defined: true, status: 409 })
    expect(getCreateBookmarkErrorMessage(error)).toBe(
      '保存できないタグが含まれています。タグを選び直してください'
    )
  })

  test('未知のエラーは汎用メッセージへ写す', () => {
    expect(getCreateBookmarkErrorMessage(new Error('internal detail'))).toBe(
      'ブックマークの保存に失敗しました'
    )
    expect(getCreateBookmarkErrorMessage(null)).toBe('ブックマークの保存に失敗しました')
  })
})

describe('mapCreateBookmarkFailure', () => {
  test('invalid-tag をタグフィールドのエラーへ写す', () => {
    const error = new ORPCError('invalid-tag', { defined: true, status: 409 })
    expect(mapCreateBookmarkFailure(error)).toStrictEqual({
      summary: '保存できないタグが含まれています。タグを選び直してください',
      fields: { tags: '保存できないタグが含まれています。タグを選び直してください' }
    })
  })

  test('duplicate-url を URL フィールドのエラーへ写す', () => {
    const error = new ORPCError('duplicate-url', { defined: true, status: 409 })
    expect(mapCreateBookmarkFailure(error)).toStrictEqual({
      summary: '同じURLのブックマークが既にあります',
      fields: { url: 'この URL は既に登録されています' }
    })
  })

  test('UNAUTHORIZED の structured mapping は null', () => {
    expect(mapCreateBookmarkFailure(new ORPCError('UNAUTHORIZED', { defined: true }))).toBeNull()
  })
})
