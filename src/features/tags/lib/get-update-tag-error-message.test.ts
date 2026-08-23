import { ORPCError } from '@orpc/client'
import { describe, expect, test } from 'vitest'

import { getUpdateTagErrorMessage } from './get-update-tag-error-message'

describe('getUpdateTagErrorMessage', () => {
  test('Error class名では判定しない', () => {
    const error = new Error('duplicate')
    error.name = 'TagNameAlreadyExistsError'
    expect(getUpdateTagErrorMessage(error)).toBe('タグの更新に失敗しました')
  })

  test('UNAUTHORIZEDはnullを返す', () => {
    expect(
      getUpdateTagErrorMessage(new ORPCError('UNAUTHORIZED', { defined: true, status: 401 }))
    ).toBeNull()
  })

  test('tag-name-already-existsを同名エラーへ写す', () => {
    expect(
      getUpdateTagErrorMessage(
        new ORPCError('tag-name-already-exists', { defined: true, status: 409 })
      )
    ).toBe('そのタグ名は既に存在します')
  })

  test('tag-not-foundを対象なしへ写す', () => {
    expect(
      getUpdateTagErrorMessage(new ORPCError('tag-not-found', { defined: true, status: 404 }))
    ).toBe('更新するタグが見つかりません')
  })
})
