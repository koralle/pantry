import { ErrorFactory } from '@praha/error-factory'

export class TagNameAlreadyExistsError extends ErrorFactory({
  name: 'TagNameAlreadyExistsError',
  message: 'タグ名が既に存在します'
}) {}
