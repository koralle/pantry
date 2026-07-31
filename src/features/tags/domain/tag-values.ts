import * as v from 'valibot'

export const tagIdSchema = v.pipe(v.number(), v.integer(), v.minValue(1), v.brand('TagId'))

export type TagId = v.InferOutput<typeof tagIdSchema>

export const tagNameSchema = v.pipe(
  v.string('タグ名を入力してください'),
  v.transform((value) => value.trim().toLowerCase()),
  v.nonEmpty('タグ名を入力してください'),
  v.maxLength(32, 'タグ名は32文字以内で入力してください'),
  v.brand('TagName')
)

export type TagName = v.InferOutput<typeof tagNameSchema>
