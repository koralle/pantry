import { bookmarkUrlSchema } from "@pantry/api-contract/schemas/bookmark-values";
import * as v from "valibot";

/**
 * 貼り付けた文字列がブックマーク URL として妥当なら正規化した値を返す。
 * 一覧の貼付ショートカットはこの結果が null でないときだけ遷移する。
 */
export const pastedUrl = (raw: string): string | null => {
  const parsed = v.safeParse(bookmarkUrlSchema, raw.trim());
  return parsed.success ? parsed.output : null;
};
