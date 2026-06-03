import type { StatusCode } from 'hono/utils/http-status'

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'URL_CONFLICT'
  | 'TAG_CONFLICT'
  | 'INVALID_CURSOR'
  | 'CURSOR_MISMATCH'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    readonly statusCode: StatusCode,
    readonly code: ErrorCode,
    message?: string,
    readonly details?: string[]
  ) {
    super(message ?? code)
  }
}

export function errorResponse(error: AppError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {})
    }
  }
}
