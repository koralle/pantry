const parseBetterAuthUrl = (value: string): URL => {
  try {
    return new URL(value);
  } catch {
    throw new Error(`BETTER_AUTH_URL is not a valid URL: ${value}`);
  }
};

/**
 * apps/web/src/features/auth/lib/passkey/plugin-options.ts の一時的な複製。
 * PR 3 で web 側の Better Auth を廃止するときに web のコピーを削除し、
 * このファイルを @pantry/api の正本として残す。
 */
export const passkeyPluginOptions = (betterAuthUrl: string) => {
  const url = parseBetterAuthUrl(betterAuthUrl);

  return {
    origin: url.origin,
    rpID: url.hostname,
    rpName: "Pantry",
  };
};
