import * as v from 'valibot'

const numericQueryParam = v.pipe(
  v.union([v.string(), v.number()]),
  v.toNumber(),
  v.integer(),
  v.minValue(0)
)

export const offsetPaginationQuerySchema = v.object({
  limit: v.pipe(v.optional(numericQueryParam, 50), v.brand('limit')),
  offset: v.pipe(v.optional(numericQueryParam, 0), v.brand('offset'))
})

export type OffsetPaginationQuery = v.InferOutput<typeof offsetPaginationQuerySchema>
