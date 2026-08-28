type WebAuthnGlobals = {
  readonly PublicKeyCredential?: unknown
}

function publicKeyCredential(globals: WebAuthnGlobals): typeof PublicKeyCredential | undefined {
  return typeof globals.PublicKeyCredential === 'function'
    ? (globals.PublicKeyCredential as typeof PublicKeyCredential)
    : undefined
}

export function isWebAuthnAvailable(globals: WebAuthnGlobals = globalThis): boolean {
  return publicKeyCredential(globals) !== undefined
}

export async function isConditionalMediationAvailable(
  globals: WebAuthnGlobals = globalThis
): Promise<boolean> {
  const credential = publicKeyCredential(globals)
  if (credential === undefined) {
    return false
  }

  if (typeof credential.isConditionalMediationAvailable !== 'function') {
    return false
  }

  return await credential.isConditionalMediationAvailable()
}
