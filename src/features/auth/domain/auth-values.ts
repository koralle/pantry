import * as v from 'valibot'

export const userIdSchema = v.pipe(v.string(), v.nonEmpty(), v.brand('UserId'))

export type UserId = v.InferOutput<typeof userIdSchema>

/**
 * Client へ出してよい session の写像。Better Auth 内部の
 * session token やそれ以外の user 列はここを通らない。
 */
export type SessionUser = {
  readonly id: string
  readonly name: string
  readonly email: string
}
