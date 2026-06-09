import { ErrorFactory } from '@praha/error-factory'

export class SignInError extends ErrorFactory({
  name: 'SignInError',
  message: 'Failed to authentication',
  fields: ErrorFactory.fields<{
    status: number
    statusText: string
    code?: string | undefined
  }>()
}) {}
