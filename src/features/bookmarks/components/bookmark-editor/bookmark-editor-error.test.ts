import { describe, expect, test } from 'vitest'

import { tagId } from '../../application/test-helpers'
import { mapUpdateBookmarkError } from './bookmark-editor-error'

describe('mapUpdateBookmarkError', () => {
  test('bookmark-not-found を form summary へ振り分ける', () => {
    expect(mapUpdateBookmarkError({ code: 'bookmark-not-found' })).toStrictEqual({
      form: { summary: 'このブックマークは見つかりません' }
    })
  })

  test('duplicate-url を form summary + url field へ振り分ける', () => {
    const result = mapUpdateBookmarkError({ code: 'duplicate-url' })
    expect(result).toStrictEqual({
      form: {
        summary: '同じ URL のブックマークが既にあります',
        fields: { url: 'この URL は既に登録されています' }
      }
    })
  })

  test('invalid-title を form summary + title field へ振り分ける', () => {
    const result = mapUpdateBookmarkError({ code: 'invalid-title', field: 'title' })
    expect(result).toStrictEqual({
      form: {
        summary: '入力内容を確認してください',
        fields: { title: 'タイトルを入力してください' }
      }
    })
  })

  test('invalid-url を form summary + url field へ振り分ける', () => {
    const result = mapUpdateBookmarkError({ code: 'invalid-url', field: 'url' })
    expect(result).toStrictEqual({
      form: {
        summary: '入力内容を確認してください',
        fields: { url: '有効な URL を入力してください' }
      }
    })
  })

  test('duplicate-tag-id を tags 側だけへ振り分け、form へ混ぜない', () => {
    const result = mapUpdateBookmarkError({
      code: 'duplicate-tag-id',
      field: 'tags',
      tagId: tagId(1)
    })
    expect(result).toStrictEqual({ tags: '同じタグが重複しています' })
    expect(result.form).toBeUndefined()
  })

  test('invalid-tag: tag-not-owned を tags のみへ振り分ける', () => {
    const result = mapUpdateBookmarkError({
      code: 'invalid-tag',
      field: 'tags',
      cause: { code: 'tag-not-owned', tagId: tagId(1) }
    })
    expect(result).toStrictEqual({ tags: '選択したタグを利用できません' })
    expect(result.form).toBeUndefined()
  })

  test('invalid-tag: tag-not-found を tags のみへ振り分ける', () => {
    const result = mapUpdateBookmarkError({
      code: 'invalid-tag',
      field: 'tags',
      cause: { code: 'tag-not-found', tagId: tagId(2) }
    })
    expect(result).toStrictEqual({ tags: '選択したタグが見つかりません' })
    expect(result.form).toBeUndefined()
  })

  test('unexpected-error を form summary へ振り分ける', () => {
    expect(mapUpdateBookmarkError({ code: 'unexpected-error' })).toStrictEqual({
      form: { summary: '保存に失敗しました。時間をおいて再度お試しください' }
    })
  })
})
