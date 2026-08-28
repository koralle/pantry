import { getAuthenticatorName } from '@better-auth/passkey'

export function passkeyDisplayName(passkey: {
  readonly name?: string | null
  readonly aaguid?: string | null
}): string {
  const customName = passkey.name?.trim()
  if (customName) {
    return customName
  }

  return getAuthenticatorName(passkey.aaguid) ?? 'パスキー'
}
