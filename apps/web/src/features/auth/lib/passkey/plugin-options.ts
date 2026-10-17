export const passkeyPluginOptions = (betterAuthUrl: string) => {
  const url = new URL(betterAuthUrl);

  return {
    origin: url.origin,
    rpID: url.hostname,
    rpName: "Pantry",
  };
};
