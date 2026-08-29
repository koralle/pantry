import { describe, expect, test } from 'vitest'

import { isPasskeyUserCancelled } from './passkey-error'

describe('isPasskeyUserCancelled', () => {
  test('treats Better Auth cancel codes as user cancellation', () => {
    expect(isPasskeyUserCancelled({ code: 'AUTH_CANCELLED' })).toBe(true)
    expect(isPasskeyUserCancelled({ code: 'REGISTRATION_CANCELLED' })).toBe(true)
    expect(isPasskeyUserCancelled({ code: 'ERROR_CEREMONY_ABORTED' })).toBe(true)
  })

  test('does not treat other failures as cancellation', () => {
    expect(isPasskeyUserCancelled({ code: 'AUTHENTICATION_FAILED' })).toBe(false)
    expect(isPasskeyUserCancelled({ code: 'PREVIOUSLY_REGISTERED' })).toBe(false)
    expect(isPasskeyUserCancelled({ code: 'SESSION_REQUIRED' })).toBe(false)
    expect(isPasskeyUserCancelled(null)).toBe(false)
    expect(isPasskeyUserCancelled(undefined)).toBe(false)
  })
})
