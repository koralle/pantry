import * as v from 'valibot'

const numericQueryParam = v.pipe(
  v.union([v.string(), v.number()]),
  v.toNumber(),
  v.integer(),
  v.minValue(0)
)

/** 大きな limit での一括取得（DoS）を防ぐ上限。 */
const limitQueryParam = v.pipe(numericQueryParam, v.maxValue(50))

export const offsetPaginationQuerySchema = v.object({
  limit: v.pipe(v.optional(limitQueryParam, 50)),
  offset: v.pipe(v.optional(numericQueryParam, 0))
})

export type OffsetPaginationQuery = v.InferOutput<typeof offsetPaginationQuerySchema>
