import { uuidv7 } from 'uuidv7'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { userIdSchema } from './auth-values'

describe('userIdSchema', () => {
  test('accepts a non-empty user id', () => {
    const id = uuidv7()
    const result = v.safeParse(userIdSchema, id)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output).toBe(id)
    }
  })

  test('rejects an empty string', () => {
    expect(v.safeParse(userIdSchema, '').success).toBe(false)
  })
})
