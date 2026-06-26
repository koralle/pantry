import * as v from 'valibot'

export const tagNameSchema = v.pipe(
  v.string('タグ名を入力してください'),
  v.transform((value) => value.trim().toLowerCase()),
  v.nonEmpty('タグ名を入力してください'),
  v.maxLength(32, 'タグ名は32文字以内で入力してください')
)

export type TagName = v.InferOutput<typeof tagNameSchema>
