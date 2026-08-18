export function isSqliteUniqueConstraintError(error: unknown): boolean {
  let current: unknown = error
  while (current !== null && current !== undefined && typeof current === 'object') {
    if ('code' in current && typeof current.code === 'string') {
      if (
        current.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
        current.code === 'SQLITE_CONSTRAINT' ||
        current.code.includes('CONSTRAINT_UNIQUE')
      ) {
        return true
      }
    }
    if (!('cause' in current)) {
      break
    }
    current = current.cause
  }
  return false
}
