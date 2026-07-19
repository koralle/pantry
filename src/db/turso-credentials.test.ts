import { describe, expect, test } from 'vitest'

import { parseTursoCredentials } from './turso-credentials'

describe('parseTursoCredentials', () => {
  test('rejects an invalid Worker URL before Drizzle initialization', () => {
    expect(() =>
      parseTursoCredentials({
        TURSO_DATABASE_URL: 'not-a-url',
        TURSO_AUTH_TOKEN: 'token'
      })
    ).toThrow()
  })

  test('rejects a missing Worker token before Drizzle initialization', () => {
    expect(() =>
      parseTursoCredentials({
        TURSO_DATABASE_URL: 'libsql://verification.turso.io'
      })
    ).toThrow()
  })
})
