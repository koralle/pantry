const parseBetterAuthUrl = (value: string): URL => {
  try {
    return new URL(value);
  } catch {
    throw new Error(`BETTER_AUTH_URL is not a valid URL: ${value}`);
  }
};

/**
 * passkey の rpID / origin を BETTER_AUTH_URL から導く。ブラウザは web の origin で
 * WebAuthn を行い、web が Request をそのまま転送するので、BETTER_AUTH_URL は
 * web の公開 URL と一致させる。
 */
export const passkeyPluginOptions = (betterAuthUrl: string) => {
  const url = parseBetterAuthUrl(betterAuthUrl);

  return {
    origin: url.origin,
    rpID: url.hostname,
    rpName: "Pantry",
  };
};
