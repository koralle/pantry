import * as v from 'valibot'

export const userIdSchema = v.pipe(v.string(), v.nonEmpty(), v.brand('UserId'))

export type UserId = v.InferOutput<typeof userIdSchema>
