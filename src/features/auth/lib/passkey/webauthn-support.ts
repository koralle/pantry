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

export const isConditionalMediationAvailable = async (
  globals: WebAuthnGlobals = globalThis
): Promise<boolean> => {
  const credential = publicKeyCredential(globals);
  if (credential === undefined) {
    return false;
  }

  if (typeof credential.isConditionalMediationAvailable !== "function") {
    return false;
  }

  return await credential.isConditionalMediationAvailable();
};
