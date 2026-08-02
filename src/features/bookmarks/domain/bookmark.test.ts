import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { tagIdSchema } from '../../tags/domain/tag-values'
import { assertUniqueTagIds } from './bookmark'

function tagId(value: number) {
  return v.parse(tagIdSchema, value)
}

describe('assertUniqueTagIds', () => {
  test('accepts unique tag ids including empty', () => {
    expect(assertUniqueTagIds([]).ok).toBe(true)
    expect(assertUniqueTagIds([tagId(1), tagId(2)]).ok).toBe(true)
  })

  test('rejects duplicate tag ids', () => {
    const result = assertUniqueTagIds([tagId(1), tagId(2), tagId(1)])
    expect(result).toStrictEqual({
      ok: false,
      error: { code: 'duplicate-tag-id', field: 'tags', tagId: 1 }
    })
  })
})
