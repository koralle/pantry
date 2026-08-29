import { describe, expect, test } from 'vitest'

import {
  getPasskeyManageErrorMessage,
  getPasskeyRegisterErrorMessage,
  getPasskeySignInErrorMessage
} from './passkey.messages'

describe('passkey user-facing messages', () => {
  test('sign-in cancel is silent', () => {
    expect(getPasskeySignInErrorMessage({ code: 'AUTH_CANCELLED' })).toBeNull()
  })

  test('sign-in failure tells the user they can retry or use a password', () => {
    expect(getPasskeySignInErrorMessage({ code: 'AUTHENTICATION_FAILED' })).toBe(
      'パスキー認証に失敗しました。もう一度試すか、メールとパスワードでログインしてください'
    )
  })

  test('registration cancel is silent', () => {
    expect(getPasskeyRegisterErrorMessage({ code: 'ERROR_CEREMONY_ABORTED' })).toBeNull()
    expect(getPasskeyRegisterErrorMessage({ code: 'REGISTRATION_CANCELLED' })).toBeNull()
  })

  test('duplicate authenticator is explained', () => {
    expect(getPasskeyRegisterErrorMessage({ code: 'PREVIOUSLY_REGISTERED' })).toBe(
      'この認証器のパスキーはすでに登録されています'
    )
    expect(
      getPasskeyRegisterErrorMessage({ code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED' })
    ).toBe('この認証器のパスキーはすでに登録されています')
  })

  test('expired session is explained for management operations', () => {
    expect(getPasskeyManageErrorMessage({ code: 'SESSION_REQUIRED', status: 401 })).toBe(
      'セッションの有効期限が切れました。再度ログインしてください'
    )
    expect(getPasskeyManageErrorMessage({ status: 401 })).toBe(
      'セッションの有効期限が切れました。再度ログインしてください'
    )
  })

  test('expired session is explained when registration requires a session', () => {
    expect(getPasskeyRegisterErrorMessage({ code: 'SESSION_REQUIRED' })).toBe(
      'セッションの有効期限が切れました。再度ログインしてください'
    )
    expect(getPasskeyRegisterErrorMessage({ code: 'SESSION_NOT_FRESH', status: 403 })).toBe(
      'セッションの有効期限が切れました。再度ログインしてください'
    )
  })

  test('stale session is explained for management operations', () => {
    expect(getPasskeyManageErrorMessage({ code: 'SESSION_NOT_FRESH', status: 403 })).toBe(
      'セッションの有効期限が切れました。再度ログインしてください'
    )
  })
})
