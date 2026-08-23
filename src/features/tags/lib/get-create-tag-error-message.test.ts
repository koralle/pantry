import { ORPCError } from '@orpc/client'
import { describe, expect, test } from 'vitest'

import { getCreateTagErrorMessage } from './get-create-tag-error-message'

describe('getCreateTagErrorMessage', () => {
  test('Error の class 名では判定しない', () => {
    const error = new Error('duplicate')
    error.name = 'TagNameAlreadyExistsError'
    expect(getCreateTagErrorMessage(error)).toBe('タグの作成に失敗しました')
  })

  test('UNAUTHORIZED は null を返し、汎用の作成失敗文を出さない', () => {
    const error = new ORPCError('UNAUTHORIZED', { defined: true })
    expect(getCreateTagErrorMessage(error)).toBeNull()
  })

  test('tag-name-already-exists を同名エラー文へ写す', () => {
    const error = new ORPCError('tag-name-already-exists', { defined: true, status: 409 })
    expect(getCreateTagErrorMessage(error)).toBe('そのタグ名は既に存在します')
  })
})
