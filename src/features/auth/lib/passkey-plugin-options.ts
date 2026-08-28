export function passkeyPluginOptions(betterAuthUrl: string) {
  const url = new URL(betterAuthUrl)

  return {
    rpID: url.hostname,
    rpName: 'Pantry',
    origin: url.origin
  }
}
