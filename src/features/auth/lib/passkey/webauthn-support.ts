interface WebAuthnGlobals {
  readonly PublicKeyCredential?: unknown;
}

const publicKeyCredential = (
  globals: WebAuthnGlobals
): typeof PublicKeyCredential | undefined =>
  typeof globals.PublicKeyCredential === "function"
    ? (globals.PublicKeyCredential as typeof PublicKeyCredential)
    : undefined;

export const isWebAuthnAvailable = (
  globals: WebAuthnGlobals = globalThis
): boolean => publicKeyCredential(globals) !== undefined;
