import { describe, expect, test } from 'vitest'

import {
  canOfferCreateTag,
  filterTagCandidates,
  resolveCreateTagConflict,
  toggleSelectedTag
} from './lib'

const tags = [
  { id: 1, name: 'React' },
  { id: 2, name: 'TypeScript' },
  { id: 3, name: 'Cloudflare' },
  { id: 4, name: 'Workers' }
] as const

describe('filterTagCandidates', () => {
  test('空の検索では元の並びを保ったまま全件を返す', () => {
    expect(filterTagCandidates(tags, '').map((tag) => tag.id)).toEqual([1, 2, 3, 4])
    expect(filterTagCandidates(tags, '   ').map((tag) => tag.id)).toEqual([1, 2, 3, 4])
  })

  test('正規化後の部分一致で絞り、相対順序を維持する', () => {
    expect(filterTagCandidates(tags, 't').map((tag) => tag.name)).toEqual(['React', 'TypeScript'])
    expect(filterTagCandidates(tags, '  SCRIPT  ').map((tag) => tag.name)).toEqual(['TypeScript'])
  })

  test('一致が無くても配列を空で返し、並び替えはしない', () => {
    expect(filterTagCandidates(tags, 'python')).toEqual([])
  })

  test('51件目以降も部分一致で残る', () => {
    const many = Array.from({ length: 51 }, (_, index) => ({
      id: index + 1,
      name: `Tag${String(index + 1)}`
    }))
    expect(filterTagCandidates(many, 'Tag51').map((tag) => tag.id)).toEqual([51])
  })
})

describe('canOfferCreateTag', () => {
  test('候補の読み込みが完了していない間は作成操作を出さない', () => {
    expect(
      canOfferCreateTag({
        query: 'Python',
        tags,
        tagsReady: false
      })
    ).toBe(false)
  })

  test('無効なタグ名では作成操作を出さない', () => {
    expect(canOfferCreateTag({ query: '', tags, tagsReady: true })).toBe(false)
    expect(canOfferCreateTag({ query: '   ', tags, tagsReady: true })).toBe(false)
    expect(canOfferCreateTag({ query: 'a'.repeat(33), tags, tagsReady: true })).toBe(false)
  })

  test('全タグに同名がある場合は作成操作を出さない', () => {
    expect(canOfferCreateTag({ query: 'react', tags, tagsReady: true })).toBe(false)
    expect(canOfferCreateTag({ query: '  TypeScript  ', tags, tagsReady: true })).toBe(false)
  })

  test('有効で同名が無い場合だけ作成操作を出せる', () => {
    expect(canOfferCreateTag({ query: 'Python', tags, tagsReady: true })).toBe(true)
  })
})

describe('resolveCreateTagConflict', () => {
  test('正規化同名の既存タグを特定する', () => {
    expect(resolveCreateTagConflict({ query: '  typescript ', tags })).toEqual({
      id: 2,
      name: 'TypeScript'
    })
  })

  test('特定できない場合は null', () => {
    expect(resolveCreateTagConflict({ query: 'Python', tags })).toBeNull()
  })
})

describe('toggleSelectedTag', () => {
  test('未選択なら末尾に追加し、同じ id は重複させない', () => {
    const selected = [{ id: 1, name: 'React' }]
    expect(toggleSelectedTag(selected, { id: 2, name: 'TypeScript' })).toEqual([
      { id: 1, name: 'React' },
      { id: 2, name: 'TypeScript' }
    ])
    expect(toggleSelectedTag(selected, { id: 1, name: 'React' })).toEqual([])
  })
})
