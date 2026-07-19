import * as v from 'valibot'

export const tursoCredentialValidators = {
  TURSO_DATABASE_URL: v.pipe(v.string(), v.url()),
  TURSO_AUTH_TOKEN: v.string()
}

export const tursoCredentialsSchema = v.object(tursoCredentialValidators)

export function parseTursoCredentials(input: unknown) {
  return v.parse(tursoCredentialsSchema, input)
}
