import * as v from 'valibot'

export const tagSchema = v.object({
  id: v.number(),
  name: v.string()
})

export type Tag = v.InferInput<typeof tagSchema>
