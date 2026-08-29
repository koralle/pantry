const CANCELLED_CODES = new Set([
  'AUTH_CANCELLED',
  'REGISTRATION_CANCELLED',
  'ERROR_CEREMONY_ABORTED'
])

export function isPasskeyUserCancelled(
  error: { readonly code?: string | undefined } | null | undefined
): boolean {
  const code = error?.code
  return code != null && CANCELLED_CODES.has(code)
}
