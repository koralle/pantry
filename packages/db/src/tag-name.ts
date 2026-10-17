/**
 * タグ名の表示形と、`tags.normalized_name`（ユーザーごとの一意制約）に入れる正規化形。
 *
 * trim → NFC → 小文字化の順に適用する。web のドメイン（入力検証・重複判定）と、
 * DB へ直接書き込む seed（apps/api/scripts）の両方がこの規則を使うので、保存される
 * 値の定義として packages/db に置く。依存を持たない純粋な関数なので、ブラウザ側の
 * コードから import しても DB ドライバは入らない（`@pantry/db/tag-name` だけを読む）。
 */
export interface TagName {
  readonly display: string;
  readonly normalized: string;
}

export const toTagName = (input: string): TagName => {
  const display = input.trim().normalize("NFC");
  return {
    display,
    normalized: display.toLowerCase(),
  };
};
