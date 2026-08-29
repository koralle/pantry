import { describe, expect, test } from 'vitest'

import { passkeyDisplayName } from './passkey.display-name'

describe('passkeyDisplayName', () => {
  test('uses the user-set name when it is non-empty', () => {
    expect(
      passkeyDisplayName({
        name: '仕事用キー',
        aaguid: 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4'
      })
    ).toBe('仕事用キー')
  })

  test('trims the user-set name before using it', () => {
    expect(
      passkeyDisplayName({
        name: '  自宅  ',
        aaguid: null
      })
    ).toBe('自宅')
  })

  test('falls back to the authenticator name when the user name is unset', () => {
    expect(
      passkeyDisplayName({
        name: null,
        aaguid: 'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4'
      })
    ).toBe('Google Password Manager')
    expect(
      passkeyDisplayName({
        name: '',
        aaguid: 'bada5566-a7aa-401f-bd96-45619a55120d'
      })
    ).toBe('1Password')
  })

  test('treats a whitespace-only name as unset', () => {
    expect(
      passkeyDisplayName({
        name: '   ',
        aaguid: 'bada5566-a7aa-401f-bd96-45619a55120d'
      })
    ).toBe('1Password')
  })

  test('falls back to パスキー when the authenticator cannot be identified', () => {
    expect(
      passkeyDisplayName({
        name: null,
        aaguid: '00000000-0000-0000-0000-000000000000'
      })
    ).toBe('パスキー')
    expect(
      passkeyDisplayName({
        name: null,
        aaguid: null
      })
    ).toBe('パスキー')
    expect(
      passkeyDisplayName({
        name: null,
        aaguid: 'ffffffff-ffff-ffff-ffff-ffffffffffff'
      })
    ).toBe('パスキー')
  })
})
