import { E2E_BETTER_AUTH_SECRET, E2E_ORIGIN, E2E_TURSO_AUTH_TOKEN, E2E_USER } from './constants'

export function applyE2eProcessEnv(libsqlUrl: string): void {
  process.env['TURSO_CONNECTION_URL'] = libsqlUrl
  process.env['TURSO_AUTH_TOKEN'] = E2E_TURSO_AUTH_TOKEN
  process.env['BETTER_AUTH_SECRET'] = E2E_BETTER_AUTH_SECRET
  process.env['BETTER_AUTH_URL'] = E2E_ORIGIN
}

export async function ensureE2eUser(libsqlUrl: string): Promise<void> {
  applyE2eProcessEnv(libsqlUrl)
  const { auth } = await import('../auth')
  await auth.api.createUser({
    body: {
      email: E2E_USER.email,
      name: E2E_USER.name,
      password: E2E_USER.password
    }
  })
}
