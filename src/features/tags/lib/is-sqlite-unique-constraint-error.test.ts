import { describe, expect, test } from 'vitest'

import { isSqliteUniqueConstraintError } from './is-sqlite-unique-constraint-error'

describe('isSqliteUniqueConstraintError', () => {
  test('detects nested SQLITE unique constraint codes', () => {
    const error = Object.assign(new Error('UNIQUE'), {
      cause: { code: 'SQLITE_CONSTRAINT_UNIQUE' }
    })
    expect(isSqliteUniqueConstraintError(error)).toBe(true)
  })

  test('rejects unrelated errors', () => {
    expect(isSqliteUniqueConstraintError(new Error('nope'))).toBe(false)
  })
})
