import type { ErrorHandler } from 'hono'

import { AppError, errorResponse } from '../lib/error'

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json(errorResponse(err), err.statusCode as 400 | 401 | 404 | 409 | 500)
  }

  console.error('Unhandled error:', err)
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR' as const,
        message: 'Internal server error'
      }
    },
    500
  )
}
