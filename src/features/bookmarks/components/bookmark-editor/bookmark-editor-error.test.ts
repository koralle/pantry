import { describe, expect, test } from 'vitest'

import { mapUpdateBookmarkFailure } from './bookmark-editor-error'

describe('mapUpdateBookmarkFailure', () => {
  test('bookmark-not-found を form summary へ振り分ける', () => {
    expect(mapUpdateBookmarkFailure('bookmark-not-found')).toStrictEqual({
      form: { summary: 'このブックマークは見つかりません' }
    })
  })

  test('duplicate-url を form summary + url field へ振り分ける', () => {
    expect(mapUpdateBookmarkFailure('duplicate-url')).toStrictEqual({
      form: {
        summary: '同じ URL のブックマークが既にあります',
        fields: { url: 'この URL は既に登録されています' }
      }
    })
  })

  test('invalid-tag をタグフィールドのエラーへ振り分ける', () => {
    expect(mapUpdateBookmarkFailure('invalid-tag')).toStrictEqual({
      form: {
        summary: '保存できないタグが含まれています。タグを選び直してください',
        fields: { tags: '保存できないタグが含まれています。タグを選び直してください' }
      }
    })
  })

  test('unexpected を汎用 message へ振り分ける', () => {
    expect(mapUpdateBookmarkFailure('unexpected')).toStrictEqual({
      form: { summary: '保存に失敗しました。時間をおいて再度お試しください' }
    })
  })
})
