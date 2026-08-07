import { parse } from 'valibot'
import { expect, test } from 'vitest'

import { PASSWORD_MAX_LENGTH } from '../domain/password-policy'
import { passwordSchema } from './sign-in-schema'

test('accepts a password at the maximum length', () => {
  const password = 'a'.repeat(PASSWORD_MAX_LENGTH)

  expect(parse(passwordSchema, password)).toBe(password)
})

test('rejects a password over the maximum length', () => {
  const password = 'a'.repeat(PASSWORD_MAX_LENGTH + 1)

  expect(() => parse(passwordSchema, password)).toThrow()
})
