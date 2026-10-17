import { toTagName } from "@pantry/db/tag-name";
import * as v from "valibot";

export const tagIdSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
  v.brand("TagId")
);

export type TagId = v.InferOutput<typeof tagIdSchema>;

// 正規化の規則は保存値の定義として packages/db が持つ（seed も同じ関数を使う）。
export { toTagName } from "@pantry/db/tag-name";
export type { TagName } from "@pantry/db/tag-name";

export const uniqueNormalizedTagNames = (
  inputs: readonly string[]
): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const input of inputs) {
    const { normalized } = toTagName(input);
    if (normalized !== "" && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
};

export const tagNamesMatch = (left: string, right: string): boolean =>
  toTagName(left).normalized === toTagName(right).normalized;

export const tagNameSchema = v.pipe(
  v.string("タグ名を入力してください"),
  v.transform(toTagName),
  v.check((name) => name.display !== "", "タグ名を入力してください"),
  v.check(
    (name) => name.display.length <= 32,
    "タグ名は32文字以内で入力してください"
  )
);
