import * as v from "valibot";

import { tagIdSchema, tagNameSchema } from "./tag-values";

/**
 * CreateTag の HTTP 直前の形。省略項目はここでは default を埋めない。
 * 未送信と「明示的な false / 0 / null」を同じにすると、呼び出し側の意図が消える。
 */
export const createTagInputSchema = v.object({
  color: v.optional(v.nullable(v.string())),
  name: tagNameSchema,
  pinned: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
});

export type CreateTagInput = v.InferOutput<typeof createTagInputSchema>;

/**
 * UpdateTag の HTTP 直前の形。full-replace 契約で、id を含む全 5 項目が必須。部分更新は受けない。
 * 省略は欠落のまま 400 になるため、呼び出し側は常に現状値を送ること。
 */
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

/** TouchTag の HTTP 直前の形。id は wire では plain number で、ここで TagId へ確定する。 */
export const touchTagInputSchema = v.object({ id: tagIdSchema });

/** DeleteTag の HTTP 直前の形。削除は id だけで確定する。 */
export const deleteTagInputSchema = v.object({ id: tagIdSchema });

export const tagByIdInputSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

/** 棚（sidebar・mobile shelf・タグ管理）が使う行。削除済み bookmark は数えない。 */
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

/**
 * タグ詳細・編集画面の写像。DB 行の残り（userId、正規化名、監査列）は載せない。
 */
export const tagRecordSchema = v.object({
  color: v.nullable(v.string()),
  id: v.number(),
  name: v.string(),
  pinned: v.boolean(),
  sortOrder: v.number(),
});

export type TagRecord = v.InferOutput<typeof tagRecordSchema>;

/** タグ紐付け表示など、id と名前だけあれば足りる読み取りの行。 */
export const tagsListRowSchema = v.object({
  id: v.number(),
  name: v.string(),
});

export type TagsListRow = v.InferOutput<typeof tagsListRowSchema>;

/**
 * 作成・更新・削除の成功形。Application の branded `TagId` は載せない。
 * brand は型システムの印で、JSON には残らない。client へ TagId を出すと、
 * 画面が Domain の組み立てを知っていることになってしまう。
 */
export const tagIdOutputSchema = v.object({ id: v.number() });

export const touchTagOutputSchema = v.object({ ok: v.literal(true) });
