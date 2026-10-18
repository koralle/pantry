import * as v from "valibot";

/** 未検証の文字列を所有者の絞り込みへ渡せないよう brand にする。 */
export const userIdSchema = v.pipe(v.string(), v.nonEmpty(), v.brand("UserId"));

export type UserId = v.InferOutput<typeof userIdSchema>;
