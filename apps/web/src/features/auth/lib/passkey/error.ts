const CANCELLED_CODES = new Set([
  "AUTH_CANCELLED",
  "REGISTRATION_CANCELLED",
  "ERROR_CEREMONY_ABORTED",
]);

export const isPasskeyUserCancelled = (
  error?: { readonly code?: string | undefined } | null
): boolean => {
  const code = error?.code;
  return code !== null && code !== undefined && CANCELLED_CODES.has(code);
};
