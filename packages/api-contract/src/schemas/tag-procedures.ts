import * as v from "valibot";

import { tagIdSchema, tagNameSchema } from "./tag-values";

/**
 * 省略項目に default を埋めないのは、未送信と「明示的な false / 0 / null」を同じにすると
 * 呼び出し側の意図が消えるため。
 */
export const createTagInputSchema = v.object({
  color: v.optional(v.nullable(v.string())),
  name: tagNameSchema,
  pinned: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
});

export type CreateTagInput = v.InferOutput<typeof createTagInputSchema>;

export const updateTagInputSchema = v.object({
  id: tagIdSchema,
  name: tagNameSchema,
  pinned: v.boolean(),
  // UI の NumberField は負数や小数も送り得るため、境界では数値型だけを強制する
  sortOrder: v.number(),
  color: v.nullable(
    // UI は固定パレット (#RRGGBB) のみだが、#RGB も CSS として有効なので許す
    v.pipe(v.string(), v.regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/))
  ),
});

export type UpdateTagValidatedInput = v.InferOutput<
  typeof updateTagInputSchema
>;

export const touchTagInputSchema = v.object({ id: tagIdSchema });

export const deleteTagInputSchema = v.object({ id: tagIdSchema });

export const tagByIdInputSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

export const shelfTagSchema = v.object({
  bookmarkCount: v.number(),
  color: v.nullable(v.string()),
  id: v.number(),
  lastUsedAt: v.nullable(v.date()),
  name: v.string(),
  pinned: v.boolean(),
  sortOrder: v.number(),
});

export type ShelfTag = v.InferOutput<typeof shelfTagSchema>;

export const tagRecordSchema = v.object({
  color: v.nullable(v.string()),
  id: v.number(),
  name: v.string(),
  pinned: v.boolean(),
  sortOrder: v.number(),
});

export type TagRecord = v.InferOutput<typeof tagRecordSchema>;

export const tagsListRowSchema = v.object({
  id: v.number(),
  name: v.string(),
});

export type TagsListRow = v.InferOutput<typeof tagsListRowSchema>;

/** client へ branded `TagId` を出すと、画面が Domain の組み立てを知っていることになるため plain な number にする。 */
export const tagIdOutputSchema = v.object({ id: v.number() });

export const touchTagOutputSchema = v.object({ ok: v.literal(true) });
