import { describe, expect, test } from 'vitest'

import { TagNameAlreadyExistsError } from './tag-errors'

describe('TagNameAlreadyExistsError', () => {
  test('name とメッセージが期待通り', () => {
    const error = new TagNameAlreadyExistsError()

    expect(error.name).toBe('TagNameAlreadyExistsError')
    expect(error.message).toBe('タグ名が既に存在します')
  })

  test('Error のインスタンスでもある', () => {
    const error = new TagNameAlreadyExistsError()

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TagNameAlreadyExistsError)
  })
})
