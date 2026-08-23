import { ORPCError } from '@orpc/client'
import { describe, expect, test } from 'vitest'

import { getCreateTagErrorMessage } from './get-create-tag-error-message'

describe('getCreateTagErrorMessage', () => {
  test('does not use Error class names', () => {
    const error = new Error('duplicate')
    error.name = 'TagNameAlreadyExistsError'
    expect(getCreateTagErrorMessage(error)).toBe('タグの作成に失敗しました')
  })

  test('returns null for UNAUTHORIZED so generic create failure is not shown', () => {
    const error = new ORPCError('UNAUTHORIZED', { defined: true })
    expect(getCreateTagErrorMessage(error)).toBeNull()
  })

  test('maps tag-name-already-exists to the duplicate name message', () => {
    const error = new ORPCError('tag-name-already-exists', { defined: true, status: 409 })
    expect(getCreateTagErrorMessage(error)).toBe('そのタグ名は既に存在します')
  })
})
