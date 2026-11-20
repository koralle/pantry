interface WebAuthnGlobals {
  readonly PublicKeyCredential?: unknown;
}

const isPublicKeyCredentialConstructor = (
  value: unknown
): value is typeof PublicKeyCredential => typeof value === "function";

/**
 * WebAuthn は browser でのみ生える。`globalThis` をそのまま読むと
 * SSR（workerd / node）で ReferenceError になるため注入可能にしてある。
 */
const publicKeyCredential = (
  globals: WebAuthnGlobals
): typeof PublicKeyCredential | undefined => {
  const { PublicKeyCredential: credential } = globals;
  return isPublicKeyCredentialConstructor(credential) ? credential : undefined;
};

export const isWebAuthnAvailable = (
  globals: WebAuthnGlobals = globalThis
): boolean => publicKeyCredential(globals) !== undefined;
