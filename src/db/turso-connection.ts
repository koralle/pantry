export type TursoConnectionEnv = {
  readonly TURSO_CONNECTION_URL?: string
  readonly TURSO_AUTH_TOKEN?: string
}

export type TursoConnection = {
  readonly url: string
  readonly authToken: string
}

export function resolveTursoConnection(env: TursoConnectionEnv): TursoConnection {
  const url = env.TURSO_CONNECTION_URL
  if (url === undefined || url.length === 0) {
    throw new Error('TURSO_CONNECTION_URL is not defined')
  }

  const authToken = env.TURSO_AUTH_TOKEN
  if (authToken === undefined) {
    throw new Error('TURSO_AUTH_TOKEN is not defined')
  }

  return { url, authToken }
}
